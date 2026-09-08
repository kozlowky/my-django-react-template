#!/usr/bin/env bash
# SELTE — переход монорепозитория на dev/prod структуру.
#
# Запускать из КОРНЯ репозитория SELTE:
#   chmod +x apply_dev_prod_restructure.sh
#   ./apply_dev_prod_restructure.sh
#
# Скрипт только двигает/создаёт файлы (через git mv / здесь-документы).
# Он НИЧЕГО не коммитит и не пушит — это сознательно оставлено вам:
# в конце наберите `git status` / `git diff --stat`, посмотрите на изменения
# и закоммитьте сами, когда будете готовы.
set -euo pipefail

if [ ! -d ".git" ] || [ ! -d "apps/api" ] || [ ! -d "apps/web" ]; then
  echo "Похоже, скрипт запущен не из корня репозитория SELTE. Прервано." >&2
  exit 1
fi

echo "==> 1/8  core/settings.py -> core/settings/ (пакет base/dev/prod)"
mkdir -p apps/api/core/settings
if [ -f apps/api/core/settings.py ]; then
  git mv apps/api/core/settings.py apps/api/core/settings/base.py
fi

cat > apps/api/core/settings/__init__.py <<'PYEOF'
"""
Единая точка входа в настройки. DJANGO_SETTINGS_MODULE везде (manage.py,
wsgi.py, asgi.py, celery.py) указывает сюда — "core.settings", без .dev/.prod
на конце. Какой файл реально подхватится, решает переменная окружения
ENVIRONMENT: "production" -> prod.py, всё остальное (включая не заданную
вовсе) -> dev.py.

Так исключён риск разъехаться по разным входным точкам: gunicorn грузит
core.wsgi -> core.settings, Celery — core.celery -> core.settings, manage.py —
core.settings. Все смотрят в одно и то же место, переключение окружения —
одной переменной, а не отдельной правкой в каждом файле-точке входа.
"""
import os

ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    from .prod import *  # noqa: F401,F403
else:
    from .dev import *  # noqa: F401,F403

print(f"--> Django settings loaded: ENVIRONMENT={ENVIRONMENT!r}")
PYEOF

cat > apps/api/core/settings/base.py <<'PYEOF'
"""
Общие настройки Django для core project — то, что одинаково для dev и prod.
Окружение-специфичные настройки — в core/settings/dev.py и core/settings/prod.py.
Какой файл реально подхватится, решает core/settings/__init__.py по переменной
ENVIRONMENT — сам DJANGO_SETTINGS_MODULE везде (manage.py/wsgi.py/asgi.py/
celery.py) неизменно указывает на пакет целиком: "core.settings".
"""

import os
from datetime import timedelta
from pathlib import Path

# apps/api/core/settings/base.py -> apps/api/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "drf_spectacular",
    "corsheaders",
    "tasks",
    "accounts",
    "wardrobe",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "myapp"),
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "postgres"),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}

# Кастомный User на email — обязательно должно быть выставлено ДО первого
# makemigrations/migrate в проекте.
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
# Нужен для `collectstatic` в проде (whitenoise). В dev не используется.
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_FROM_EMAIL = "no-reply@selte.app"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "SELTE API",
    "DESCRIPTION": "Fashion-соцсеть + ИИ-гардероб — REST API",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": r"/api/",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Redis: кэш (в т.ч. OTP-коды) на одной логической базе, брокер Celery — на другой.
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"{REDIS_URL}/1",
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

CELERY_BROKER_URL = f"{REDIS_URL}/0"
CELERY_RESULT_BACKEND = f"{REDIS_URL}/0"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": os.environ.get("S3_BUCKET", "selte-wardrobe"),
            "endpoint_url": os.environ.get("S3_ENDPOINT_URL", "http://minio:9000"),
            "access_key": os.environ.get("S3_ACCESS_KEY", "minioadmin"),
            "secret_key": os.environ.get("S3_SECRET_KEY", "minioadmin123"),
            "region_name": os.environ.get("S3_REGION", "us-east-1"),
            "addressing_style": "path",  # обязательно для MinIO
            "use_ssl": os.environ.get("S3_USE_SSL", "false").lower() == "true",
            "default_acl": None,
            "querystring_auth": True,
            "file_overwrite": False,
        },
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
PYEOF

cat > apps/api/core/settings/dev.py <<'PYEOF'
"""
Dev-настройки. Подхватывается из core/settings/__init__.py, когда
ENVIRONMENT != "production" (в т.ч. когда ENVIRONMENT вообще не задан —
это дефолт, так что локально можно ничего не выставлять явно).
"""
from .base import *  # noqa: F401,F403

DEBUG = True

ALLOWED_HOSTS = ["*"]

CORS_ALLOW_ALL_ORIGINS = True

# OTP-коды и прочие письма печатаются в лог контейнера api/worker:
# docker compose ... logs -f worker
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Чтобы совсем без .env можно было поднять сервер.
SECRET_KEY = SECRET_KEY or "django-insecure-dev-only-key"
PYEOF

cat > apps/api/core/settings/prod.py <<'PYEOF'
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
    h.strip() for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()
]

CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()
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

# Реальный SMTP вместо консольного бэкенда. Если EMAIL_HOST не задан —
# откатываемся на консоль (например, для стейджинга без почты), чтобы не падать.
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
PYEOF

echo "==> 2/8  apps/api: Dockerfile -> Dockerfile.prod, + новый Dockerfile.dev"
if [ -f apps/api/Dockerfile ]; then
  git mv apps/api/Dockerfile apps/api/Dockerfile.prod
fi

cat > apps/api/Dockerfile.prod <<'DOCKEREOF'
FROM python:3.14-slim

WORKDIR /app

RUN pip install --no-cache-dir "uv>=0.5,<1" \
    && useradd --create-home --uid 1000 appuser

COPY pyproject.toml uv.lock* ./

RUN uv sync --frozen --no-dev

COPY . .

RUN chmod +x wait-for-db.sh

# Дефолт на случай, если кто-то забудет прокинуть ENVIRONMENT явно — образ
# не должен молча уехать в dev-настройки. core/settings/__init__.py читает
# именно эту переменную и по ней выбирает prod.py или dev.py.
ENV ENVIRONMENT=production

# DJANGO_SECRET_KEY нужен только на время collectstatic (сам collectstatic
# секрет не использует, но импорт settings.py его требует) — задаём его как
# переменную только для этой команды, а не как ENV на весь образ, чтобы
# плейсхолдер не оседал в слоях/метаданных образа. Реальный секрет приходит
# в контейнер из .env.production через env_file в docker-compose.
RUN DJANGO_SECRET_KEY=build-time-placeholder \
    uv run python manage.py collectstatic --noinput \
    && chown -R appuser:appuser /app

USER 1000

EXPOSE 8000

ENTRYPOINT ["./wait-for-db.sh"]
CMD ["uv", "run", "gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
DOCKEREOF

cat > apps/api/Dockerfile.dev <<'DOCKEREOF'
FROM python:3.14-slim

WORKDIR /app

RUN pip install --no-cache-dir "uv>=0.5,<1"

COPY pyproject.toml uv.lock* ./

# без --no-dev: нужны pytest/black внутри контейнера
RUN uv sync --frozen

COPY . .

RUN chmod +x wait-for-db.sh

# Явно, хотя это и так дефолт в core/settings/__init__.py — чтобы было видно
# из самого Dockerfile, какое окружение тут запускается.
ENV ENVIRONMENT=development

EXPOSE 8000

ENTRYPOINT ["./wait-for-db.sh"]
CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]
DOCKEREOF

echo "==> 3/8  apps/api/pyproject.toml: + gunicorn, whitenoise"
python3 - <<'PYEOF'
import re
path = "apps/api/pyproject.toml"
with open(path, encoding="utf-8") as f:
    content = f.read()

additions = ['    "gunicorn>=23.0",\n', '    "whitenoise>=6.7",\n']
for line in additions:
    pkg_name = line.strip().split(">=")[0].strip('",')
    if pkg_name in content:
        continue
    content = re.sub(r"(dependencies = \[\n)", r"\1" + line, content, count=1)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("pyproject.toml обновлён")
PYEOF

echo "==> 4/8  apps/web: Dockerfile -> Dockerfile.prod (на nginx), + Dockerfile.dev"
if [ -f apps/web/Dockerfile ]; then
  git mv apps/web/Dockerfile apps/web/Dockerfile.prod
fi

cat > apps/web/Dockerfile.prod <<'DOCKEREOF'
# --- STAGE 1: Build ---
FROM node:22-alpine AS builder

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

# Vite инлайнит VITE_* переменные на этапе сборки, поэтому это build ARG,
# а не runtime environment из docker-compose.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

# --- STAGE 2: Runner (nginx) ---
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
DOCKEREOF

cat > apps/web/Dockerfile.dev <<'DOCKEREOF'
FROM node:22-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev", "--host", "0.0.0.0"]
DOCKEREOF

echo "==> 5/8  apps/web/nginx.conf: чиним proxy_pass и добавляем /admin/, /static/"
cat > apps/web/nginx.conf <<'NGINXEOF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Django admin
    location /admin/ {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # REST API
    location /api/ {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Статика Django (whitenoise раздаёт её из gunicorn-процесса)
    location /static/ {
        proxy_pass http://api:8000;
    }

    # SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF

echo "==> 6/8  docker-compose: deployments/docker/dev и deployments/docker/prod"
mkdir -p deployments/docker/dev deployments/docker/prod
rm -f deployments/docker/.gitkeep

if [ -f docker-compose.yml ]; then
  git mv docker-compose.yml deployments/docker/dev/docker-compose.yml
fi

cat > deployments/docker/dev/docker-compose.yml <<'YAMLEOF'
# Dev-стек SELTE. Запускать из корня репозитория:
#   make dev
# (эквивалент: docker compose --env-file .env.development \
#     -f deployments/docker/dev/docker-compose.yml up --build)
#
# Явное top-level `name:` — без него docker compose берёт имя проекта из
# имени папки, где лежит сам compose-файл (тут было бы "dev"), и на это имя
# завязаны имена volume'ов/сети. Задаём его сами, чтобы это не зависело от
# того, откуда и как именно будет запущена команда.
name: selte-dev
services:
  db:
    image: postgres:16-alpine
    container_name: selte-dev-db
    environment:
      - POSTGRES_USER=${DB_USER:-postgres}
      - POSTGRES_PASSWORD=${DB_PASSWORD:-postgres}
      - POSTGRES_DB=${DB_NAME:-myapp}
    ports:
      - "${DB_HOST_PORT:-5433}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: selte-dev-redis
    ports:
      - "${REDIS_HOST_PORT:-6380}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: selte-dev-minio
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${S3_ACCESS_KEY:-minioadmin}
      - MINIO_ROOT_PASSWORD=${S3_SECRET_KEY:-minioadmin123}
    ports:
      - "9000:9000"  # S3 API
      - "9001:9001"  # веб-консоль (http://localhost:9001)
    volumes:
      - minio_data:/data

  createbuckets:
    image: minio/mc
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      until mc alias set local http://minio:9000 ${S3_ACCESS_KEY:-minioadmin} ${S3_SECRET_KEY:-minioadmin123}; do
        echo 'Waiting for MinIO...'; sleep 2;
      done;
      mc mb --ignore-existing local/${S3_BUCKET:-selte-wardrobe};
      exit 0;
      "

  api:
    build:
      context: ../../../apps/api
      dockerfile: Dockerfile.dev
    container_name: selte-dev-api
    env_file: ../../../.env.development
    environment:
      - ENVIRONMENT=development
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379
      - S3_ENDPOINT_URL=http://minio:9000
      - S3_USE_SSL=false
    ports:
      - "${API_PORT:-8000}:8000"
    volumes:
      - ../../../apps/api:/app
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  worker:
    build:
      context: ../../../apps/api
      dockerfile: Dockerfile.dev
    container_name: selte-dev-worker
    env_file: ../../../.env.development
    environment:
      - ENVIRONMENT=development
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379
      - S3_ENDPOINT_URL=http://minio:9000
      - S3_USE_SSL=false
    volumes:
      - ../../../apps/api:/app
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: uv run celery -A core worker -l info

  web:
    build:
      context: ../../../apps/web
      dockerfile: Dockerfile.dev
    container_name: selte-dev-web
    environment:
      - VITE_API_URL=${VITE_API_URL:-http://localhost:8000/api}
    ports:
      - "${WEB_PORT:-3000}:3000"
    volumes:
      - ../../../apps/web:/app
      - /app/node_modules

volumes:
  postgres_data:
  minio_data:
YAMLEOF

cat > deployments/docker/prod/docker-compose.yml <<'YAMLEOF'
# Prod-стек SELTE. Запускать из корня репозитория:
#   make prod
# (эквивалент: docker compose --env-file .env.production \
#     -f deployments/docker/prod/docker-compose.yml up --build -d)
#
# db/redis ниже — самохостинг для варианта "всё на одном сервере".
# Если используете managed Postgres/Redis (RDS/ElastiCache и т.п.) — уберите
# эти два сервиса и укажите DB_HOST/REDIS_URL на внешние адреса в .env.production.
#
# Явное top-level `name:` — без него имя проекта (и, соответственно, имена
# volume'ов) определяется именем папки, где лежит compose-файл.
name: selte-prod
services:
  db:
    image: postgres:16-alpine
    container_name: selte-prod-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: selte-prod-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ../../../apps/api
      dockerfile: Dockerfile.prod
    container_name: selte-prod-api
    restart: unless-stopped
    env_file: ../../../.env.production
    environment:
      - ENVIRONMENT=production
      - DB_HOST=${DB_HOST:-db}
      - DB_PORT=${DB_PORT:-5432}
    ports:
      - "127.0.0.1:${API_PORT:-8000}:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  worker:
    build:
      context: ../../../apps/api
      dockerfile: Dockerfile.prod
    container_name: selte-prod-worker
    restart: unless-stopped
    env_file: ../../../.env.production
    environment:
      - ENVIRONMENT=production
      - DB_HOST=${DB_HOST:-db}
      - DB_PORT=${DB_PORT:-5432}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: uv run celery -A core worker -l info --concurrency=2

  web:
    build:
      context: ../../../apps/web
      dockerfile: Dockerfile.prod
      args:
        VITE_API_URL: ${VITE_API_URL}
    container_name: selte-prod-web
    restart: unless-stopped
    ports:
      - "${WEB_PORT:-80}:80"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
YAMLEOF

echo "==> 7/8  .env.development.example / .env.production.example (+ apps/web)"
cat > .env.development.example <<'ENVEOF'
# Скопируйте в .env.development: cp .env.development.example .env.development
ENVIRONMENT=development
DJANGO_SECRET_KEY=django-insecure-dev-only-key

DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
DB_HOST_PORT=5433

REDIS_URL=redis://redis:6379
REDIS_HOST_PORT=6380

S3_ENDPOINT_URL=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=selte-wardrobe
S3_REGION=us-east-1
S3_USE_SSL=false

API_PORT=8000
WEB_PORT=3000
VITE_API_URL=http://localhost:8000/api
ENVEOF

cat > .env.production.example <<'ENVEOF'
# Скопируйте в .env.production: cp .env.production.example .env.production
# Секреты сюда не коммитить — заполнять на сервере/через секрет-менеджер CI.
ENVIRONMENT=production
DJANGO_SECRET_KEY=

DJANGO_ALLOWED_HOSTS=example.com,api.example.com
CORS_ALLOWED_ORIGINS=https://example.com

DB_NAME=selte
DB_USER=selte
DB_PASSWORD=
DB_HOST=db
DB_PORT=5432

REDIS_URL=redis://redis:6379

S3_ENDPOINT_URL=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=selte-wardrobe-prod
S3_REGION=us-east-1
S3_USE_SSL=true

EMAIL_HOST=
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=true
DEFAULT_FROM_EMAIL=no-reply@selte.app

API_PORT=8000
WEB_PORT=80
VITE_API_URL=https://api.example.com/api
ENVEOF

if [ -f .env.example ]; then
  git rm -q .env.example || rm -f .env.example
fi

cat > apps/web/.env.development.example <<'ENVEOF'
VITE_API_URL=http://localhost:8000/api
ENVEOF

cat > apps/web/.env.production.example <<'ENVEOF'
VITE_API_URL=https://api.example.com/api
ENVEOF

echo "==> 8/8  Makefile, package.json, .gitignore"
cat > Makefile <<'MAKEEOF'
ENV_DEV := .env.development
ENV_PROD := .env.production
DEV_COMPOSE := -f deployments/docker/dev/docker-compose.yml
PROD_COMPOSE := -f deployments/docker/prod/docker-compose.yml

.PHONY: dev dev-down dev-logs dev-build migrate-dev \
        prod prod-down prod-logs prod-build migrate-prod

dev:
	docker compose --env-file $(ENV_DEV) $(DEV_COMPOSE) up --build

dev-down:
	docker compose --env-file $(ENV_DEV) $(DEV_COMPOSE) down

dev-logs:
	docker compose --env-file $(ENV_DEV) $(DEV_COMPOSE) logs -f

migrate-dev:
	docker compose --env-file $(ENV_DEV) $(DEV_COMPOSE) exec api uv run python manage.py migrate

prod:
	docker compose --env-file $(ENV_PROD) $(PROD_COMPOSE) up --build -d

prod-down:
	docker compose --env-file $(ENV_PROD) $(PROD_COMPOSE) down

prod-logs:
	docker compose --env-file $(ENV_PROD) $(PROD_COMPOSE) logs -f

migrate-prod:
	docker compose --env-file $(ENV_PROD) $(PROD_COMPOSE) exec api uv run python manage.py migrate
MAKEEOF

python3 - <<'PYEOF'
import json
path = "package.json"
with open(path, encoding="utf-8") as f:
    data = json.load(f)

data.setdefault("scripts", {})
data["scripts"]["docker:dev"] = "docker compose --env-file .env.development -f deployments/docker/dev/docker-compose.yml up --build"
data["scripts"]["docker:prod"] = "docker compose --env-file .env.production -f deployments/docker/prod/docker-compose.yml up --build -d"

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")
print("package.json обновлён")
PYEOF

python3 - <<'PYEOF'
path = ".gitignore"
with open(path, encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "db.sqlite3\n*.sqlite3\n",
    "db.sqlite3\n*.sqlite3\nstaticfiles/\n",
)
content = content.replace(
    ".env\nvenv/\n",
    ".env\n.env.*\n!.env.example\n!.env.*.example\nvenv/\n",
)
content = content.replace('*.local\npnpm-lock.yaml\n', '*.local\n')

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print(".gitignore обновлён")
PYEOF

echo
echo "===================================================================="
echo "Готово. Дальше руками:"
echo "  1) git status / git diff --stat   — посмотреть, что получилось"
echo "  2) cp .env.development.example .env.development"
echo "     cp apps/web/.env.development.example apps/web/.env.development"
echo "     (для прод-контура аналогично .env.production, когда понадобится)"
echo "  3) cd apps/api && uv lock          — перегенерировать uv.lock под"
echo "     новые зависимости (gunicorn, whitenoise) — либо uv sync"
echo "  4) git add -A && git commit -m '...' — коммит делаете сами"
echo "  5) make dev                        — поднять dev-стек"
echo "===================================================================="