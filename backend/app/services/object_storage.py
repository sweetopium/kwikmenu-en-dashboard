from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re
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


@dataclass
class StoredObject:
    public_url: str
    object_key: str


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
            detail="Media storage is not configured.",
        )

    def generate_menu_item_upload(self, *, user_id: str, filename: str, content_type: str) -> PresignedUpload:
        return self.generate_image_upload(user_id=user_id, filename=filename, content_type=content_type, asset_type="menu-item")

    def generate_image_upload(self, *, user_id: str, filename: str, content_type: str, asset_type: str) -> PresignedUpload:
        self.ensure_configured()

        normalized_content_type = content_type.strip().lower()
        extension = ALLOWED_MEDIA_CONTENT_TYPES.get(normalized_content_type)
        if extension is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only JPG, PNG, and WEBP images are supported.",
            )

        suffix = Path(filename).suffix.lower()
        object_extension = extension if extension == ".webp" else suffix or extension
        asset_prefixes = {
            "menu-item": "menu-items",
            "category": "menu-categories",
            "promo": "menu-promos",
            "venue-cover": "venue-covers",
            "venue-logo": "venue-logos",
        }
        prefix = asset_prefixes.get(asset_type)
        if prefix is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported media asset type.")
        object_key = f"{prefix}/{user_id}/{uuid4().hex}{object_extension}"
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

    def upload_menu_import_source(
        self,
        *,
        job_id: str,
        file_path: Path,
        content_type: str | None,
    ) -> StoredObject:
        self.ensure_configured()

        safe_name = self._sanitize_object_filename(file_path.name)
        object_key = f"menu-imports/{job_id}/originals/{uuid4().hex}-{safe_name}"
        extra_args: dict[str, str] = {}
        if content_type:
            extra_args["ContentType"] = content_type.strip().lower()

        if extra_args:
            self._client.upload_file(
                str(file_path),
                self.settings.media_storage_bucket,
                object_key,
                ExtraArgs=extra_args,
            )
        else:
            self._client.upload_file(
                str(file_path),
                self.settings.media_storage_bucket,
                object_key,
            )
        return StoredObject(
            public_url=self._build_public_url(object_key),
            object_key=object_key,
        )

    @property
    def _client(self):
        return boto3.client(
            "s3",
            endpoint_url=self.settings.media_storage_endpoint_url,
            region_name=self.settings.media_storage_region,
            aws_access_key_id=self.settings.media_storage_access_key_id,
            aws_secret_access_key=self.settings.media_storage_secret_access_key,
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": "virtual"},
            ),
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
                detail="Public media URL is not configured.",
            )
        return f"{endpoint}/{bucket}/{object_key}"

    def _sanitize_object_filename(self, filename: str) -> str:
        raw_name = Path(filename or "menu-source").name
        safe_name = re.sub(r"[^A-Za-z0-9._-]+", "-", raw_name).strip(".-")
        return safe_name or "menu-source"
