from __future__ import annotations

from pydantic import Field

from app.schemas.menu import MenuPayload, StrictModel
from app.schemas.venue_api import BrandedDesignConfig


class PublicVenueDesignResponse(StrictModel):
    template: str = "classic"
    accentColor: str = "#6d67eb"
    logoUrl: str | None = None
    branded: BrandedDesignConfig = Field(default_factory=BrandedDesignConfig)


class PublicVenueWifiResponse(StrictModel):
    enabled: bool = False
    ssid: str | None = None
    password: str | None = None


class PublicVenueQrResponse(StrictModel):
    style: str = "rounded"
    color: str = "#863bff"
    logoUrl: str | None = None
    hasFrame: bool = True
    frameText: str = "SCAN MENU"
    frameColor: str = "#08060d"
    publicPath: str
    publicUrl: str


class PublicVenueResponse(StrictModel):
    id: str
    name: str
    description: str | None = None
    phone: str | None = None
    city: str | None = None
    country: str | None = None
    instagramUrl: str | None = None
    websiteUrl: str | None = None
    addressLine: str | None = None
    businessHoursText: str | None = None
    currency: str = "USD"
    publicPath: str
    publicUrl: str
    design: PublicVenueDesignResponse
    wifi: PublicVenueWifiResponse
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


class PublicBillingPlanFeatureResponse(StrictModel):
    key: str
    label: str
    enabled: bool
    value: str | int | float | bool | None = None


class PublicBillingPlanResponse(StrictModel):
    id: str
    code: str
    name: str
    description: str | None = None
    priceAmount: float
    annualPriceAmount: float
    currency: str
    billingPeriod: str
    sortOrder: int
    isFeatured: bool = False
    maxVenues: int
    maxMenusPerVenue: int
    maxMenuItemsPerMenu: int
    aiImportsPerMonth: int
    publicMenuEnabled: bool
    translationsEnabled: bool
    maxTranslationLanguages: int
    analyticsEnabled: bool
    qrCustomizationEnabled: bool
    menuDesignCustomizationEnabled: bool
    maxTemplateTier: str
    prioritySupportEnabled: bool
    marketingFeatures: list[str]
    featureFlags: list[PublicBillingPlanFeatureResponse]
