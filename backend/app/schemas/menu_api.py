from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.schemas.menu import MenuPayload, StrictModel


class MenuResponse(StrictModel):
    id: str
    venueId: str
    name: str
    slug: str
    description: str | None = None
    status: str
    payload: MenuPayload
    createdAt: datetime
    updatedAt: datetime


class MenuListItemResponse(StrictModel):
    id: str
    venueId: str
    name: str
    description: str | None = None
    status: str
    categoriesCount: int
    itemsCount: int
    updatedAt: datetime


class MenuUpdateRequest(StrictModel):
    payload: MenuPayload
    status: str | None = Field(default=None, max_length=32)
