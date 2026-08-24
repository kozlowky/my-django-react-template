#!/bin/bash
set -e

echo "🚀 Setting up Django + React Template..."


echo "📦 Setting up backend..."
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e .
python manage.py migrate
python manage.py createsuperuser --username admin --email admin@example.com --no-input || true
cd ../..

# Настройка frontend
echo "📦 Setting up frontend..."
cd apps/web
pnpm install
cd ../..

echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "  cd apps/api && source .venv/bin/activate && python manage.py runserver"
echo "  cd apps/web && pnpm dev"
echo ""
echo "Or with Docker:"
echo "  docker-compose up -d"
