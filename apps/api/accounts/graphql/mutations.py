from __future__ import annotations

from typing import Annotated, Union

import strawberry
from accounts.models import Follow, User
from accounts.services import (
    OTPCooldownError,
    OTPInvalidError,
    OTPLockedError,
    generate_and_store_otp,
    verify_otp,
)
from accounts.tasks import send_otp_email
from core.graphql.context import GraphQLContext
from core.graphql.permissions import IsAuthenticated
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from strawberry.file_uploads import Upload
from strawberry.types import Info

from .types import UserType

_REFRESH_COOKIE = "refresh_token"
_COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 дней


# ─── requestOtp result ────────────────────────────────────────────────────────


@strawberry.type
class RequestOtpSuccess:
    message: str


@strawberry.type
class OtpCooldownError:
    message: str


RequestOtpResult = Annotated[
    Union[RequestOtpSuccess, OtpCooldownError],
    strawberry.union("RequestOtpResult"),
]


# ─── verifyOtp result ─────────────────────────────────────────────────────────


@strawberry.type
class VerifyOtpSuccess:
    access_token: str
    is_new_user: bool
    user: UserType


@strawberry.type
class OtpInvalidError:
    message: str


@strawberry.type
class OtpLockedError:
    message: str


VerifyOtpResult = Annotated[
    Union[VerifyOtpSuccess, OtpInvalidError, OtpLockedError],
    strawberry.union("VerifyOtpResult"),
]


# ─── refreshToken result ──────────────────────────────────────────────────────


@strawberry.type
class RefreshTokenSuccess:
    access_token: str


@strawberry.type
class RefreshTokenError:
    message: str


RefreshTokenResult = Annotated[
    Union[RefreshTokenSuccess, RefreshTokenError],
    strawberry.union("RefreshTokenResult"),
]


# ─── mutations ────────────────────────────────────────────────────────────────


@strawberry.type
class AccountsMutation:
    @strawberry.mutation
    def request_otp(self, email: str) -> RequestOtpResult:
        try:
            code = generate_and_store_otp(email)
        except OTPCooldownError:
            return OtpCooldownError(
                message="Код уже отправлен, попробуйте через минуту"
            )
        send_otp_email(email, code)
        return RequestOtpSuccess(message="Код отправлен")

    @strawberry.mutation
    def verify_otp(
        self, info: Info[GraphQLContext, None], email: str, code: str
    ) -> VerifyOtpResult:
        try:
            verify_otp(email, code)
        except OTPLockedError:
            return OtpLockedError(message="Слишком много попыток, попробуйте позже")
        except OTPInvalidError:
            return OtpInvalidError(message="Неверный код")

        user, is_new_user = User.objects.get_or_create(email=email)
        refresh = RefreshToken.for_user(user)

        info.context.response.set_cookie(
            key=_REFRESH_COOKIE,
            value=str(refresh),
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=_COOKIE_MAX_AGE,
            path="/graphql/",
        )

        return VerifyOtpSuccess(
            access_token=str(refresh.access_token),
            is_new_user=is_new_user,
            user=UserType.from_model(user),
        )

    @strawberry.mutation
    def logout(self, info: Info[GraphQLContext, None]) -> bool:
        info.context.response.delete_cookie(_REFRESH_COOKIE, path="/graphql/")
        return True

    @strawberry.mutation
    def refresh_token(self, info: Info[GraphQLContext, None]) -> RefreshTokenResult:
        """Читает refresh_token из HttpOnly cookie → новый access token."""
        token_str = info.context.request.COOKIES.get(_REFRESH_COOKIE)
        if not token_str:
            return RefreshTokenError(message="Refresh token отсутствует")
        try:
            refresh = RefreshToken(token_str)  # type: ignore[arg-type]
            return RefreshTokenSuccess(access_token=str(refresh.access_token))
        except TokenError:
            return RefreshTokenError(message="Refresh token недействителен")

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def update_profile(
        self,
        info: Info[GraphQLContext, None],
        display_name: str | None = None,
        avatar: Upload | None = None,
    ) -> UserType:
        user = info.context.user
        if display_name is not None:
            user.display_name = display_name
        if avatar is not None:
            user.avatar.save(avatar.name, avatar, save=False)
        user.save()
        return UserType.from_model(user)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def follow_user(
        self, info: Info[GraphQLContext, None], user_id: strawberry.ID
    ) -> bool:
        me = info.context.user
        try:
            target = User.objects.get(pk=int(user_id), is_active=True)
        except (User.DoesNotExist, ValueError):
            return False
        if target.pk == me.pk:  # type: ignore[union-attr]
            return False
        Follow.objects.get_or_create(follower=me, following=target)
        return True

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def unfollow_user(
        self, info: Info[GraphQLContext, None], user_id: strawberry.ID
    ) -> bool:
        me = info.context.user
        Follow.objects.filter(follower=me, following_id=int(user_id)).delete()
        return True
