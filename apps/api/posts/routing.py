from django.urls import re_path
from .consumers import FeedConsumer

websocket_urlpatterns = [
    re_path(r"^ws/feed/$", FeedConsumer.as_asgi()),
]
