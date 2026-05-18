from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.schemas.menu import StrictModel


class AnalyticsSeriesPointResponse(StrictModel):
    date: str
    label: str
    views: int
    uniqueVisitors: int


class VenueAnalyticsOverviewResponse(StrictModel):
    period: str
    totalViews: int
    uniqueVisitors: int
    viewChangePercent: int
    uniqueVisitorsChangePercent: int
    series: list[AnalyticsSeriesPointResponse]


class ProductEventCreateRequest(StrictModel):
    eventName: str = Field(min_length=2, max_length=96)
    eventVersion: int = Field(default=1, ge=1, le=100)
    source: str = Field(default="dashboard", max_length=32)
    venueId: str | None = Field(default=None, max_length=36)
    menuId: str | None = Field(default=None, max_length=36)
    page: str | None = None
    properties: dict = Field(default_factory=dict)


class ProductEventResponse(StrictModel):
    id: str
    eventName: str
    createdAt: datetime
