from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.schemas.menu import StrictModel


class BillingPlanResponse(StrictModel):
    id: str
    code: str
    name: str
    description: str | None = None
    priceAmount: float
    currency: str
    billingPeriod: str
    isActive: bool
    isPublic: bool
    sortOrder: int
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


class BillingPlanUpdateRequest(StrictModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = None
    priceAmount: float = Field(ge=0)
    currency: str = Field(min_length=3, max_length=8)
    billingPeriod: str = Field(min_length=1, max_length=16)
    isActive: bool
    isPublic: bool
    sortOrder: int = Field(ge=0, le=1000)
    maxVenues: int = Field(ge=1, le=1000)
    maxMenusPerVenue: int = Field(ge=1, le=1000)
    maxMenuItemsPerMenu: int = Field(ge=1, le=10000)
    aiImportsPerMonth: int = Field(ge=0, le=10000)
    publicMenuEnabled: bool
    translationsEnabled: bool
    maxTranslationLanguages: int = Field(ge=0, le=100)
    analyticsEnabled: bool
    qrCustomizationEnabled: bool
    menuDesignCustomizationEnabled: bool
    maxTemplateTier: str = Field(min_length=1, max_length=32)
    prioritySupportEnabled: bool


class BillingUsageResponse(StrictModel):
    venuesCount: int
    maxVenues: int
    aiImportsUsedThisMonth: int
    aiImportsPerMonth: int
    translationsEnabled: bool
    maxTranslationLanguages: int


class BillingSubscriptionResponse(StrictModel):
    id: str
    status: str
    cancelAtPeriodEnd: bool
    trialEndsAt: datetime | None = None
    currentPeriodStart: datetime | None = None
    currentPeriodEnd: datetime | None = None
    lastPaymentAt: datetime | None = None
    lastPaymentStatus: str | None = None
    unitpaySubscriptionId: str | None = None
    plan: BillingPlanResponse


class BillingTransactionResponse(StrictModel):
    id: str
    kind: str
    status: str
    amount: float
    currency: str
    description: str | None = None
    unitpayPaymentId: str | None = None
    unitpaySubscriptionId: str | None = None
    checkoutUrl: str | None = None
    receiptUrl: str | None = None
    isTest: bool
    errorMessage: str | None = None
    processedAt: datetime | None = None
    createdAt: datetime
    planCode: str
    planName: str


class BillingSummaryResponse(StrictModel):
    subscription: BillingSubscriptionResponse
    usage: BillingUsageResponse
    plans: list[BillingPlanResponse]
    recentTransactions: list[BillingTransactionResponse]


class BillingCheckoutRequest(StrictModel):
    planCode: str = Field(min_length=1, max_length=32)


class BillingCheckoutResponse(StrictModel):
    transaction: BillingTransactionResponse
    redirectUrl: str | None = None


class BillingSyncResponse(StrictModel):
    subscription: BillingSubscriptionResponse
    syncedAt: datetime
