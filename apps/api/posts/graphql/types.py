from __future__ import annotations

from datetime import datetime

import strawberry
from accounts.graphql.types import UserType
from django.db.models import Count, Exists, OuterRef
from posts.models import Comment, Post, PostMedia
from strawberry import Private
from strawberry.types import Info
from core.graphql.context import GraphQLContext


@strawberry.type
class PostMediaType:
    id: strawberry.ID
    file_url: str
    media_type: str
    width: int | None
    height: int | None
    duration_seconds: float | None
    order: int

    @classmethod
    def from_model(cls, media: PostMedia) -> "PostMediaType":
        return cls(
            id=strawberry.ID(str(media.pk)),
            file_url=media.file.url,
            media_type=media.media_type,
            width=media.width,
            height=media.height,
            duration_seconds=media.duration_seconds,
            order=media.order,
        )


@strawberry.type
class CommentType:
    id: strawberry.ID
    text: str
    created_at: datetime
    _model: Private[Comment]

    @strawberry.field
    def author(self) -> UserType:
        return UserType.from_model(self._model.author)

    @strawberry.field
    def replies(self) -> list["CommentType"]:
        return [
            CommentType.from_model(r)
            for r in self._model.replies.select_related("author").all()
        ]

    @classmethod
    def from_model(cls, comment: Comment) -> "CommentType":
        return cls(
            id=strawberry.ID(str(comment.pk)),
            text=comment.text,
            created_at=comment.created_at,
            _model=comment,
        )


@strawberry.type
class PostType:
    id: strawberry.ID
    caption: str
    location: str
    created_at: datetime
    likes_count: int
    comments_count: int
    is_liked: bool
    is_saved: bool

    _model: Private[Post]

    @strawberry.field
    def author(self) -> UserType:
        return UserType.from_model(self._model.author)

    @strawberry.field
    def media_items(self) -> list[PostMediaType]:
        return [PostMediaType.from_model(m) for m in self._model.media_items.all()]

    @classmethod
    def from_model(cls, post: Post, viewer_id: int | None = None) -> "PostType":
        # Prefer pre-annotated values to avoid N+1
        likes_count = getattr(post, "likes_count", None)
        if likes_count is None:
            likes_count = post.likes.count()

        comments_count = getattr(post, "comments_count", None)
        if comments_count is None:
            comments_count = post.comments.count()

        is_liked = getattr(post, "is_liked", None)
        if is_liked is None:
            is_liked = (
                post.likes.filter(user_id=viewer_id).exists()
                if viewer_id
                else False
            )

        is_saved = getattr(post, "is_saved", None)
        if is_saved is None:
            is_saved = (
                post.bookmarks.filter(user_id=viewer_id).exists()
                if viewer_id
                else False
            )

        return cls(
            id=strawberry.ID(str(post.pk)),
            caption=post.caption,
            location=post.location,
            created_at=post.created_at,
            likes_count=likes_count,
            comments_count=comments_count,
            is_liked=is_liked,
            is_saved=is_saved,
            _model=post,
        )


def annotate_posts(qs, viewer_id: int | None = None):
    """Annotate a Post QuerySet with counts and viewer-specific booleans."""
    from posts.models import Bookmark, Like

    qs = qs.annotate(
        likes_count=Count("likes", distinct=True),
        comments_count=Count("comments", distinct=True),
    )
    if viewer_id:
        qs = qs.annotate(
            is_liked=Exists(Like.objects.filter(post=OuterRef("pk"), user_id=viewer_id)),
            is_saved=Exists(Bookmark.objects.filter(post=OuterRef("pk"), user_id=viewer_id)),
        )
    return qs


@strawberry.type
class PostConnection:
    items: list[PostType]
    next_cursor: str | None
    has_more: bool
