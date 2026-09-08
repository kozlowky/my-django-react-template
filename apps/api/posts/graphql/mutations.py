import strawberry
from core.graphql.context import GraphQLContext
from core.graphql.permissions import IsAuthenticated
from posts.models import Post, PostMedia
from strawberry.file_uploads import Upload
from strawberry.types import Info

from .types import PostType, CommentType


@strawberry.type
class PostsMutation:
    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def create_post(
        self,
        info: Info[GraphQLContext, None],
        caption: str = "",
        location: str = "",
        files: list[Upload] | None = None,
    ) -> PostType:
        user = info.context.user  # type: ignore[assignment]
        post = Post.objects.create(author=user, caption=caption, location=location)

        if files:
            for i, f in enumerate(files):
                # Определяем тип по content_type
                ct = getattr(f, "content_type", "")
                media_type = (
                    PostMedia.MediaType.VIDEO
                    if ct.startswith("video/")
                    else PostMedia.MediaType.IMAGE
                )
                PostMedia.objects.create(
                    post=post,
                    file=f,
                    media_type=media_type,
                    order=i,
                )

        # Перезагружаем с релейшнами
        post = (
            Post.objects.select_related("author")
            .prefetch_related("media_items")
            .get(pk=post.pk)
        )
        return PostType.from_model(post)


@strawberry.type
class PostsInteractionMutation:
    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def like_post(
        self, info: Info[GraphQLContext, None], post_id: strawberry.ID
    ) -> bool:
        from posts.models import Like

        user = info.context.user
        Like.objects.get_or_create(user=user, post_id=int(post_id))
        return True

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def unlike_post(
        self, info: Info[GraphQLContext, None], post_id: strawberry.ID
    ) -> bool:
        from posts.models import Like

        Like.objects.filter(user=info.context.user, post_id=int(post_id)).delete()
        return True

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def save_post(
        self, info: Info[GraphQLContext, None], post_id: strawberry.ID
    ) -> bool:
        from posts.models import Bookmark

        Bookmark.objects.get_or_create(user=info.context.user, post_id=int(post_id))
        return True

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def unsave_post(
        self, info: Info[GraphQLContext, None], post_id: strawberry.ID
    ) -> bool:
        from posts.models import Bookmark

        Bookmark.objects.filter(
            user=info.context.user, post_id=int(post_id)
        ).delete()
        return True

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def add_comment(
        self,
        info: Info[GraphQLContext, None],
        post_id: strawberry.ID,
        text: str,
        parent_id: strawberry.ID | None = None,
    ) -> CommentType:
        from posts.models import Comment
        comment = Comment.objects.create(
            post_id=int(post_id),
            author=info.context.user,
            text=text.strip(),
            parent_id=int(parent_id) if parent_id else None,
        )
        comment.author = info.context.user  # type: ignore[assignment]
        return CommentType.from_model(comment)
