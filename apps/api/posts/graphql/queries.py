import strawberry
from core.graphql.context import GraphQLContext
from core.graphql.permissions import IsAuthenticated
from posts.models import Post
from strawberry.types import Info

from .types import CommentType, PostConnection, PostType, annotate_posts


def _build_connection(qs, limit: int, viewer_id: int | None) -> PostConnection:
    batch = list(qs[: limit + 1])
    has_more = len(batch) > limit
    items = batch[:limit]
    return PostConnection(
        items=[PostType.from_model(p, viewer_id=viewer_id) for p in items],
        next_cursor=str(items[-1].pk) if has_more and items else None,
        has_more=has_more,
    )


@strawberry.type
class PostsQuery:
    @strawberry.field
    def guest_feed(
        self,
        cursor: str | None = None,
        limit: int = 20,
    ) -> PostConnection:
        qs = annotate_posts(
            Post.objects.select_related("author")
            .prefetch_related("media_items")
            .order_by("-created_at"),
            viewer_id=None,
        )
        if cursor:
            try:
                qs = qs.filter(pk__lt=int(cursor))
            except ValueError:
                pass
        return _build_connection(qs, limit, viewer_id=None)

    @strawberry.field(permission_classes=[IsAuthenticated])
    def feed(
        self,
        info: Info[GraphQLContext, None],
        cursor: str | None = None,
        limit: int = 20,
    ) -> PostConnection:
        from accounts.models import Follow

        me = info.context.user
        viewer_id = me.pk  # type: ignore[union-attr]
        followed_ids = list(
            Follow.objects.filter(follower=me).values_list("following_id", flat=True)
        )
        qs = annotate_posts(
            Post.objects.select_related("author")
            .prefetch_related("media_items")
            .filter(author_id__in=followed_ids)
            .exclude(author=me)
            .order_by("-created_at"),
            viewer_id=viewer_id,
        )
        if cursor:
            try:
                qs = qs.filter(pk__lt=int(cursor))
            except ValueError:
                pass
        return _build_connection(qs, limit, viewer_id=viewer_id)

    @strawberry.field(permission_classes=[IsAuthenticated])
    def my_posts(
        self,
        info: Info[GraphQLContext, None],
        cursor: str | None = None,
        limit: int = 30,
    ) -> PostConnection:
        me = info.context.user
        viewer_id = me.pk  # type: ignore[union-attr]
        qs = annotate_posts(
            Post.objects.filter(author=me)
            .prefetch_related("media_items")
            .order_by("-created_at"),
            viewer_id=viewer_id,
        )
        if cursor:
            try:
                qs = qs.filter(pk__lt=int(cursor))
            except ValueError:
                pass
        return _build_connection(qs, limit, viewer_id=viewer_id)

    @strawberry.field(permission_classes=[IsAuthenticated])
    def user_posts(
        self,
        info: Info[GraphQLContext, None],
        user_id: strawberry.ID,
        cursor: str | None = None,
        limit: int = 30,
    ) -> PostConnection:
        viewer_id = info.context.user.pk  # type: ignore[union-attr]
        qs = annotate_posts(
            Post.objects.filter(author_id=int(user_id))
            .prefetch_related("media_items")
            .order_by("-created_at"),
            viewer_id=viewer_id,
        )
        if cursor:
            try:
                qs = qs.filter(pk__lt=int(cursor))
            except ValueError:
                pass
        return _build_connection(qs, limit, viewer_id=viewer_id)

    @strawberry.field
    def post_comments(
        self,
        post_id: strawberry.ID,
        limit: int = 10,
        offset: int = 0,
    ) -> list[CommentType]:
        """Top-level comments with prefetched replies. Guests see first {limit}."""
        from posts.models import Comment

        qs = (
            Comment.objects.filter(post_id=int(post_id), parent=None)
            .select_related("author")
            .prefetch_related("replies__author")
            .order_by("created_at")[offset : offset + limit]
        )
        return [CommentType.from_model(c) for c in qs]
