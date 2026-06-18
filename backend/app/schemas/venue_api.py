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
    currency: str | None = Field(default=None, max_length=8)
    instagramUrl: str | None = Field(default=None, max_length=512)


class VenueProfileUpdateRequest(StrictModel):
    name: str = Field(min_length=2, max_length=255)
    phone: str | None = Field(default=None, max_length=64)
    country: str | None = Field(default=None, max_length=64)
    city: str | None = Field(default=None, max_length=128)
    description: str | None = None
    currency: str | None = Field(default=None, max_length=8)
    instagramUrl: str | None = Field(default=None, max_length=512)


class VenueWifiSettingsUpdateRequest(StrictModel):
    enabled: bool = False
    ssid: str | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, max_length=255)


class VenueDesignSettingsUpdateRequest(StrictModel):
    template: str = Field(min_length=2, max_length=32)
    accentColor: str = Field(min_length=4, max_length=16)
    logoUrl: str | None = None


class VenueQrSettingsUpdateRequest(StrictModel):
    style: str = Field(min_length=2, max_length=32)
    color: str = Field(min_length=4, max_length=16)
    logoUrl: str | None = None
    hasFrame: bool = True
    frameText: str = Field(min_length=1, max_length=64)
    frameColor: str = Field(min_length=4, max_length=16)
    publicMenuEnabled: bool = True


class VenueWifiSettingsResponse(StrictModel):
    enabled: bool = False
    ssid: str | None = None
    password: str | None = None


class VenueDesignSettingsResponse(StrictModel):
    template: str = "classic"
    accentColor: str = "#6d67eb"
    logoUrl: str | None = None


class VenueQrSettingsResponse(StrictModel):
    style: str = "rounded"
    color: str = "#863bff"
    logoUrl: str | None = None
    hasFrame: bool = True
    frameText: str = "SCAN MENU"
    frameColor: str = "#08060d"
    publicMenuEnabled: bool = True
    publicPath: str
    publicUrl: str


class VenueSettingsResponse(StrictModel):
    id: str
    venueId: str
    currency: str = "USD"
    wifi: VenueWifiSettingsResponse
    design: VenueDesignSettingsResponse
    qr: VenueQrSettingsResponse
    createdAt: datetime
    updatedAt: datetime


class VenueResponse(StrictModel):
    id: str
    name: str
    phone: str | None = None
    country: str | None = None
    city: str | None = None
    description: str | None = None
    instagramUrl: str | None = None
    currency: str = "USD"
    publicPath: str
    publicUrl: str
    createdAt: datetime
    updatedAt: datetime
    menusCount: int = 0
