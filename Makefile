ENV_DEV := .env.dev
ENV_PROD := .env.prod
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
