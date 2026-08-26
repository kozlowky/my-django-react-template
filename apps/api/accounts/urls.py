from django.urls import path

from .views import RequestOTPView, TokenRefreshView, VerifyOTPView

urlpatterns = [
    path("otp/request/", RequestOTPView.as_view(), name="otp-request"),
    path("otp/verify/", VerifyOTPView.as_view(), name="otp-verify"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
]
