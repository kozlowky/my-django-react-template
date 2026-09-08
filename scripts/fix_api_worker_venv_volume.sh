#!/usr/bin/env bash
# SELTE — фикс гонки api/worker за .venv в dev-compose.
#
# Что происходило: у api и worker в dev-compose был единственный volume
#   ../../../apps/api:/app
# — это bind-mount ВСЕЙ apps/api поверх /app в контейнере, включая то
# место, где Dockerfile.dev на этапе сборки уже создал /app/.venv
# (RUN uv sync --frozen). Bind-mount at runtime полностью перекрывает
# содержимое /app тем, что лежит на хосте в apps/api — а там своего
# .venv изначально может не быть (или он несовместим, т.к. собран не
# под linux/x86_64 контейнера).
#
# `uv run` (использует его wait-for-db.sh и сам CMD) при отсутствии/
# неполноте .venv молча делает implicit `uv sync` — и потому что /app
# это bind-mount, эта пересборка .venv пишется ОБРАТНО на хост, в
# apps/api/.venv. Само по себе не страшно, НО api и worker — это два
# ОТДЕЛЬНЫХ контейнера, оба стартуют параллельно, оба монтируют один и
# тот же хостовый apps/api, и оба одновременно запускают `uv run` —
# то есть оба одновременно пишут в один и тот же apps/api/.venv. Кто
# успеет прочитать .venv в момент, когда второй ещё туда пишет —
# ловит "ModuleNotFoundError: No module named 'celery'" (celery в
# pyproject.toml и uv.lock ЕСТЬ — проверено; пакета физически не было
# в этот момент в .venv из-за гонки, не из-за отсутствия в lock-файле).
#
# Подтверждено на реальном репозитории: apps/api/.venv/pyvenv.cfg после
# такого запуска показывает `home = /usr/local/bin` (путь из
# python:3.14-slim контейнера, а не с Mac) — то есть .venv на диске
# пользователя был только что переписан изнутри контейнера через
# bind-mount, ровно как здесь описано.
#
# Фикс — тот же приём, что уже применён для apps/web/node_modules:
# добавить /app/.venv как отдельный (анонимный) volume ПОСЛЕ
# bind-mount'а apps/api:/app, чтобы .venv жил только внутри контейнера
# (собранный на этапе Docker-сборки), не утекал на хост и не
# расшаривался между api и worker.
#
# Запускать из КОРНЯ репозитория SELTE. Ничего не коммитит.
set -euo pipefail

if [ ! -d ".git" ] || [ ! -f "deployments/docker/dev/docker-compose.yml" ]; then
  echo "Похоже, скрипт запущен не из корня репозитория SELTE. Прервано." >&2
  exit 1
fi

echo "==> 1/1  deployments/docker/dev/docker-compose.yml: /app/.venv volume для api и worker"
python3 - <<'PYEOF'
path = "deployments/docker/dev/docker-compose.yml"
content = open(path, encoding="utf-8").read()

old = """    volumes:
      - ../../../apps/api:/app
"""
new = """    volumes:
      - ../../../apps/api:/app
      - /app/.venv
"""

count = content.count(old)
if count != 2:
    raise SystemExit(
        f"Ожидал ровно 2 вхождения блока volumes для api/worker в {path}, "
        f"нашёл {count}. Похоже, файл уже отличается от ожидаемого — "
        f"правьте вручную по инструкции в чате (добавить '- /app/.venv' "
        f"второй строкой в volumes: у api и у worker)."
    )

open(path, "w", encoding="utf-8").write(content.replace(old, new))
print(f"{path}: добавлен /app/.venv в volumes у api и у worker ({count} мест)")
PYEOF

echo
echo "===================================================================="
echo "ВАЖНО — разовая ручная чистка старых volume'ов (сделать один раз,"
echo "у вас в терминале, не здесь):"
echo
echo "  docker compose -f deployments/docker/dev/docker-compose.yml down -v"
echo
echo "Почему это нужно отдельно от патча: у web раньше уже был один"
echo "анонимный volume на /app/node_modules (когда контекст сборки был"
echo "apps/web). Docker Compose при пересоздании контейнера переиспользует"
echo "старый volume, если путь назначения совпадает — а он совпадает"
echo "(/app/node_modules осталось и в новой схеме, просто теперь это КОРЕНЬ"
echo "монорепо, а не apps/web). В итоге туда попадает СТАРОЕ содержимое"
echo "(node_modules времён контекста=apps/web), а symlink'и pnpm внутри"
echo "apps/web/node_modules (новый, честно пустой volume) указывают на"
echo "несуществующие в старом /app/node_modules пакеты — отсюда"
echo "'Cannot find module .../vite/bin/vite.js'."
echo
echo "'down -v' удалит все volume'ы проекта selte-dev, включая БД —"
echo "для dev-стека с чистой локальной базой это ожидаемо безопасно;"
echo "если в postgres_data уже есть данные, которые жалко — сделайте"
echo "перед этим дамp (pg_dump) из контейнера db."
echo
echo "После этого:"
echo "  git status / git diff   — проверить правку compose-файла"
echo "  git add -A && git commit -m '...' — коммит делаете сами"
echo "  make dev"
echo "===================================================================="