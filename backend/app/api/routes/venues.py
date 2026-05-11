from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import Menu, User, Venue
from app.schemas.venue_api import VenueCreateRequest, VenueResponse


router = APIRouter(prefix="/api/venues", tags=["venues"])


def serialize_venue(venue: Venue, *, menus_count: int = 0) -> VenueResponse:
    return VenueResponse(
        id=venue.id,
        name=venue.name,
        phone=venue.phone,
        country=venue.country,
        city=venue.city,
        description=venue.description,
        createdAt=venue.created_at,
        updatedAt=venue.updated_at,
        menusCount=menus_count,
    )


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
    db.commit()
    db.refresh(venue)
    return serialize_venue(venue)


@router.get("/{venue_id}", response_model=VenueResponse)
def get_venue(
    venue_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VenueResponse:
    venue = (
        db.query(Venue)
        .filter(Venue.id == venue_id, Venue.owner_user_id == current_user.id)
        .first()
    )
    if venue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")

    menus_count = db.query(Menu).filter(Menu.venue_id == venue.id).count()
    return serialize_venue(venue, menus_count=menus_count)
