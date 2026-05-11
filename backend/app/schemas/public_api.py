from __future__ import annotations

from app.schemas.menu import MenuPayload, StrictModel


class PublicVenueDesignResponse(StrictModel):
    template: str = "classic"
    accentColor: str = "#6d67eb"
    logoUrl: str | None = None


class PublicVenueQrResponse(StrictModel):
    style: str = "rounded"
    color: str = "#863bff"
    logoUrl: str | None = None
    hasFrame: bool = True
    frameText: str = "СКАНИРУЙ МЕНЮ"
    frameColor: str = "#08060d"
    publicPath: str
    publicUrl: str


class PublicVenueResponse(StrictModel):
    id: str
    name: str
    description: str | None = None
    city: str | None = None
    country: str | None = None
    currency: str = "RUB"
    publicPath: str
    publicUrl: str
    design: PublicVenueDesignResponse
    qr: PublicVenueQrResponse


class PublicMenuResponse(StrictModel):
    id: str
    venueId: str
    name: str
    slug: str
    description: str | None = None
    status: str
    payload: MenuPayload


class PublicVenueMenusResponse(StrictModel):
    venue: PublicVenueResponse
    menus: list[PublicMenuResponse]
