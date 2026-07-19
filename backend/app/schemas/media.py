from __future__ import annotations

from typing import Literal

from pydantic import Field

from app.schemas.menu import StrictModel


class MediaUploadUrlRequest(StrictModel):
    filename: str = Field(min_length=1, max_length=255)
    contentType: str = Field(min_length=1, max_length=255)
    assetType: Literal["menu-item", "category", "promo", "venue-cover", "venue-logo"] = "menu-item"


class MediaUploadUrlResponse(StrictModel):
    uploadUrl: str
    publicUrl: str
    objectKey: str
    method: str = "PUT"
    headers: dict[str, str]
