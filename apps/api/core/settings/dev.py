"""
Dev-настройки. Подхватывается из core/settings/__init__.py, когда
ENVIRONMENT != "production" (в т.ч. когда ENVIRONMENT вообще не задан —
это дефолт, так что локально можно ничего не выставлять явно).
"""
import os

from .base import *  # noqa: F401,F403

DEBUG = True

if os.environ.get("EMAIL_HOST"):
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = os.environ["EMAIL_HOST"]
    EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
    EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
    EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
    EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "true").lower() == "true"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", DEFAULT_FROM_EMAIL)

ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True

SECRET_KEY = SECRET_KEY or "django-insecure-dev-only-key"
# InMemoryChannelLayer for dev — avoids redis-py 5.x async timeout bug.
# Single-process Daphne means broadcast still works correctly.
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}
