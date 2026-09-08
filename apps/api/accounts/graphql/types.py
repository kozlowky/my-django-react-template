import strawberry
from accounts.models import Follow, User


def _count_fallback(user: User, field: str, filter_kwargs: dict) -> int:
    """Read pre-annotated value if present, else hit the DB (single-object queries)."""
    val = getattr(user, field, None)
    if val is not None:
        return val
    return Follow.objects.filter(**filter_kwargs).count()


@strawberry.type
class UserType:
    id: strawberry.ID
    email: str
    display_name: str
    avatar_url: str | None
    followers_count: int
    following_count: int

    @classmethod
    def from_model(cls, user: User) -> "UserType":
        return cls(
            id=strawberry.ID(str(user.pk)),
            email=user.email,
            display_name=user.display_name,
            avatar_url=user.avatar.url if user.avatar else None,
            followers_count=_count_fallback(user, "followers_count", {"following": user}),
            following_count=_count_fallback(user, "following_count", {"follower": user}),
        )


@strawberry.type
class UserProfileType(UserType):
    is_following: bool

    @classmethod
    def from_model_with_follow(
        cls, user: User, is_following: bool
    ) -> "UserProfileType":
        return cls(
            id=strawberry.ID(str(user.pk)),
            email=user.email,
            display_name=user.display_name,
            avatar_url=user.avatar.url if user.avatar else None,
            is_following=is_following,
            followers_count=_count_fallback(user, "followers_count", {"following": user}),
            following_count=_count_fallback(user, "following_count", {"follower": user}),
        )
