from __future__ import annotations

from pydantic import Field

from app.schemas.menu import StrictModel


class PromoPageCreateRequest(StrictModel):
    slug: str = Field(..., max_length=255)
    title: str = Field(..., max_length=255)
    content: dict = Field(...)


class PromoPageUpdateRequest(StrictModel):
    slug: str | None = Field(default=None, max_length=255)
    title: str | None = Field(default=None, max_length=255)
    content: dict | None = Field(default=None)
