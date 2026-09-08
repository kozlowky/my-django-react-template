import os

from storages.backends.s3 import S3Storage


def _common_opts() -> dict:
    return {
        "endpoint_url": os.environ.get("S3_ENDPOINT_URL", "http://minio:9000"),
        "access_key": os.environ.get("S3_ACCESS_KEY", "minioadmin"),
        "secret_key": os.environ.get("S3_SECRET_KEY", "minioadmin123"),
        "region_name": os.environ.get("S3_REGION", "us-east-1"),
        "addressing_style": "path",
        "use_ssl": os.environ.get("S3_USE_SSL", "false").lower() == "true",
        "default_acl": None,
        "querystring_auth": True,
        "file_overwrite": False,
    }


class UsersStorage(S3Storage):
    """Приватный бакет для медиа профиля (аватары)."""

    def __init__(self, **kwargs):
        super().__init__(
            bucket_name=os.environ.get("S3_USERS_BUCKET", "users"),
            **{**_common_opts(), **kwargs},
        )


class PostsStorage(S3Storage):
    """Приватный бакет для медиа постов: user_{id}/YYYYMMDD/."""

    def __init__(self, **kwargs):
        super().__init__(
            bucket_name=os.environ.get("S3_POSTS_BUCKET", "posts"),
            **{**_common_opts(), **kwargs},
        )
