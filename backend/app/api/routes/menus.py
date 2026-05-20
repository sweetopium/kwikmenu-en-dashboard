from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.slugs import slugify
from app.models import Menu, User, Venue
from app.schemas.menu import MenuPayload
from app.schemas.menu_api import MenuListItemResponse, MenuResponse, MenuUpdateRequest
from app.services.billing import assert_menu_within_plan_limits, get_effective_subscription
from app.services.product_analytics import record_product_event


router = APIRouter(prefix="/api/menus", tags=["menus"])


def serialize_menu(menu: Menu) -> MenuResponse:
    payload = MenuPayload.model_validate(menu.payload)
    return MenuResponse(
        id=menu.id,
        venueId=menu.venue_id,
        name=menu.name,
        slug=menu.slug,
        description=menu.description,
        status=menu.status,
        payload=payload,
        createdAt=menu.created_at,
        updatedAt=menu.updated_at,
    )


def get_owned_menu(db: Session, *, menu_id: str, user_id: str) -> Menu | None:
    return (
        db.query(Menu)
        .join(Venue, Venue.id == Menu.venue_id)
        .filter(Menu.id == menu_id, Venue.owner_user_id == user_id)
        .first()
    )


@router.get("", response_model=list[MenuListItemResponse])
def list_menus(
    venue_id: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MenuListItemResponse]:
    query = db.query(Menu).join(Venue, Venue.id == Menu.venue_id).filter(Venue.owner_user_id == current_user.id)
    if venue_id:
        query = query.filter(Menu.venue_id == venue_id)

    menus = query.order_by(Menu.updated_at.desc()).all()
    items: list[MenuListItemResponse] = []
    for menu in menus:
        payload = MenuPayload.model_validate(menu.payload)
        categories_count = len(payload.categories)
        items_count = sum(len(category.items) for category in payload.categories)
        items.append(
            MenuListItemResponse(
                id=menu.id,
                venueId=menu.venue_id,
                name=menu.name,
                description=menu.description,
                status=menu.status,
                categoriesCount=categories_count,
                itemsCount=items_count,
                updatedAt=menu.updated_at,
            )
        )
    return items


@router.get("/{menu_id}", response_model=MenuResponse)
def get_menu(
    menu_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MenuResponse:
    menu = get_owned_menu(db, menu_id=menu_id, user_id=current_user.id)
    if menu is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found.")
    return serialize_menu(menu)


@router.patch("/{menu_id}", response_model=MenuResponse)
def update_menu(
    menu_id: str,
    payload: MenuUpdateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MenuResponse:
    menu = get_owned_menu(db, menu_id=menu_id, user_id=current_user.id)
    if menu is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found.")

    menu_payload = MenuPayload.model_validate(payload.payload.model_dump())
    subscription = get_effective_subscription(db, current_user)
    assert_menu_within_plan_limits(subscription, menu_payload)
    menu.name = menu_payload.menuMeta.name
    menu.slug = slugify(menu_payload.menuMeta.slug or menu_payload.menuMeta.name, fallback=menu.id)
    menu.description = menu_payload.menuMeta.description
    menu.payload = menu_payload.model_dump(mode="json")
    if payload.status:
        menu.status = payload.status
    record_product_event(
        db,
        request=request,
        user=current_user,
        event_name="menu_saved",
        source="backend",
        venue_id=menu.venue_id,
        menu_id=menu.id,
        properties={
            "status": menu.status,
            "categories_count": len(menu_payload.categories),
            "items_count": sum(len(category.items) for category in menu_payload.categories),
        },
    )
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return serialize_menu(menu)


@router.post("/{menu_id}/publish", response_model=MenuResponse)
def publish_menu(
    menu_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MenuResponse:
    menu = get_owned_menu(db, menu_id=menu_id, user_id=current_user.id)
    if menu is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found.")

    menu.status = "active"
    record_product_event(
        db,
        request=request,
        user=current_user,
        event_name="menu_published",
        source="backend",
        venue_id=menu.venue_id,
        menu_id=menu.id,
    )
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return serialize_menu(menu)


@router.post("/{menu_id}/unpublish", response_model=MenuResponse)
def unpublish_menu(
    menu_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MenuResponse:
    menu = get_owned_menu(db, menu_id=menu_id, user_id=current_user.id)
    if menu is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found.")

    menu.status = "draft"
    record_product_event(
        db,
        request=request,
        user=current_user,
        event_name="menu_unpublished",
        source="backend",
        venue_id=menu.venue_id,
        menu_id=menu.id,
    )
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return serialize_menu(menu)
