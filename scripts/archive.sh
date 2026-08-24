#!/bin/bash
# scripts/archive.sh

PROJECT_NAME="my-template"
OUTPUT_DIR="../"

# Список исключений
EXCLUDE_LIST=(
  ".venv"
  "__pycache__"
  ".git"
  "node_modules"
  "*.log"
  "*.sqlite3"
  ".DS_Store"
  "dist"
  ".vite"
  "*.pyc"
  ".pytest_cache"
  ".mypy_cache"
  "*.egg-info"
)

# Собираем аргументы для tar
EXCLUDE_ARGS=""
for item in "${EXCLUDE_LIST[@]}"; do
  EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude=$item"
done

# Создаём архив
echo "📦 Creating archive..."
tar -czf "$OUTPUT_DIR/$PROJECT_NAME.tar.gz" $EXCLUDE_ARGS .

echo "✅ Archive created: $OUTPUT_DIR/$PROJECT_NAME.tar.gz"

