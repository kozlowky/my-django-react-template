import asyncio

from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = "core"
    default_auto_field = "django.db.models.BigAutoField"
    default = True

    def ready(self) -> None:
        from core.broker import broker

        try:
            asyncio.run(broker.startup())
        except RuntimeError:
            pass
