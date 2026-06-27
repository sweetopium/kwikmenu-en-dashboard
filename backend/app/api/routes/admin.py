from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from pydantic import Field
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import get_settings
from app.models import (
    AuthAccount,
    HelpRequest,
    Menu,
    MenuImportJob,
    ProductEvent,
    PublicMenuEvent,
    SessionModel,
    SubscriptionPlan,
    User,
    Venue,
    VenueSettings,
)
from app.schemas.menu import MenuPayload, StrictModel


router = APIRouter(prefix="/api/admin", tags=["admin"])

PERIOD_DAYS = {
    "24h": 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
}


class AdminBulkDeleteUsersRequest(StrictModel):
    userIds: list[str] = Field(min_length=1, max_length=100)


class AdminMenuUpdateRequest(StrictModel):
    payload: MenuPayload
    status: str | None = Field(default=None, max_length=32)


class AdminVenueCreateRequest(StrictModel):
    name: str = Field(..., max_length=255)
    ownerUserId: str = Field(..., max_length=36)
    city: str | None = Field(default=None, max_length=128)
    country: str | None = Field(default=None, max_length=64)
    phone: str | None = Field(default=None, max_length=64)
    description: str | None = Field(default=None)
    currency: str = Field(default="RUB", max_length=8)


class AdminMenuCreateRequest(StrictModel):
    name: str = Field(..., max_length=255)
    venueId: str = Field(..., max_length=36)
    status: str = Field(default="draft", max_length=32)


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _parse_csv(value: str | None) -> set[str]:
    return {item.strip() for item in (value or "").split(",") if item.strip()}


def require_admin_access(
    request: Request,
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
) -> None:
    settings = get_settings()
    allowed_ips = _parse_csv(settings.admin_allowed_ips)
    client_ip = _client_ip(request)
    if "*" not in allowed_ips and client_ip not in allowed_ips:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin IP is not allowed.")

    if not settings.admin_api_key:
        if settings.app_env == "development":
            return
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Admin key is not configured.")

    if not x_admin_key or not secrets.compare_digest(x_admin_key, settings.admin_api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin key.")


AdminAccess = Depends(require_admin_access)


def _since(period: str) -> datetime:
    days = PERIOD_DAYS.get(period, 7)
    return datetime.now(timezone.utc) - timedelta(days=days)


def _day_key(value: datetime | None) -> str:
    if value is None:
        return "unknown"
    return value.astimezone(timezone.utc).date().isoformat()


def _public_path(venue_id: str) -> str:
    return f"/m/{venue_id}"


def _menu_counts(menu: Menu) -> tuple[int, int]:
    categories = (menu.payload or {}).get("categories") or []
    items_count = 0
    for category in categories:
        if isinstance(category, dict):
            items_count += len(category.get("items") or [])
    return len(categories), items_count


def _serialize_admin_menu(menu: Menu, venue: Venue, user: User) -> dict:
    categories_count, items_count = _menu_counts(menu)
    return {
        "id": menu.id,
        "venueId": venue.id,
        "venueName": venue.name,
        "owner": {"id": user.id, "email": user.email, "name": user.name},
        "name": menu.name,
        "slug": menu.slug,
        "description": menu.description,
        "status": menu.status,
        "payload": MenuPayload.model_validate(menu.payload).model_dump(mode="json"),
        "categoriesCount": categories_count,
        "itemsCount": items_count,
        "createdAt": menu.created_at,
        "updatedAt": menu.updated_at,
    }


def _delete_users(db: Session, user_ids: list[str]) -> dict:
    unique_user_ids = list(dict.fromkeys(user_ids))
    users = db.query(User).filter(User.id.in_(unique_user_ids)).all()
    found_ids = [user.id for user in users]
    if not found_ids:
        return {"requested": len(unique_user_ids), "deleted": 0, "missing": unique_user_ids}

    venue_ids = [venue_id for (venue_id,) in db.query(Venue.id).filter(Venue.owner_user_id.in_(found_ids)).all()]
    menu_ids = [menu_id for (menu_id,) in db.query(Menu.id).filter(Menu.venue_id.in_(venue_ids)).all()] if venue_ids else []

    if menu_ids:
        db.query(ProductEvent).filter(ProductEvent.menu_id.in_(menu_ids)).update({ProductEvent.menu_id: None}, synchronize_session=False)
        db.query(PublicMenuEvent).filter(PublicMenuEvent.menu_id.in_(menu_ids)).update({PublicMenuEvent.menu_id: None}, synchronize_session=False)
        db.query(MenuImportJob).filter(MenuImportJob.menu_id.in_(menu_ids)).update({MenuImportJob.menu_id: None}, synchronize_session=False)

    if venue_ids:
        db.query(ProductEvent).filter(ProductEvent.venue_id.in_(venue_ids)).update({ProductEvent.venue_id: None}, synchronize_session=False)
        db.query(MenuImportJob).filter(MenuImportJob.venue_id.in_(venue_ids)).update({MenuImportJob.venue_id: None}, synchronize_session=False)
        db.query(PublicMenuEvent).filter(PublicMenuEvent.venue_id.in_(venue_ids)).delete(synchronize_session=False)

    db.query(ProductEvent).filter(ProductEvent.user_id.in_(found_ids)).update({ProductEvent.user_id: None}, synchronize_session=False)
    db.query(SessionModel).filter(SessionModel.user_id.in_(found_ids)).delete(synchronize_session=False)
    db.query(AuthAccount).filter(AuthAccount.user_id.in_(found_ids)).delete(synchronize_session=False)
    db.query(User).filter(User.id.in_(found_ids)).delete(synchronize_session=False)
    db.commit()

    return {
        "requested": len(unique_user_ids),
        "deleted": len(found_ids),
        "missing": [user_id for user_id in unique_user_ids if user_id not in set(found_ids)],
    }


@router.get("/overview")
def get_admin_overview(
    period: str = Query(default="7d", pattern="^(24h|7d|30d|90d)$"),
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    since = _since(period)
    previous_since = since - (datetime.now(timezone.utc) - since)

    users_total = db.query(User).count()
    venues_total = db.query(Venue).count()
    menus_total = db.query(Menu).count()
    active_menus_total = db.query(Menu).filter(Menu.status.in_(("active", "published"))).count()
    imports_total = db.query(MenuImportJob).count()
    help_requests_total = db.query(HelpRequest).count()
    public_views_total = db.query(PublicMenuEvent).count()
    product_events_total = db.query(ProductEvent).count()

    period_public_events = db.query(PublicMenuEvent).filter(PublicMenuEvent.created_at >= since).all()
    previous_public_events = (
        db.query(PublicMenuEvent)
        .filter(PublicMenuEvent.created_at >= previous_since, PublicMenuEvent.created_at < since)
        .all()
    )
    product_events = db.query(ProductEvent).filter(ProductEvent.created_at >= since).all()
    imports = db.query(MenuImportJob).filter(MenuImportJob.created_at >= since).all()
    help_requests = db.query(HelpRequest).filter(HelpRequest.created_at >= since).all()

    views_by_day: dict[str, int] = defaultdict(int)
    visitors_by_day: dict[str, set[str]] = defaultdict(set)
    for event in period_public_events:
        key = _day_key(event.created_at)
        views_by_day[key] += 1
        visitors_by_day[key].add(event.visitor_id)

    top_venues_rows = (
        db.query(Venue.id, Venue.name, func.count(PublicMenuEvent.id).label("views"))
        .join(PublicMenuEvent, PublicMenuEvent.venue_id == Venue.id)
        .filter(PublicMenuEvent.created_at >= since)
        .group_by(Venue.id, Venue.name)
        .order_by(func.count(PublicMenuEvent.id).desc())
        .limit(8)
        .all()
    )

    return {
        "period": period,
        "totals": {
            "users": users_total,
            "venues": venues_total,
            "menus": menus_total,
            "activeMenus": active_menus_total,
            "imports": imports_total,
            "helpRequests": help_requests_total,
            "publicViews": public_views_total,
            "productEvents": product_events_total,
        },
        "periodTotals": {
            "newUsers": db.query(User).filter(User.created_at >= since).count(),
            "newVenues": db.query(Venue).filter(Venue.created_at >= since).count(),
            "publicViews": len(period_public_events),
            "uniqueVisitors": len({event.visitor_id for event in period_public_events}),
            "previousPublicViews": len(previous_public_events),
            "imports": len(imports),
            "failedImports": len([job for job in imports if job.status == "failed"]),
            "helpRequests": len(help_requests),
            "telegramFailures": len([request for request in help_requests if not request.telegram_delivered]),
            "productEvents": len(product_events),
        },
        "series": [
            {
                "date": date,
                "views": views_by_day[date],
                "uniqueVisitors": len(visitors_by_day[date]),
            }
            for date in sorted(views_by_day)
        ],
        "importStatus": Counter(job.status for job in imports),
        "productEvents": Counter(event.event_name for event in product_events).most_common(12),
        "topVenues": [
            {"id": row.id, "name": row.name, "views": row.views, "publicPath": _public_path(row.id)}
            for row in top_venues_rows
        ],
    }


@router.get("/users")
def list_admin_users(
    q: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(User)
    if q:
        pattern = f"%{q.strip()}%"
        query = query.filter((User.email.ilike(pattern)) | (User.name.ilike(pattern)) | (User.phone.ilike(pattern)))

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    user_ids = [user.id for user in users]
    venues_by_user = dict(
        db.query(Venue.owner_user_id, func.count(Venue.id)).filter(Venue.owner_user_id.in_(user_ids)).group_by(Venue.owner_user_id).all()
    ) if user_ids else {}
    sessions_by_user = dict(
        db.query(SessionModel.user_id, func.max(SessionModel.last_seen_at)).filter(SessionModel.user_id.in_(user_ids)).group_by(SessionModel.user_id).all()
    ) if user_ids else {}
    providers_by_user: dict[str, set[str]] = defaultdict(set)
    if user_ids:
        for account in db.query(AuthAccount).filter(AuthAccount.user_id.in_(user_ids)).all():
            providers_by_user[account.user_id].add(account.provider)

    return {
        "total": total,
        "items": [
            {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "phone": user.phone,
                "isActive": user.is_active,
                "venuesCount": venues_by_user.get(user.id, 0),
                "authProviders": sorted(providers_by_user.get(user.id, set()) | ({"password"} if user.password_hash else set())),
                "lastSeenAt": sessions_by_user.get(user.id),
                "createdAt": user.created_at,
            }
            for user in users
        ],
    }


class AdminUserSubscriptionUpdateRequest(StrictModel):
    planId: str = Field(min_length=1, max_length=64)
    status: str = Field(min_length=1, max_length=32)
    currentPeriodEnd: datetime | None = None
    trialEndsAt: datetime | None = None


@router.get("/users/{user_id}")
def get_admin_user_detail(
    user_id: str,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    from app.services.billing import ensure_default_subscription
    subscription = ensure_default_subscription(db, user)

    venues = db.query(Venue).filter(Venue.owner_user_id == user.id).order_by(Venue.created_at.desc()).all()
    events = db.query(ProductEvent).filter(ProductEvent.user_id == user.id).order_by(ProductEvent.created_at.desc()).limit(50).all()
    imports = db.query(MenuImportJob).filter(MenuImportJob.user_id == user.id).order_by(MenuImportJob.created_at.desc()).limit(20).all()

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
            "isActive": user.is_active,
            "createdAt": user.created_at,
            "updatedAt": user.updated_at,
            "subscription": {
                "id": subscription.id,
                "status": subscription.status,
                "planId": subscription.plan_id,
                "planCode": subscription.plan.code,
                "planName": subscription.plan.name,
                "currentPeriodStart": subscription.current_period_start,
                "currentPeriodEnd": subscription.current_period_end,
                "trialEndsAt": subscription.trial_ends_at,
            } if subscription else None
        },
        "venues": [
            {"id": venue.id, "name": venue.name, "city": venue.city, "country": venue.country, "createdAt": venue.created_at}
            for venue in venues
        ],
        "imports": [
            {"id": job.id, "status": job.status, "menuSource": job.menu_source, "error": job.error, "createdAt": job.created_at}
            for job in imports
        ],
        "events": [
            {"id": event.id, "eventName": event.event_name, "page": event.page, "createdAt": event.created_at}
            for event in events
        ],
    }


@router.post("/users/{user_id}/subscription")
def update_admin_user_subscription(
    user_id: str,
    payload: AdminUserSubscriptionUpdateRequest,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    from app.services.billing import ensure_default_subscription
    subscription = ensure_default_subscription(db, user)

    # Validate that the plan exists
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == payload.planId).first()
    if plan is None:
        raise HTTPException(status_code=400, detail="Subscription plan not found.")

    subscription.plan_id = plan.id
    subscription.status = payload.status
    subscription.current_period_end = payload.currentPeriodEnd
    subscription.trial_ends_at = payload.trialEndsAt
    
    if payload.status == "active" and not subscription.current_period_start:
        subscription.current_period_start = datetime.now(timezone.utc)

    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    return {
        "id": subscription.id,
        "status": subscription.status,
        "planId": subscription.plan_id,
        "planCode": subscription.plan.code,
        "planName": subscription.plan.name,
        "currentPeriodStart": subscription.current_period_start,
        "currentPeriodEnd": subscription.current_period_end,
        "trialEndsAt": subscription.trial_ends_at,
    }


@router.delete("/users/{user_id}")
def delete_admin_user(
    user_id: str,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    return _delete_users(db, [user_id])


@router.post("/users/bulk-delete")
def bulk_delete_admin_users(
    payload: AdminBulkDeleteUsersRequest,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    return _delete_users(db, payload.userIds)


@router.get("/venues")
def list_admin_venues(
    q: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(Venue, User).join(User, User.id == Venue.owner_user_id)
    if q:
        pattern = f"%{q.strip()}%"
        query = query.filter((Venue.name.ilike(pattern)) | (Venue.city.ilike(pattern)) | (User.email.ilike(pattern)))

    total = query.count()
    rows = query.order_by(Venue.created_at.desc()).offset(offset).limit(limit).all()
    venue_ids = [venue.id for venue, _user in rows]
    menu_counts = dict(db.query(Menu.venue_id, func.count(Menu.id)).filter(Menu.venue_id.in_(venue_ids)).group_by(Menu.venue_id).all()) if venue_ids else {}
    view_counts = dict(db.query(PublicMenuEvent.venue_id, func.count(PublicMenuEvent.id)).filter(PublicMenuEvent.venue_id.in_(venue_ids)).group_by(PublicMenuEvent.venue_id).all()) if venue_ids else {}

    return {
        "total": total,
        "items": [
            {
                "id": venue.id,
                "name": venue.name,
                "city": venue.city,
                "country": venue.country,
                "phone": venue.phone,
                "owner": {"id": user.id, "email": user.email, "name": user.name},
                "menusCount": menu_counts.get(venue.id, 0),
                "publicViews": view_counts.get(venue.id, 0),
                "publicPath": _public_path(venue.id),
                "createdAt": venue.created_at,
            }
            for venue, user in rows
        ],
    }


@router.post("/venues", status_code=status.HTTP_201_CREATED)
def create_admin_venue(
    payload: AdminVenueCreateRequest,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    owner = db.query(User).filter(User.id == payload.ownerUserId).first()
    if not owner:
        raise HTTPException(status_code=400, detail="Владелец не найден.")

    venue_id = None
    is_virtual = owner.email.endswith("@virtual.kwikmenu.ru")
    if is_virtual:
        existing_venues_count = db.query(Venue).filter(Venue.owner_user_id == owner.id).count()
        if existing_venues_count == 0:
            venue_id = owner.id

    venue_kwargs = {
        "owner_user_id": payload.ownerUserId,
        "name": payload.name.strip(),
        "phone": payload.phone.strip() if payload.phone else None,
        "country": payload.country.strip() if payload.country else None,
        "city": payload.city.strip() if payload.city else None,
        "description": payload.description.strip() if payload.description else None,
    }
    if venue_id:
        venue_kwargs["id"] = venue_id

    venue = Venue(**venue_kwargs)
    db.add(venue)
    db.flush()

    settings = VenueSettings(
        venue_id=venue.id,
        currency=payload.currency.strip().upper(),
    )
    db.add(settings)
    db.commit()
    db.refresh(venue)

    return {
        "id": venue.id,
        "name": venue.name,
        "ownerId": venue.owner_user_id,
        "city": venue.city,
        "country": venue.country,
        "createdAt": venue.created_at,
    }



@router.get("/venues/{venue_id}")
def get_admin_venue_detail(
    venue_id: str,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    row = db.query(Venue, User).join(User, User.id == Venue.owner_user_id).filter(Venue.id == venue_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Venue not found.")
    venue, user = row
    settings = db.query(VenueSettings).filter(VenueSettings.venue_id == venue.id).first()
    menus = db.query(Menu).filter(Menu.venue_id == venue.id).order_by(Menu.updated_at.desc()).all()
    imports = db.query(MenuImportJob).filter(MenuImportJob.venue_id == venue.id).order_by(MenuImportJob.created_at.desc()).limit(20).all()
    views = db.query(PublicMenuEvent).filter(PublicMenuEvent.venue_id == venue.id).count()

    return {
        "venue": {
            "id": venue.id,
            "name": venue.name,
            "phone": venue.phone,
            "country": venue.country,
            "city": venue.city,
            "description": venue.description,
            "publicPath": _public_path(venue.id),
            "publicViews": views,
            "createdAt": venue.created_at,
            "updatedAt": venue.updated_at,
        },
        "owner": {"id": user.id, "email": user.email, "name": user.name},
        "settings": {
            "currency": settings.currency if settings else "RUB",
            "publicMenuEnabled": settings.public_menu_enabled if settings else True,
            "designTemplate": settings.design_template if settings else "classic",
            "qrStyle": settings.qr_style if settings else "rounded",
        },
        "menus": [
            {
                "id": menu.id,
                "name": menu.name,
                "status": menu.status,
                "categoriesCount": _menu_counts(menu)[0],
                "itemsCount": _menu_counts(menu)[1],
                "updatedAt": menu.updated_at,
            }
            for menu in menus
        ],
        "imports": [
            {"id": job.id, "status": job.status, "menuSource": job.menu_source, "error": job.error, "createdAt": job.created_at}
            for job in imports
        ],
    }


@router.get("/menus")
def list_admin_menus(
    q: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(Menu, Venue, User).join(Venue, Venue.id == Menu.venue_id).join(User, User.id == Venue.owner_user_id)
    if q:
        pattern = f"%{q.strip()}%"
        query = query.filter((Menu.name.ilike(pattern)) | (Venue.name.ilike(pattern)) | (User.email.ilike(pattern)))
    total = query.count()
    rows = query.order_by(Menu.updated_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": menu.id,
                "name": menu.name,
                "status": menu.status,
                "venue": {"id": venue.id, "name": venue.name},
                "owner": {"id": user.id, "email": user.email},
                "categoriesCount": _menu_counts(menu)[0],
                "itemsCount": _menu_counts(menu)[1],
                "createdAt": menu.created_at,
                "updatedAt": menu.updated_at,
            }
            for menu, venue, user in rows
        ],
    }


@router.post("/menus", status_code=status.HTTP_201_CREATED)
def create_admin_menu(
    payload: AdminMenuCreateRequest,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    venue = db.query(Venue).filter(Venue.id == payload.venueId).first()
    if not venue:
        raise HTTPException(status_code=400, detail="Заведение не найдено.")

    menu_payload = {
        "menuMeta": {
            "id": "menu",
            "slug": "menu",
            "name": payload.name.strip(),
            "description": "",
            "translations": {}
        },
        "venue": {
            "name": venue.name,
            "description": venue.description or "",
            "logoUrl": None,
            "coverImageUrl": None
        },
        "categories": [],
        "languages": [
            {"code": "ru", "shortLabel": "RU", "nativeName": "Русский", "flag": "RU"}
        ],
        "settings": {
            "templateType": "classic",
            "accentColor": "#6d67eb"
        }
    }

    from app.core.slugs import slugify
    menu = Menu(
        venue_id=payload.venueId,
        name=payload.name.strip(),
        slug=slugify(payload.name.strip(), fallback="menu"),
        status=payload.status,
        payload=menu_payload,
    )
    db.add(menu)
    db.commit()
    db.refresh(menu)

    return {
        "id": menu.id,
        "name": menu.name,
        "status": menu.status,
        "venueId": menu.venue_id,
        "createdAt": menu.created_at,
    }



@router.get("/menus/{menu_id}")
def get_admin_menu(
    menu_id: str,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    row = (
        db.query(Menu, Venue, User)
        .join(Venue, Venue.id == Menu.venue_id)
        .join(User, User.id == Venue.owner_user_id)
        .filter(Menu.id == menu_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Menu not found.")
    menu, venue, user = row
    return _serialize_admin_menu(menu, venue, user)


@router.patch("/menus/{menu_id}")
def update_admin_menu(
    menu_id: str,
    payload: AdminMenuUpdateRequest,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    row = (
        db.query(Menu, Venue, User)
        .join(Venue, Venue.id == Menu.venue_id)
        .join(User, User.id == Venue.owner_user_id)
        .filter(Menu.id == menu_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Menu not found.")

    menu, venue, user = row
    menu_payload = MenuPayload.model_validate(payload.payload.model_dump())
    menu.name = menu_payload.menuMeta.name
    menu.slug = menu_payload.menuMeta.slug or menu.slug
    menu.description = menu_payload.menuMeta.description
    menu.payload = menu_payload.model_dump(mode="json")
    if payload.status:
        menu.status = payload.status

    db.add(menu)
    db.commit()
    db.refresh(menu)
    return _serialize_admin_menu(menu, venue, user)


@router.get("/imports")
def list_admin_imports(
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(MenuImportJob, User, Venue).join(User, User.id == MenuImportJob.user_id).outerjoin(Venue, Venue.id == MenuImportJob.venue_id)
    if status_filter:
        query = query.filter(MenuImportJob.status == status_filter)
    total = query.count()
    rows = query.order_by(MenuImportJob.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": job.id,
                "status": job.status,
                "menuSource": job.menu_source,
                "usedFallback": job.used_fallback,
                "categoryCount": job.category_count,
                "itemCount": job.item_count,
                "documentCount": job.document_count,
                "error": job.error,
                "warningsCount": len(job.warnings or []),
                "sources": [
                    {
                        "id": source.id,
                        "name": source.name,
                        "kind": source.kind,
                        "mimeType": source.mime_type,
                        "sizeBytes": source.size_bytes,
                        "storageKey": source.storage_key,
                        "publicUrl": source.public_url,
                    }
                    for source in job.sources
                ],
                "user": {"id": user.id, "email": user.email, "name": user.name},
                "venue": {"id": venue.id, "name": venue.name} if venue else None,
                "startedAt": job.started_at,
                "completedAt": job.completed_at,
                "createdAt": job.created_at,
            }
            for job, user, venue in rows
        ],
    }


@router.get("/help-requests")
def list_admin_help_requests(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(HelpRequest)
    total = query.count()
    items = query.order_by(HelpRequest.created_at.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "id": item.id,
                "name": item.name,
                "phone": item.phone,
                "messenger": item.messenger,
                "countryName": item.country_name,
                "city": item.city,
                "restaurantName": item.restaurant_name,
                "uploadLater": item.upload_later,
                "menuSource": item.menu_source,
                "menuLink": item.menu_link,
                "menuFileName": item.menu_file_name,
                "telegramDelivered": item.telegram_delivered,
                "telegramError": item.telegram_error,
                "createdAt": item.created_at,
            }
            for item in items
        ],
    }


@router.get("/analytics/public-menu")
def get_admin_public_menu_analytics(
    period: str = Query(default="7d", pattern="^(24h|7d|30d|90d)$"),
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    since = _since(period)
    events = db.query(PublicMenuEvent).filter(PublicMenuEvent.created_at >= since).order_by(PublicMenuEvent.created_at.asc()).all()
    by_day: dict[str, list[PublicMenuEvent]] = defaultdict(list)
    referers = Counter()
    languages = Counter()
    for event in events:
        by_day[_day_key(event.created_at)].append(event)
        if event.referer:
            referers[event.referer] += 1
        if event.accept_language:
            languages[event.accept_language.split(",")[0]] += 1

    return {
        "period": period,
        "totalViews": len(events),
        "uniqueVisitors": len({event.visitor_id for event in events}),
        "series": [
            {"date": date, "views": len(items), "uniqueVisitors": len({event.visitor_id for event in items})}
            for date, items in sorted(by_day.items())
        ],
        "topReferers": referers.most_common(20),
        "topLanguages": languages.most_common(20),
    }


@router.get("/analytics/product-events")
def get_admin_product_event_analytics(
    period: str = Query(default="7d", pattern="^(24h|7d|30d|90d)$"),
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    since = _since(period)
    events = db.query(ProductEvent).filter(ProductEvent.created_at >= since).order_by(ProductEvent.created_at.desc()).limit(500).all()
    event_counts = Counter(event.event_name for event in events)
    source_counts = Counter(event.source for event in events)
    by_day: dict[str, int] = defaultdict(int)
    for event in events:
        by_day[_day_key(event.created_at)] += 1

    return {
        "period": period,
        "totalEvents": len(events),
        "eventCounts": event_counts.most_common(50),
        "sourceCounts": source_counts.most_common(20),
        "series": [{"date": date, "events": count} for date, count in sorted(by_day.items())],
        "items": [
            {
                "id": event.id,
                "eventName": event.event_name,
                "source": event.source,
                "page": event.page,
                "userId": event.user_id,
                "venueId": event.venue_id,
                "menuId": event.menu_id,
                "createdAt": event.created_at,
            }
            for event in events[:100]
        ],
    }


@router.get("/system/health")
def get_admin_system_health(
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    settings = get_settings()
    db.execute(text("SELECT 1"))
    failed_imports = db.query(MenuImportJob).filter(MenuImportJob.status == "failed").count()
    telegram_failures = db.query(HelpRequest).filter(HelpRequest.telegram_delivered.is_(False)).count()
    return {
        "status": "ok",
        "appName": settings.app_name,
        "appEnv": settings.app_env,
        "adminKeyConfigured": bool(settings.admin_api_key),
        "adminAllowedIps": settings.admin_allowed_ips,
        "failedImports": failed_imports,
        "telegramFailures": telegram_failures,
        "checkedAt": datetime.now(timezone.utc),
    }
