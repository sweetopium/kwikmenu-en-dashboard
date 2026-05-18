from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.schemas.menu import StrictModel


class HelpRequestResponse(StrictModel):
    id: str
    createdAt: datetime
    telegramDelivered: bool = False


class HelpRequestCreateResponse(HelpRequestResponse):
    status: str = "accepted"


class HelpRequestTelegramMeta(StrictModel):
    delivered: bool = False
    chatId: str | None = None
    messageId: int | None = None
    error: str | None = None


class HelpRequestAdminResponse(StrictModel):
    id: str
    name: str
    phone: str
    messenger: str
    countryCode: str
    countryName: str
    city: str
    restaurantName: str
    uploadLater: bool
    menuSource: str
    menuLink: str | None = None
    menuFileName: str | None = None
    menuFileMimeType: str | None = None
    menuFileSizeBytes: int | None = None
    ipAddress: str | None = None
    createdAt: datetime
    updatedAt: datetime
    telegram: HelpRequestTelegramMeta = Field(default_factory=HelpRequestTelegramMeta)
