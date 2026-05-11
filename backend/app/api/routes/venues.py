from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import get_settings
from app.models import Menu, User, Venue, VenueSettings
from app.schemas.venue_api import (
    VenueCreateRequest,
    VenueDesignSettingsResponse,
    VenueDesignSettingsUpdateRequest,
    VenueProfileUpdateRequest,
    VenueQrSettingsResponse,
    VenueQrSettingsUpdateRequest,
    VenueResponse,
    VenueSettingsResponse,
    VenueWifiSettingsResponse,
    VenueWifiSettingsUpdateRequest,
)


router = APIRouter(prefix="/api/venues", tags=["venues"])


def build_public_path(venue: Venue) -> str:
    return f"/m/{venue.id}"


def build_public_url(venue: Venue) -> str:
    settings = get_settings()
    base_url = (settings.public_menu_base_url or settings.menu_import_frontend_origin).rstrip("/")
    return f"{base_url}{build_public_path(venue)}"


def get_or_create_venue_settings(db: Session, venue: Venue) -> VenueSettings:
    if venue.settings is not None:
        return venue.settings

    venue_settings = VenueSettings(venue_id=venue.id)
    db.add(venue_settings)
    db.commit()
    db.refresh(venue_settings)
    db.refresh(venue)
    return venue_settings


def serialize_venue(venue: Venue, *, menus_count: int = 0) -> VenueResponse:
    settings = venue.settings
    return VenueResponse(
        id=venue.id,
        name=venue.name,
        phone=venue.phone,
        country=venue.country,
        city=venue.city,
        description=venue.description,
        currency=(settings.currency if settings else "RUB"),
        publicPath=build_public_path(venue),
        publicUrl=build_public_url(venue),
        createdAt=venue.created_at,
        updatedAt=venue.updated_at,
        menusCount=menus_count,
    )


def serialize_venue_settings(venue: Venue, venue_settings: VenueSettings) -> VenueSettingsResponse:
    return VenueSettingsResponse(
        id=venue_settings.id,
        venueId=venue.id,
        currency=venue_settings.currency,
        wifi=VenueWifiSettingsResponse(
            enabled=venue_settings.wifi_enabled,
            ssid=venue_settings.wifi_ssid,
            password=venue_settings.wifi_password,
        ),
        design=VenueDesignSettingsResponse(
            template=venue_settings.design_template,
            accentColor=venue_settings.design_accent_color,
            logoUrl=venue_settings.design_logo_url,
        ),
        qr=VenueQrSettingsResponse(
            style=venue_settings.qr_style,
            color=venue_settings.qr_color,
            logoUrl=venue_settings.qr_logo_url,
            hasFrame=venue_settings.qr_has_frame,
            frameText=venue_settings.qr_frame_text,
            frameColor=venue_settings.qr_frame_color,
            publicMenuEnabled=venue_settings.public_menu_enabled,
            publicPath=build_public_path(venue),
            publicUrl=build_public_url(venue),
        ),
        createdAt=venue_settings.created_at,
        updatedAt=venue_settings.updated_at,
    )


def get_user_venue_or_404(db: Session, current_user: User, venue_id: str) -> Venue:
    venue = (
        db.query(Venue)
        .filter(Venue.id == venue_id, Venue.owner_user_id == current_user.id)
        .first()
    )
    if venue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")
    return venue


@router.get("", response_model=list[VenueResponse])
def list_venues(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[VenueResponse]:
    venues = (
        db.query(Venue)
        .filter(Venue.owner_user_id == current_user.id)
        .order_by(Venue.created_at.asc())
        .all()
    )
    return [
        serialize_venue(
            venue,
            menus_count=db.query(Menu).filter(Menu.venue_id == venue.id).count(),
        )
        for venue in venues
    ]


@router.post("", response_model=VenueResponse, status_code=status.HTTP_201_CREATED)
def create_venue(
    payload: VenueCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VenueResponse:
    venue = Venue(
        owner_user_id=current_user.id,
        name=payload.name.strip(),
        phone=payload.phone.strip() if payload.phone else None,
        country=payload.country.strip() if payload.country else None,
        city=payload.city.strip() if payload.city else None,
        description=payload.description.strip() if payload.description else None,
    )
    db.add(venue)
    db.flush()

    venue_settings = VenueSettings(
        venue_id=venue.id,
        currency=(payload.currency or "RUB").strip().upper(),
    )
    db.add(venue_settings)
    db.commit()
    db.refresh(venue)
    return serialize_venue(venue)


@router.get("/{venue_id}", response_model=VenueResponse)
def get_venue(
    venue_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VenueResponse:
    venue = get_user_venue_or_404(db, current_user, venue_id)
    get_or_create_venue_settings(db, venue)
    menus_count = db.query(Menu).filter(Menu.venue_id == venue.id).count()
    db.refresh(venue)
    return serialize_venue(venue, menus_count=menus_count)


@router.patch("/{venue_id}/profile", response_model=VenueResponse)
def update_venue_profile(
    venue_id: str,
    payload: VenueProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VenueResponse:
    venue = get_user_venue_or_404(db, current_user, venue_id)
    venue_settings = get_or_create_venue_settings(db, venue)

    venue.name = payload.name.strip()
    venue.phone = payload.phone.strip() if payload.phone else None
    venue.country = payload.country.strip() if payload.country else None
    venue.city = payload.city.strip() if payload.city else None
    venue.description = payload.description.strip() if payload.description else None
    venue_settings.currency = (payload.currency or "RUB").strip().upper()

    db.commit()
    db.refresh(venue)
    return serialize_venue(venue, menus_count=db.query(Menu).filter(Menu.venue_id == venue.id).count())


@router.get("/{venue_id}/settings", response_model=VenueSettingsResponse)
def get_venue_settings(
    venue_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VenueSettingsResponse:
    venue = get_user_venue_or_404(db, current_user, venue_id)
    venue_settings = get_or_create_venue_settings(db, venue)
    db.refresh(venue)
    return serialize_venue_settings(venue, venue_settings)


@router.patch("/{venue_id}/wifi", response_model=VenueSettingsResponse)
def update_venue_wifi_settings(
    venue_id: str,
    payload: VenueWifiSettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VenueSettingsResponse:
    venue = get_user_venue_or_404(db, current_user, venue_id)
    venue_settings = get_or_create_venue_settings(db, venue)

    venue_settings.wifi_enabled = payload.enabled
    venue_settings.wifi_ssid = payload.ssid.strip() if payload.ssid else None
    venue_settings.wifi_password = payload.password.strip() if payload.password else None

    db.commit()
    db.refresh(venue_settings)
    db.refresh(venue)
    return serialize_venue_settings(venue, venue_settings)


@router.patch("/{venue_id}/design", response_model=VenueSettingsResponse)
def update_venue_design_settings(
    venue_id: str,
    payload: VenueDesignSettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VenueSettingsResponse:
    venue = get_user_venue_or_404(db, current_user, venue_id)
    venue_settings = get_or_create_venue_settings(db, venue)

    venue_settings.design_template = payload.template.strip()
    venue_settings.design_accent_color = payload.accentColor.strip()
    venue_settings.design_logo_url = payload.logoUrl.strip() if payload.logoUrl else None

    db.commit()
    db.refresh(venue_settings)
    db.refresh(venue)
    return serialize_venue_settings(venue, venue_settings)


@router.patch("/{venue_id}/qr", response_model=VenueSettingsResponse)
def update_venue_qr_settings(
    venue_id: str,
    payload: VenueQrSettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VenueSettingsResponse:
    venue = get_user_venue_or_404(db, current_user, venue_id)
    venue_settings = get_or_create_venue_settings(db, venue)

    venue_settings.qr_style = payload.style.strip()
    venue_settings.qr_color = payload.color.strip()
    venue_settings.qr_logo_url = payload.logoUrl.strip() if payload.logoUrl else None
    venue_settings.qr_has_frame = payload.hasFrame
    venue_settings.qr_frame_text = payload.frameText.strip()
    venue_settings.qr_frame_color = payload.frameColor.strip()
    venue_settings.public_menu_enabled = payload.publicMenuEnabled

    db.commit()
    db.refresh(venue_settings)
    db.refresh(venue)
    return serialize_venue_settings(venue, venue_settings)
