from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.schemas.menu import StrictModel


class VenueCreateRequest(StrictModel):
    name: str = Field(min_length=2, max_length=255)
    phone: str | None = Field(default=None, max_length=64)
    country: str | None = Field(default=None, max_length=64)
    city: str | None = Field(default=None, max_length=128)
    description: str | None = None


class VenueResponse(StrictModel):
    id: str
    name: str
    phone: str | None = None
    country: str | None = None
    city: str | None = None
    description: str | None = None
    createdAt: datetime
    updatedAt: datetime
    menusCount: int = 0
