from datetime import datetime

from pydantic import Field

from app.schemas.menu import MenuPayload, StrictModel
from app.schemas.menu_import import MenuImportStatus, UploadedSource


class DemoTokenRequest(StrictModel):
    token: str


class DemoTokenResponse(StrictModel):
    ok: bool


class TemporaryMenuAcceptedResponse(StrictModel):
    id: str
    status: MenuImportStatus
    pollUrl: str
    publicPath: str
    createdAt: datetime


class TemporaryMenuResult(StrictModel):
    id: str
    menu: MenuPayload
    sourceSummary: list[UploadedSource]
    categoryCount: int
    itemCount: int
    documentCount: int
    usedFallback: bool = False
    warnings: list[str] = Field(default_factory=list)


class TemporaryMenuJobResponse(StrictModel):
    id: str
    status: MenuImportStatus
    publicPath: str
    createdAt: datetime
    updatedAt: datetime
    startedAt: datetime | None = None
    completedAt: datetime | None = None
    error: str | None = None
    result: TemporaryMenuResult | None = None
