from typing import Any
from strawberry.permission import BasePermission
from strawberry.types import Info
from .context import GraphQLContext


class IsAuthenticated(BasePermission):
    message = "Authentication required."

    def has_permission(
        self, source: Any, info: Info[GraphQLContext, None], **kwargs: Any
    ) -> bool:
        return info.context.is_authenticated