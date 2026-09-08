"""
Prod-настройки. Подхватывается из core/settings/__init__.py, когда
ENVIRONMENT=production (выставлено в apps/api/Dockerfile.prod как ENV,
плюс в deployments/docker/prod/docker-compose.yml через .env.production).
"""

import os

from .base import *  # noqa: F401,F403

DEBUG = False

if not SECRET_KEY:
    raise RuntimeError(
        "DJANGO_SECRET_KEY не задан. Заполните .env.production перед запуском в проде."
    )

ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")
    if h.strip()
]

CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# whitenoise раздаёт собранную статику прямо из процесса gunicorn — не нужен
# отдельный volume/nginx для /static/ между api и web контейнерами.
MIDDLEWARE = MIDDLEWARE.copy()
MIDDLEWARE.insert(
    MIDDLEWARE.index("django.middleware.security.SecurityMiddleware") + 1,
    "whitenoise.middleware.WhiteNoiseMiddleware",
)

STORAGES = {
    **STORAGES,
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Безопасность за обратным прокси (nginx из apps/web/Dockerfile.prod пробрасывает
# X-Forwarded-Proto).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "true").lower() == "true"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
SECURE_HSTS_INCLUDE_SUBDOMAINS = True

EMAIL_BACKEND = "anymail.backends.resend.EmailBackend"
ANYMAIL = {
    "RESEND_API_KEY": os.environ.get("RESEND_API_KEY"),
}
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "noreply@selte-ai.space")
