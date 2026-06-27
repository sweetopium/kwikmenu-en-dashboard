from datetime import datetime
from enum import Enum

from pydantic import Field

from app.schemas.menu import MenuPayload, StrictModel


class MenuImportStatus(str, Enum):
    queued = "queued"
    accepted = "accepted"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    timed_out = "timed_out"


class UploadedSource(StrictModel):
    name: str
    kind: str
    mimeType: str | None = None
    sizeBytes: int | None = None
    storageKey: str | None = None
    publicUrl: str | None = None


class MenuImportAcceptedResponse(StrictModel):
    jobId: str
    status: MenuImportStatus
    pollUrl: str
    createdAt: datetime


class MenuImportResult(StrictModel):
    menuId: str | None = None
    menu: MenuPayload
    sourceSummary: list[UploadedSource]
    categoryCount: int
    itemCount: int
    documentCount: int
    usedFallback: bool = False
    warnings: list[str] = Field(default_factory=list)


class MenuImportJobResponse(StrictModel):
    jobId: str
    status: MenuImportStatus
    createdAt: datetime
    updatedAt: datetime
    startedAt: datetime | None = None
    completedAt: datetime | None = None
    error: str | None = None
    result: MenuImportResult | None = None
