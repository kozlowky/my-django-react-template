from drf_pydantic import DrfPydanticSerializer
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView

from .models import User
from .serializers import (
    MessageModel,
    RequestOTPModel,
    VerifyOTPModel,
    VerifyOTPResponseModel,
)
from .services import (
    OTPCooldownError,
    OTPInvalidError,
    OTPLockedError,
    generate_and_store_otp,
    verify_otp,
)
from .tasks import send_otp_email


@extend_schema(tags=["auth"])
class RequestOTPView(APIView):
    """Запросить одноразовый код на email."""

    @extend_schema(
        summary="Запросить OTP-код",
        request=RequestOTPModel.drf_serializer,
        responses={
            200: MessageModel.drf_serializer,
            429: MessageModel.drf_serializer,
        },
    )
    def post(self, request):
        serializer = RequestOTPModel.drf_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assert isinstance(serializer, DrfPydanticSerializer)
        email = serializer.pydantic_instance.email

        try:
            code = generate_and_store_otp(email)
        except OTPCooldownError:
            return Response(
                {"detail": "Код уже отправлен, попробуйте через минуту"},
                status=429,
            )

        send_otp_email.delay(email, code)
        return Response({"detail": "Код отправлен"}, status=200)


@extend_schema(tags=["auth"])
class VerifyOTPView(APIView):
    @extend_schema(
        summary="Подтвердить OTP-код",
        request=VerifyOTPModel.drf_serializer,
        responses={
            200: VerifyOTPResponseModel.drf_serializer,
            400: MessageModel.drf_serializer,
            429: MessageModel.drf_serializer,
        },
    )
    def post(self, request):
        serializer = VerifyOTPModel.drf_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assert isinstance(serializer, DrfPydanticSerializer)
        email = serializer.pydantic_instance.email
        code = serializer.pydantic_instance.code

        try:
            verify_otp(email, code)
        except OTPLockedError:
            return Response(
                {"detail": "Слишком много попыток, попробуйте позже"},
                status=429,
            )
        except OTPInvalidError:
            return Response({"detail": "Неверный код"}, status=400)

        user, is_new_user = User.objects.get_or_create(email=email)
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "is_new_user": is_new_user,
                "user": {"id": user.id, "email": user.email},
            },
            status=200,
        )


@extend_schema(tags=["auth"], summary="Обновить access-токен по refresh-токену")
class TokenRefreshView(BaseTokenRefreshView):
    """Тонкая обёртка над simplejwt-вьюхой — только чтобы попасть в тег auth в Swagger."""
