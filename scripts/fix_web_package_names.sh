#!/usr/bin/env bash
# SELTE — фикс несовпадения имён пакетов: apps/web/package.json просил
# @selte/design-tokens, @selte/types, @selte/shared-ui, а реально в
# packages/*/package.json они называются @selted/design-tokens,
# @selted/design-types, @selted/shared-ui.
#
# Решение (по вашему выбору): правим зависимости в apps/web/package.json
# под реальные имена пакетов, а НЕ переименовываем сами packages/*.
#
# Проверено заранее: в apps/web/src, а также во всём остальном репозитории
# (кроме apps/web/package.json), нет ни одного импорта "@selte/..." — то
# есть исходный код нигде не ссылается на старое имя напрямую, менять
# нужно только dependencies в package.json.
#
# Запускать из КОРНЯ репозитория SELTE, после fix_web_workspace_build.sh.
# Ничего не коммитит.
set -euo pipefail

if [ ! -d ".git" ] || [ ! -f "apps/web/package.json" ]; then
  echo "Похоже, скрипт запущен не из корня репозитория SELTE. Прервано." >&2
  exit 1
fi

echo "==> 1/2  apps/web/package.json: @selte/* -> @selted/* (+ types -> design-types)"
python3 - <<'PYEOF'
path = "apps/web/package.json"
content = open(path, encoding="utf-8").read()

replacements = [
    ('"@selte/design-tokens": "workspace:*",', '"@selted/design-tokens": "workspace:*",'),
    ('"@selte/types": "workspace:*",',         '"@selted/design-types": "workspace:*",'),
    ('"@selte/shared-ui": "workspace:*"',      '"@selted/shared-ui": "workspace:*"'),
]

missing = [old for old, _ in replacements if old not in content]
if missing:
    raise SystemExit(
        "Не нашёл ожидаемые строки в " + path + ":\n  " + "\n  ".join(missing) +
        "\nПравьте вручную по инструкции в чате."
    )

for old, new in replacements:
    content = content.replace(old, new)

open(path, "w", encoding="utf-8").write(content)
print(path + " обновлён")
PYEOF

echo "==> 2/2  готово"
echo
echo "===================================================================="
echo "Дальше:"
echo "  1) pnpm install   — из КОРНЯ репозитория (пересоберёт pnpm-lock.yaml"
echo "     с учётом настоящих имён @selted/*)"
echo "  2) git status / git diff — проверить (package.json + pnpm-lock.yaml)"
echo "  3) git add -A && git commit -m '...' — коммит делаете сами"
echo "  4) make dev"
echo
echo "Если где-то в apps/web/src или в другом месте репозитория позже"
echo "появится импорт \"@selte/...\" — его тоже нужно будет поправить на"
echo "\"@selted/...\", но на момент проверки (26.08.2026) таких импортов"
echo "в репозитории не было — только эти 3 строки в package.json."
echo "===================================================================="