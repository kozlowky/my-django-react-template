#!/usr/bin/env bash
# SELTE — фикс сборки apps/web: Dockerfile.dev/.prod для web пересобираются
# с контекстом = корень репозитория (а не apps/web), т.к. web зависит от
# packages/* через workspace:* — их не видно, если context ограничен apps/web.
# Заодно: .dockerignore для корня и apps/api (apps/api/.venv весит ~136MB и
# гонялся в контекст сборки api при каждой пересборке — apps/api/.dockerignore
# нужен независимо от этого фикса).
#
# Запускать из КОРНЯ репозитория SELTE. Ничего не коммитит.
set -euo pipefail

if [ ! -d ".git" ] || [ ! -d "apps/api" ] || [ ! -d "apps/web" ]; then
  echo "Похоже, скрипт запущен не из корня репозитория SELTE. Прервано." >&2
  exit 1
fi

echo "==> 1/5  .dockerignore в корне (нужен, раз web теперь собирается с контекстом = корень)"
cat > .dockerignore <<'EOF'
**/.git
**/node_modules
**/.pnpm-store
**/dist
**/.venv
**/__pycache__
**/*.pyc
**/.pytest_cache
**/.mypy_cache
**/.DS_Store
apps/api/staticfiles
EOF

echo "==> 2/5  .dockerignore в apps/api (без него .venv ~136MB летит в контекст сборки api/worker)"
cat > apps/api/.dockerignore <<'EOF'
.venv
__pycache__
**/__pycache__
*.pyc
.pytest_cache
.mypy_cache
staticfiles
EOF

if [ -f apps/web/.dockerignore ]; then
  echo "    apps/web/.dockerignore больше не используется (контекст теперь корень) — удаляю"
  git rm -q apps/web/.dockerignore 2>/dev/null || rm -f apps/web/.dockerignore
fi

echo "==> 3/5  apps/web/Dockerfile.dev и Dockerfile.prod — контекст = корень репозитория"
cat > apps/web/Dockerfile.dev <<'DOCKEREOF'
FROM node:22-alpine

RUN corepack enable

WORKDIR /app

# Контекст сборки — корень репозитория (см. deployments/docker/*/docker-compose.yml),
# не apps/web: apps/web зависит от packages/* через "workspace:*", и pnpm должен
# видеть весь монорепозиторий, а не один пакет — иначе
# ERR_PNPM_WORKSPACE_PKG_NOT_FOUND ("Packages found in the workspace: web").
COPY . .

RUN pnpm install

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "dev", "--host", "0.0.0.0"]
DOCKEREOF

cat > apps/web/Dockerfile.prod <<'DOCKEREOF'
# --- STAGE 1: Build ---
FROM node:22-alpine AS builder

RUN corepack enable

WORKDIR /app

# Контекст — корень репозитория, по той же причине, что и в Dockerfile.dev:
# apps/web зависит от packages/* через "workspace:*".
COPY . .

RUN pnpm install --frozen-lockfile

# Vite инлайнит VITE_* переменные на этапе сборки, поэтому это build ARG,
# а не runtime environment из docker-compose.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter web build

# --- STAGE 2: Runner (nginx) ---
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
DOCKEREOF

echo "==> 4/5  docker-compose dev/prod: web — context/dockerfile/volumes под новый контекст"
python3 - <<'PYEOF'
import re

# --- dev ---
path = "deployments/docker/dev/docker-compose.yml"
content = open(path, encoding="utf-8").read()
old = """  web:
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
"""
new = """  web:
    build:
      context: ../../..
      dockerfile: apps/web/Dockerfile.dev
    container_name: selte-dev-web
    environment:
      - VITE_API_URL=${VITE_API_URL:-http://localhost:8000/api}
    ports:
      - "${WEB_PORT:-3000}:3000"
    volumes:
      - ../../../apps/web:/app/apps/web
      - ../../../packages:/app/packages
      - /app/apps/web/node_modules
      - /app/node_modules
"""
if old not in content:
    raise SystemExit(f"[dev] Не нашёл ожидаемый блок web: в {path} — правьте вручную по инструкции в чате.")
open(path, "w", encoding="utf-8").write(content.replace(old, new))

# --- prod ---
path = "deployments/docker/prod/docker-compose.yml"
content = open(path, encoding="utf-8").read()
old = """  web:
    build:
      context: ../../../apps/web
      dockerfile: Dockerfile.prod
      args:
        VITE_API_URL: ${VITE_API_URL}
"""
new = """  web:
    build:
      context: ../../..
      dockerfile: apps/web/Dockerfile.prod
      args:
        VITE_API_URL: ${VITE_API_URL}
"""
if old not in content:
    raise SystemExit(f"[prod] Не нашёл ожидаемый блок web: в {path} — правьте вручную по инструкции в чате.")
open(path, "w", encoding="utf-8").write(content.replace(old, new))

print("docker-compose (dev, prod) обновлены")
PYEOF

echo "==> 5/5  готово"
echo
echo "===================================================================="
echo "ВАЖНО: этот фикс чинит только контекст сборки. Помимо него у вас"
echo "разъехались имена пакетов — apps/web/package.json просит:"
echo "  @selte/design-tokens, @selte/types, @selte/shared-ui"
echo "а в packages/*/package.json реально лежит:"
echo "  @selted/design-tokens, @selted/design-types, @selted/shared-ui"
echo "Без исправления этого несовпадения сборка упадёт с той же ошибкой"
echo "ERR_PNPM_WORKSPACE_PKG_NOT_FOUND даже после этого патча — см. чат,"
echo "какой вариант выбрать (переименовать пакеты или зависимости в web)."
echo
echo "После того как имена приведены в соответствие:"
echo "  1) pnpm install            — из КОРНЯ репозитория (не из apps/web!),"
echo "     пересоберёт корневой pnpm-lock.yaml с учётом packages/*"
echo "  2) git status / git diff   — посмотреть на результат"
echo "  3) git add -A && git commit -m '...' — коммит делаете сами"
echo "  4) make dev"
echo "===================================================================="