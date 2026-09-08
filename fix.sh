#!/usr/bin/env bash
# SELTE — фикс: node_modules внутри packages/* тоже нужно исключать из
# bind-mount'а, как уже сделано для apps/web/node_modules и /app/node_modules.
#
# Ваша диагностика была верна: `../../../packages:/app/packages` в web-
# сервисе — это bind-mount ВСЕГО packages/* с хоста. RUN pnpm install на
# этапе сборки образа кладёт в /app/packages/<pkg>/node_modules symlink'и
# на пакеты (например clsx для @selted/shared-ui) — но раз на хосте у
# packages/<pkg> своего node_modules нет (вы не гоняли pnpm install на
# Маке из корня), bind-mount подменяет содержимое этой папки в контейнере
# на хостовое — то есть на "node_modules отсутствует" — и symlink,
# который сборка положила в образ, просто исчезает. Отсюда
# "Failed to resolve import "clsx"" именно из packages/shared-ui/src, а
# не из apps/web/src (у web/node_modules уже есть свой anonymous volume,
# поэтому там всё резолвится).
#
# Проверено вручную (grep по packages/*/src + package.json): clsx уже
# ПРАВИЛЬНО объявлен как dependency в packages/shared-ui/package.json —
# дело не в package.json, а именно в volume/bind-mount.
#
# Фикс — тот же приём, что уже есть у apps/web: под каждый
# packages/<pkg>/node_modules — отдельный анонимный volume ПОСЛЕ
# bind-mount'а packages:/app/packages.
#
# ВАЖНО (ограничение, не решается этим скриптом): если позже добавите
# НОВЫЙ пакет в packages/ — для него тоже нужно будет дописать свою
# строку "- /app/packages/<новый-пакет>/node_modules" в docker-compose.yml
# вручную, иначе новый пакет наступит на те же грабли.
#
# ТАКЖЕ ВАЖНО, и это относится не только к packages, но и к apps/web:
# анонимные volume'ы Docker Compose переживают `up --build` — при
# пересборке образа Docker обновит слои, но контейнер всё равно
# примонтирует СТАРЫЙ volume поверх свежего node_modules из образа.
# Поэтому каждый раз, когда меняете зависимости в ЛЮБОМ package.json
# (apps/web или packages/*), одной пересборки НЕДОСТАТОЧНО — нужно ещё
# сбросить volume'ы:
#   docker compose --env-file .env.dev -f deployments/docker/dev/docker-compose.yml down -v
#   make dev
# либо точечно для одного сервиса:
#   docker compose --env-file .env.dev -f deployments/docker/dev/docker-compose.yml rm -sfv web
#   make dev
# Ваш вариант "поставить зависимости через exec pnpm install в уже
# запущенном контейнере" тоже рабочий (пишет прямо в bind-mount на хост),
# но это ручной шаг на каждое изменение зависимостей, а не постоянное
# решение — на следующей новой зависимости наступите на те же грабли.
#
# Запускать из КОРНЯ репозитория SELTE. Ничего не коммитит.
set -euo pipefail

if [ ! -d ".git" ] || [ ! -f "deployments/docker/dev/docker-compose.yml" ] || [ ! -d "packages" ]; then
  echo "Похоже, скрипт запущен не из корня репозитория SELTE. Прервано." >&2
  exit 1
fi

echo "==> 1/1  deployments/docker/dev/docker-compose.yml: node_modules-volume под каждый packages/<pkg>"
python3 - <<'PYEOF'
import os

path = "deployments/docker/dev/docker-compose.yml"
content = open(path, encoding="utf-8").read()

pkgs = sorted(
    name for name in os.listdir("packages")
    if os.path.isfile(os.path.join("packages", name, "package.json"))
)
if not pkgs:
    raise SystemExit("Не нашёл ни одного packages/<pkg>/package.json — правьте вручную.")

old = """    volumes:
      - ../../../apps/web:/app/apps/web
      - ../../../packages:/app/packages
      - /app/apps/web/node_modules
      - /app/node_modules
"""
extra_lines = "".join(f"      - /app/packages/{pkg}/node_modules\n" for pkg in pkgs)
new = (
    "    volumes:\n"
    "      - ../../../apps/web:/app/apps/web\n"
    "      - ../../../packages:/app/packages\n"
    "      - /app/apps/web/node_modules\n"
    "      - /app/node_modules\n"
    f"{extra_lines}"
)

already = [pkg for pkg in pkgs if f"/app/packages/{pkg}/node_modules" in content]
if already:
    print(f"{path}: похоже, уже применено (найдены строки для: {', '.join(already)}) — пропускаю, ничего не меняю.")
    raise SystemExit(0)

count = content.count(old)
if count != 1:
    raise SystemExit(
        f"Ожидал ровно 1 вхождение блока volumes у web в {path}, нашёл {count}. "
        f"Похоже, файл уже отличается от ожидаемого — правьте вручную по инструкции "
        f"в чате (добавить '- /app/packages/<pkg>/node_modules' для каждого пакета: "
        f"{', '.join(pkgs)})."
    )

open(path, "w", encoding="utf-8").write(content.replace(old, new))
print(f"{path}: добавлены node_modules-volume'ы для: {', '.join(pkgs)}")
PYEOF

echo
echo "===================================================================="
echo "Дальше — ОБЯЗАТЕЛЬНО сброс volume'ов (новые строки не подхватятся"
echo "простым up --build, т.к. у web уже есть контейнер с прошлого раза):"
echo
echo "  docker compose --env-file .env.dev -f deployments/docker/dev/docker-compose.yml down -v"
echo "  git status / git diff   — проверить правку compose-файла"
echo "  git add -A && git commit -m '...' — коммит делаете сами"
echo "  make dev"
echo "===================================================================="