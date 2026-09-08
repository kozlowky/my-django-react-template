from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from accounts.models import User
from django.http import HttpRequest, HttpResponse
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken


@dataclass
class GraphQLContext:
    request: HttpRequest
    response: HttpResponse

    _user: Optional[User] = field(default=None, init=False, repr=False)
    _user_resolved: bool = field(default=False, init=False, repr=False)

    @property
    def user(self) -> Optional[User]:
        """Lazy — токен валидируется только если поле реально нужно."""
        if not self._user_resolved:
            self._user_resolved = True
            auth = self.request.headers.get("Authorization", "")
            if auth.startswith("Bearer "):
                try:
                    payload = UntypedToken(auth[7:])  # type: ignore[arg-type]
                    self._user = User.objects.get(pk=payload["user_id"])
                except (InvalidToken, TokenError, User.DoesNotExist):
                    pass
        return self._user

    @property
    def is_authenticated(self) -> bool:
        return self.user is not None
