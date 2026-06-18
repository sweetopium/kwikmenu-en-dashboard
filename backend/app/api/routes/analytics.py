from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import Menu, PublicMenuEvent, User, Venue
from app.schemas.analytics_api import (
    AnalyticsSeriesPointResponse,
    ProductEventCreateRequest,
    ProductEventResponse,
    VenueAnalyticsOverviewResponse,
)
from app.services.product_analytics import record_product_event


router = APIRouter(prefix="/api/analytics", tags=["analytics"])

MOSCOW_TZ = ZoneInfo("Europe/Moscow")
VISITOR_COOKIE_NAME = "kwikmenu_vid"
EVENT_TYPE_VENUE_PUBLIC_VIEW = "venue_public_view"
PERIOD_CODES = {"today", "yesterday", "7d", "30d"}
WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def get_owned_venue_or_404(db: Session, *, venue_id: str, user_id: str) -> Venue:
    venue = (
        db.query(Venue)
        .filter(Venue.id == venue_id, Venue.owner_user_id == user_id)
        .first()
    )
    if venue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")
    return venue


def resolve_period(period: str) -> tuple[datetime, datetime, datetime, datetime]:
    now_local = datetime.now(MOSCOW_TZ)
    today_start = now_local.replace(hour=0, minute=0, second=0, microsecond=0)

    if period == "today":
        current_start_local = today_start
        current_end_local = now_local
    elif period == "yesterday":
        current_end_local = today_start
        current_start_local = current_end_local - timedelta(days=1)
    elif period == "30d":
        current_start_local = today_start - timedelta(days=29)
        current_end_local = now_local
    else:
        current_start_local = today_start - timedelta(days=6)
        current_end_local = now_local

    duration = current_end_local - current_start_local
    previous_end_local = current_start_local
    previous_start_local = previous_end_local - duration

    return (
        current_start_local.astimezone(timezone.utc),
        current_end_local.astimezone(timezone.utc),
        previous_start_local.astimezone(timezone.utc),
        previous_end_local.astimezone(timezone.utc),
    )


def compute_change_percent(current_value: int, previous_value: int) -> int:
    if previous_value <= 0:
        return 100 if current_value > 0 else 0
    return round(((current_value - previous_value) / previous_value) * 100)


def serialize_series(
    *,
    events: list[PublicMenuEvent],
    start_at: datetime,
    end_at: datetime,
) -> list[AnalyticsSeriesPointResponse]:
    current_date = start_at.astimezone(MOSCOW_TZ).date()
    end_date = end_at.astimezone(MOSCOW_TZ).date()

    views_by_day: dict[str, int] = defaultdict(int)
    unique_by_day: dict[str, set[str]] = defaultdict(set)

    for event in events:
        event_local_date = event.created_at.astimezone(MOSCOW_TZ).date().isoformat()
        views_by_day[event_local_date] += 1
        unique_by_day[event_local_date].add(event.visitor_id)

    series: list[AnalyticsSeriesPointResponse] = []
    while current_date <= end_date:
        iso_date = current_date.isoformat()
        series.append(
            AnalyticsSeriesPointResponse(
                date=iso_date,
                label=WEEKDAY_LABELS[current_date.weekday()],
                views=views_by_day.get(iso_date, 0),
                uniqueVisitors=len(unique_by_day.get(iso_date, set())),
            )
        )
        current_date += timedelta(days=1)

    return series


def build_analytics_overview(
    *,
    db: Session,
    venue_id: str,
    period: str,
) -> VenueAnalyticsOverviewResponse:
    current_start, current_end, previous_start, previous_end = resolve_period(period)

    current_events = (
        db.query(PublicMenuEvent)
        .filter(
            PublicMenuEvent.venue_id == venue_id,
            PublicMenuEvent.event_type == EVENT_TYPE_VENUE_PUBLIC_VIEW,
            PublicMenuEvent.created_at >= current_start,
            PublicMenuEvent.created_at < current_end,
        )
        .order_by(PublicMenuEvent.created_at.asc())
        .all()
    )
    previous_events = (
        db.query(PublicMenuEvent)
        .filter(
            PublicMenuEvent.venue_id == venue_id,
            PublicMenuEvent.event_type == EVENT_TYPE_VENUE_PUBLIC_VIEW,
            PublicMenuEvent.created_at >= previous_start,
            PublicMenuEvent.created_at < previous_end,
        )
        .all()
    )

    total_views = len(current_events)
    unique_visitors = len({event.visitor_id for event in current_events})
    previous_total_views = len(previous_events)
    previous_unique_visitors = len({event.visitor_id for event in previous_events})

    return VenueAnalyticsOverviewResponse(
        period=period,
        totalViews=total_views,
        uniqueVisitors=unique_visitors,
        viewChangePercent=compute_change_percent(total_views, previous_total_views),
        uniqueVisitorsChangePercent=compute_change_percent(unique_visitors, previous_unique_visitors),
        series=serialize_series(events=current_events, start_at=current_start, end_at=current_end),
    )


def record_public_menu_view(
    *,
    db: Session,
    request: Request,
    response: Response,
    venue_id: str,
) -> None:
    visitor_id = request.cookies.get(VISITOR_COOKIE_NAME)
    if not visitor_id:
        visitor_id = str(uuid4())
        response.set_cookie(
            key=VISITOR_COOKIE_NAME,
            value=visitor_id,
            httponly=False,
            secure=False,
            samesite="lax",
            max_age=60 * 60 * 24 * 365,
            path="/",
        )

    forwarded_for = request.headers.get("x-forwarded-for", "")
    ip_address = forwarded_for.split(",")[0].strip() if forwarded_for else None
    if not ip_address and request.client:
        ip_address = request.client.host

    active_menus = (
        db.query(Menu)
        .filter(Menu.venue_id == venue_id, Menu.status.in_(("active", "published")))
        .order_by(Menu.updated_at.desc())
        .all()
    )

    event = PublicMenuEvent(
        venue_id=venue_id,
        menu_id=active_menus[0].id if len(active_menus) == 1 else None,
        event_type=EVENT_TYPE_VENUE_PUBLIC_VIEW,
        visitor_id=visitor_id,
        ip_address=ip_address,
        user_agent=request.headers.get("user-agent"),
        referer=request.headers.get("referer"),
        accept_language=request.headers.get("accept-language"),
        request_path=request.url.path,
        query_string=request.url.query or None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()


@router.get("/venues/{venue_id}/overview", response_model=VenueAnalyticsOverviewResponse)
def get_venue_analytics_overview(
    venue_id: str,
    period: str = Query(default="7d"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VenueAnalyticsOverviewResponse:
    if period not in PERIOD_CODES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported analytics period.")

    get_owned_venue_or_404(db, venue_id=venue_id, user_id=current_user.id)
    return build_analytics_overview(db=db, venue_id=venue_id, period=period)


@router.post("/product-events", response_model=ProductEventResponse)
def create_product_event(
    payload: ProductEventCreateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProductEventResponse:
    if payload.venueId:
        get_owned_venue_or_404(db, venue_id=payload.venueId, user_id=current_user.id)
    if payload.menuId:
        menu = (
            db.query(Menu)
            .join(Venue, Venue.id == Menu.venue_id)
            .filter(Menu.id == payload.menuId, Venue.owner_user_id == current_user.id)
            .first()
        )
        if menu is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found.")
        if payload.venueId and menu.venue_id != payload.venueId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Menu does not belong to venue.")

    event = record_product_event(
        db,
        request=request,
        user=current_user,
        event_name=payload.eventName,
        source=payload.source,
        venue_id=payload.venueId,
        menu_id=payload.menuId,
        page=payload.page,
        properties=payload.properties,
        commit=True,
    )
    return ProductEventResponse(
        id=event.id,
        eventName=event.event_name,
        createdAt=event.created_at,
    )
