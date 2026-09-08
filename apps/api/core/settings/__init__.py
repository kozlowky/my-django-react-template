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
