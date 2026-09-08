import os

from taskiq import TaskiqEvents, TaskiqState
from taskiq_redis import ListQueueBroker

broker = ListQueueBroker(
    url=os.environ.get("REDIS_URL", "redis://redis:6379") + "/0",
    socket_timeout=None,
    socket_connect_timeout=5,
)


@broker.on_event(TaskiqEvents.WORKER_STARTUP)
async def setup_django(state: TaskiqState) -> None:
    import django

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
    django.setup()

    import accounts.tasks  # noqa: F401
