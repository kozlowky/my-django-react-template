"""
FeedConsumer — single WebSocket per user session.

Protocol (client → server):
  { "action": "subscribe",   "post_id": "123" }
  { "action": "unsubscribe", "post_id": "123" }
  { "action": "like",        "post_id": "123" }
  { "action": "unlike",      "post_id": "123" }

Protocol (server → client):
  { "type": "likes_update", "post_id": "123", "likes_count": 42, "is_liked": true }
  { "type": "error",        "message": "..." }
"""

import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser


class FeedConsumer(AsyncWebsocketConsumer):
    # ------------------------------------------------------------------ lifecycle

    async def connect(self):
        self.subscriptions: set[str] = set()
        user = self.scope.get("user")
        self.user_id: int | None = (
            user.pk if user and not isinstance(user, AnonymousUser) else None
        )
        await self.accept()

    async def disconnect(self, code):
        for post_id in list(self.subscriptions):
            await self.channel_layer.group_discard(
                self._group(post_id), self.channel_name
            )

    # ------------------------------------------------------------------ incoming

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or "{}")
        except json.JSONDecodeError:
            return

        action = data.get("action")
        post_id = str(data.get("post_id", ""))
        if not post_id:
            return

        if action == "subscribe":
            await self._subscribe(post_id)

        elif action == "unsubscribe":
            await self._unsubscribe(post_id)

        elif action in ("like", "unlike"):
            if not self.user_id:
                await self.send(
                    json.dumps({"type": "error", "message": "auth_required"})
                )
                return
            is_liked, likes_count = await self._toggle_like(
                post_id, action == "like"
            )
            await self.channel_layer.group_send(
                self._group(post_id),
                {
                    "type": "likes_update",
                    "post_id": post_id,
                    "likes_count": likes_count,
                    "is_liked": is_liked,
                },
            )

    # ------------------------------------------------------------------ outgoing

    async def likes_update(self, event):
        """Called by channel layer when any consumer broadcasts to this group."""
        await self.send(
            json.dumps(
                {
                    "type": "likes_update",
                    "post_id": event["post_id"],
                    "likes_count": event["likes_count"],
                    "is_liked": event["is_liked"],
                }
            )
        )

    # ------------------------------------------------------------------ helpers

    @staticmethod
    def _group(post_id: str) -> str:
        return f"post_{post_id}"

    async def _subscribe(self, post_id: str):
        if post_id not in self.subscriptions:
            self.subscriptions.add(post_id)
            await self.channel_layer.group_add(self._group(post_id), self.channel_name)

    async def _unsubscribe(self, post_id: str):
        if post_id in self.subscriptions:
            self.subscriptions.discard(post_id)
            await self.channel_layer.group_discard(
                self._group(post_id), self.channel_name
            )

    @database_sync_to_async
    def _toggle_like(self, post_id: str, do_like: bool) -> tuple[bool, int]:
        from posts.models import Like, Post

        try:
            post = Post.objects.get(pk=int(post_id))
        except Post.DoesNotExist:
            return False, 0

        if do_like:
            Like.objects.get_or_create(user_id=self.user_id, post=post)
        else:
            Like.objects.filter(user_id=self.user_id, post=post).delete()

        likes_count = post.likes.count()
        is_liked = do_like
        return is_liked, likes_count
