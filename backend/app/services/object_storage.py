from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

import boto3
from botocore.client import Config
from fastapi import HTTPException, status

from app.core.config import get_settings


ALLOWED_MEDIA_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


@dataclass
class PresignedUpload:
    upload_url: str
    public_url: str
    object_key: str
    headers: dict[str, str]


class ObjectStorageClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def enabled(self) -> bool:
        return bool(
            self.settings.media_storage_endpoint_url
            and self.settings.media_storage_bucket
            and self.settings.media_storage_access_key_id
            and self.settings.media_storage_secret_access_key
        )

    def ensure_configured(self) -> None:
        if self.enabled:
            return
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Хранилище медиа не настроено.",
        )

    def generate_menu_item_upload(self, *, user_id: str, filename: str, content_type: str) -> PresignedUpload:
        self.ensure_configured()

        normalized_content_type = content_type.strip().lower()
        extension = ALLOWED_MEDIA_CONTENT_TYPES.get(normalized_content_type)
        if extension is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Поддерживаются только изображения JPG, PNG и WEBP.",
            )

        suffix = Path(filename).suffix.lower()
        object_extension = extension if extension == ".webp" else suffix or extension
        object_key = f"menu-items/{user_id}/{uuid4().hex}{object_extension}"
        upload_url = self._client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self.settings.media_storage_bucket,
                "Key": object_key,
                "ContentType": normalized_content_type,
            },
            ExpiresIn=900,
            HttpMethod="PUT",
        )
        return PresignedUpload(
            upload_url=upload_url,
            public_url=self._build_public_url(object_key),
            object_key=object_key,
            headers={"Content-Type": normalized_content_type},
        )

    @property
    def _client(self):
        return boto3.client(
            "s3",
            endpoint_url=self.settings.media_storage_endpoint_url,
            region_name=self.settings.media_storage_region,
            aws_access_key_id=self.settings.media_storage_access_key_id,
            aws_secret_access_key=self.settings.media_storage_secret_access_key,
            config=Config(signature_version="s3v4"),
        )

    def _build_public_url(self, object_key: str) -> str:
        base_url = (self.settings.media_storage_public_base_url or "").rstrip("/")
        if base_url:
            return f"{base_url}/{object_key}"

        endpoint = (self.settings.media_storage_endpoint_url or "").rstrip("/")
        bucket = self.settings.media_storage_bucket or ""
        if not endpoint or not bucket:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Публичный URL для медиа не настроен.",
            )
        return f"{endpoint}/{bucket}/{object_key}"
