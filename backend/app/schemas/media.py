from __future__ import annotations

from pydantic import Field

from app.schemas.menu import StrictModel


class MediaUploadUrlRequest(StrictModel):
    filename: str = Field(min_length=1, max_length=255)
    contentType: str = Field(min_length=1, max_length=255)


class MediaUploadUrlResponse(StrictModel):
    uploadUrl: str
    publicUrl: str
    objectKey: str
    method: str = "PUT"
    headers: dict[str, str]
