from typing import Annotated, ClassVar

from drf_pydantic import BaseModel
from pydantic import EmailStr, Field


class RequestOTPModel(BaseModel):
    email: EmailStr

    drf_config: ClassVar[dict] = {"validate_pydantic": True}


class VerifyOTPModel(BaseModel):
    email: EmailStr
    code: Annotated[str, Field(pattern=r"^\d{4}$")]

    drf_config: ClassVar[dict] = {"validate_pydantic": True}


class MessageModel(BaseModel):
    detail: str


class UserModel(BaseModel):
    id: int
    email: EmailStr


class VerifyOTPResponseModel(BaseModel):
    access: str
    refresh: str
    is_new_user: bool
    user: UserModel
