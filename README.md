<div align="center">

# Django + React Template

**Современный full-stack монорепозиторий для быстрого старта веб-приложений**

[![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.1-092E20?style=flat-square&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

[Быстрый старт](#-быстрый-старт) · [Архитектура](#%EF%B8%8F-архитектура) · [Структура](#-структура-проекта) · [Команды](#-команды)

</div>

---

## О проекте

Готовый монорепозиторий для разработки full-stack приложений. Всё уже настроено — просто клонируй и начинай писать бизнес-логику.

**Что включено из коробки:**

| Функция | Статус |
|---------|--------|
| Django REST API (Python 3.14) | ✅ |
| React 19 + Vite + TypeScript 6 | ✅ |
| PostgreSQL 16 | ✅ |
| Docker + Docker Compose | ✅ |
| Монорепозиторий (Turborepo) | ✅ |
| Hot Reload в режиме разработки | ✅ |
| Health check эндпоинт | ✅ |
| Скрипт автонастройки окружения | ✅ |

---

## 🛠️ Стек технологий

| Слой | Технология |
|------|-----------|
| Backend | Django 5.1 + Django REST Framework |
| Frontend | React 19 + TypeScript 6 |
| Сборщик | Vite 8 |
| База данных | PostgreSQL 16 |
| Пакетные менеджеры | pnpm 9 (JS) + uv (Python) |
| Монорепозиторий | Turborepo |
| Контейнеризация | Docker + Docker Compose |

---

## 🏗️ Архитектура

```
Браузер (localhost:3000)
        │
        ▼
┌────────────────────────┐
│  React 19 + Vite       │  apps/web/
│  TypeScript 6          │
│  (serve / pnpm dev)    │
└──────────┬─────────────┘
           │  /api/* → proxy
           ▼
┌────────────────────────┐
│  Django REST Framework │  apps/api/
│  python manage.py      │
│  runserver :8000       │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  PostgreSQL 16         │  порт 5432
│  (healthcheck готов)   │
└────────────────────────┘
```

> В режиме разработки Vite проксирует `/api/*` напрямую на Django (`http://api:8000`).
> В продакшене фронтенд собирается и раздаётся через `serve` — `nginx.conf` заготовлен для перехода на nginx-образ.

---

## 📂 Структура проекта

```
my-django-react-template/
├── apps/
│   ├── api/                        # Django REST API
│   │   ├── core/                   # Настройки Django (settings, urls, wsgi, asgi)
│   │   ├── tasks/                  # Пример приложения + health check эндпоинт
│   │   │   └── migrations/
│   │   ├── manage.py
│   │   ├── wait-for-db.sh          # Ждёт готовности PostgreSQL перед стартом
│   │   ├── Dockerfile
│   │   └── pyproject.toml          # Зависимости + uv
│   ├── web/                        # React 19 фронтенд
│   │   ├── src/
│   │   │   ├── App.tsx             # Главный компонент (пример запроса к API)
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── nginx.conf              # Готов к переходу на nginx-образ в продакшене
│   │   ├── Dockerfile
│   │   ├── vite.config.ts          # Proxy /api → Django настроен
│   │   └── package.json
│   ├── admin/                      # (заготовка) Административная панель
│   └── space/                      # (заготовка) Публичная часть
├── packages/
│   ├── shared-ui/                  # (заготовка) Общие UI-компоненты
│   ├── types/                      # (заготовка) Общие TypeScript типы
│   └── utils/                      # (заготовка) Общие утилиты
├── deployments/
│   ├── docker/                     # Docker-конфиги для деплоя
│   └── kubernetes/                 # K8s-манифесты
├── scripts/
│   ├── setup.sh                    # Автонастройка локального окружения
│   └── archive.sh                  # Создание архива проекта без мусора
├── docker-compose.yml
├── package.json                    # Корневой (Turborepo)
├── pnpm-workspace.yaml
├── .env.example                    # Шаблон переменных окружения
└── .gitignore
```

---

## 🚀 Быстрый старт

### Вариант 1 — Автоматическая настройка (рекомендуется для локальной разработки)

```bash
git clone https://github.com/your-username/my-django-react-template.git
cd my-django-react-template

chmod +x scripts/setup.sh
./scripts/setup.sh
```

Скрипт создаст виртуальное окружение, установит зависимости, применит миграции и создаст суперпользователя (`admin` / `password`).

### Вариант 2 — Docker (рекомендуется для воспроизводимости)

```bash
git clone https://github.com/your-username/my-django-react-template.git
cd my-django-react-template

# Скопировать переменные окружения
cp .env.example .env

# Запустить все сервисы
docker-compose up -d

# Проверить работоспособность
curl http://localhost:8000/api/health/
# → {"status":"ok","message":"API is working!"}
```

### Вариант 3 — Ручная локальная установка

**Backend:**

```bash
cd apps/api

python -m venv .venv
source .venv/bin/activate        # Linux / macOS
# .venv\Scripts\activate         # Windows

pip install -e .

python manage.py migrate
python manage.py createsuperuser

python manage.py runserver
```

**Frontend:**

```bash
cd apps/web
pnpm install
pnpm dev
```

### Сервисы после запуска

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000/api |
| Health Check | http://localhost:8000/api/health/ |
| Django Admin | http://localhost:8000/admin |

---

## 🌐 Переменные окружения

Скопируй `.env.example` в `.env` и при необходимости измени значения:

```env
# Подключение к PostgreSQL (используется в docker-compose)
DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp

# URL бэкенда для фронтенда
VITE_API_URL=http://localhost:8000/api
```

> В `docker-compose.yml` переменные БД (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`) передаются напрямую в контейнер `api` — `settings.py` читает их через `os.environ.get`.

---

## 📋 Команды

### Docker

```bash
# Запустить все сервисы
docker-compose up -d

# Пересобрать образы и запустить
docker-compose up --build -d

# Остановить
docker-compose down

# Логи конкретного сервиса
docker-compose logs -f api
docker-compose logs -f web

# Выполнить команду внутри контейнера
docker-compose exec api python manage.py migrate
docker-compose exec api python manage.py createsuperuser
docker-compose exec web sh

# Перезапустить сервис
docker-compose restart api
```

### Локальная разработка

```bash
# Backend
cd apps/api && source .venv/bin/activate && python manage.py runserver

# Frontend
cd apps/web && pnpm dev

# Сборка фронтенда для продакшена
cd apps/web && pnpm build

# Линтинг
cd apps/web && pnpm lint
```

### Turborepo (из корня монорепозитория)

```bash
pnpm dev     # запускает turbo dev (все apps параллельно)
pnpm build   # запускает turbo build
```

---

## 🧩 Разработка

### Добавить новое Django-приложение

```bash
# Через Docker
docker-compose exec api python manage.py startapp myapp

# Или локально
cd apps/api && python manage.py startapp myapp
```

Добавь `"myapp"` в `INSTALLED_APPS` в `apps/api/core/settings.py`.

### Добавить React-компонент

```bash
mkdir -p apps/web/src/components
touch apps/web/src/components/MyComponent.tsx
```

### Наполнить общий пакет

Пакеты в `packages/` (`shared-ui`, `types`, `utils`) — пустые заготовки.
Пример инициализации:

```bash
cd packages/shared-ui
pnpm init
# добавь src/index.ts и настрой package.json
```

После этого подключи пакет в `apps/web/package.json`:

```json
"dependencies": {
  "shared-ui": "workspace:*"
}
```

---

## 🤝 Участие в проекте

1. Сделайте форк репозитория
2. Создайте ветку: `git checkout -b feature/my-feature`
3. Закоммитьте изменения: `git commit -m 'Add my feature'`
4. Отправьте в форк: `git push origin feature/my-feature`
5. Откройте Pull Request

---

## 📝 Лицензия

Распространяется под лицензией **MIT**.

---

<div align="center">

Если шаблон оказался полезным — поставьте ⭐

</div>