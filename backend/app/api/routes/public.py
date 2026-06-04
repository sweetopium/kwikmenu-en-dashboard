from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.routes.analytics import record_public_menu_view
from app.api.deps import get_db
from app.api.routes.venues import build_public_path, build_public_url, get_or_create_venue_settings
from app.models import Menu, Venue
from app.schemas.menu import MenuPayload
from app.schemas.public_api import (
    PublicBillingPlanResponse,
    PublicMenuResponse,
    PublicVenueDesignResponse,
    PublicVenueMenusResponse,
    PublicVenueQrResponse,
    PublicVenueResponse,
    PublicVenueWifiResponse,
)
from app.services.billing import build_public_plan_response, get_public_plans


router = APIRouter(prefix="/api/public", tags=["public"])

PUBLIC_MENU_STATUSES = {"active", "published"}


@router.options("/billing/plans", include_in_schema=False)
def options_public_billing_plans(response: Response) -> Response:
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "86400"
    return response


@router.get("/billing/plans", response_model=list[PublicBillingPlanResponse])
def get_public_billing_plans(
    response: Response,
    db: Session = Depends(get_db),
) -> list[PublicBillingPlanResponse]:
    response.headers["Access-Control-Allow-Origin"] = "*"
    plans = get_public_plans(db)
    active_public_plans = [plan for plan in plans if plan.is_active]
    return [build_public_plan_response(plan) for plan in active_public_plans]


@router.get("/m/{venue_id}", response_model=PublicVenueMenusResponse)
def get_public_venue_menus(
    venue_id: str,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> PublicVenueMenusResponse:
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if venue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")

    venue_settings = get_or_create_venue_settings(db, venue)
    if not venue_settings.public_menu_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Public menu not found.")

    menus = (
        db.query(Menu)
        .filter(Menu.venue_id == venue.id, Menu.status.in_(tuple(PUBLIC_MENU_STATUSES)))
        .order_by(Menu.updated_at.desc())
        .all()
    )

    record_public_menu_view(
        db=db,
        request=request,
        response=response,
        venue_id=venue.id,
    )

    return PublicVenueMenusResponse(
        venue=PublicVenueResponse(
            id=venue.id,
            name=venue.name,
            description=venue.description,
            phone=venue.phone,
            city=venue.city,
            country=venue.country,
            instagramUrl=venue.instagram_url,
            currency=venue_settings.currency,
            publicPath=build_public_path(venue),
            publicUrl=build_public_url(venue),
            design=PublicVenueDesignResponse(
                template=venue_settings.design_template,
                accentColor=venue_settings.design_accent_color,
                logoUrl=venue_settings.design_logo_url,
            ),
            wifi=PublicVenueWifiResponse(
                enabled=venue_settings.wifi_enabled,
                ssid=venue_settings.wifi_ssid,
                password=venue_settings.wifi_password,
            ),
            qr=PublicVenueQrResponse(
                style=venue_settings.qr_style,
                color=venue_settings.qr_color,
                logoUrl=venue_settings.qr_logo_url,
                hasFrame=venue_settings.qr_has_frame,
                frameText=venue_settings.qr_frame_text,
                frameColor=venue_settings.qr_frame_color,
                publicPath=build_public_path(venue),
                publicUrl=build_public_url(venue),
            ),
        ),
        menus=[
            PublicMenuResponse(
                id=menu.id,
                venueId=menu.venue_id,
                name=menu.name,
                slug=menu.slug,
                description=menu.description,
                status=menu.status,
                payload=MenuPayload.model_validate(menu.payload),
            )
            for menu in menus
        ],
    )
