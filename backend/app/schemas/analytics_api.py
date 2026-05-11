from __future__ import annotations

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
