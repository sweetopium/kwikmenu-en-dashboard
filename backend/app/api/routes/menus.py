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
    payload_dict = {**menu.payload}
    venue = menu.venue
    if venue:
        venue_settings = venue.settings
        payload_dict["venue"] = {
            **(payload_dict.get("venue") or {}),
            "name": venue.name,
            "description": venue.description,
            "logoUrl": venue_settings.design_logo_url if venue_settings else None,
        }
    payload = MenuPayload.model_validate(payload_dict)
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


@router.post("/{menu_id}/translate", response_model=MenuResponse)
def translate_menu(
    menu_id: str,
    target_lang: str = Query(..., description="Target language code (e.g. en, ar, etc.)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MenuResponse:
    menu = get_owned_menu(db, menu_id=menu_id, user_id=current_user.id)
    if menu is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found.")

    payload = MenuPayload.model_validate(menu.payload)

    subscription = get_effective_subscription(db, current_user)
    if not subscription.plan.translations_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Translations are not available on the {subscription.plan.name} plan."
        )

    target_lang = target_lang.strip().lower()
    valid_codes = {"ru", "en", "ar", "kk", "tr", "de", "fr", "es", "zh", "he"}
    if target_lang not in valid_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid language code: {target_lang}."
        )

    active_langs = set()
    for l_code, loc in payload.menuMeta.translations.items():
        if l_code != payload.defaultLanguage and (loc.name or loc.description):
            active_langs.add(l_code)
    for cat in payload.categories:
        for l_code, loc in cat.translations.items():
            if l_code != payload.defaultLanguage and (loc.name or loc.description):
                active_langs.add(l_code)
        for item in cat.items:
            for l_code, loc in item.translations.items():
                if l_code != payload.defaultLanguage and (loc.name or loc.description):
                    active_langs.add(l_code)
            for var in item.variants:
                for l_code, loc in var.translations.items():
                    if l_code != payload.defaultLanguage and loc.label:
                        active_langs.add(l_code)

    if target_lang != payload.defaultLanguage and target_lang not in active_langs:
        if len(active_langs) >= subscription.plan.max_translation_languages:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Translation language limit exceeded for the {subscription.plan.name} plan (max {subscription.plan.max_translation_languages})."
            )

    from app.schemas.menu_translation import extract_translatable, merge_translations
    from app.services.openrouter_client import OpenRouterClient

    translatable = extract_translatable(payload)
    openrouter = OpenRouterClient()

    try:
        translated = openrouter.translate_menu(translatable, target_lang)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI translation failed: {str(exc)}"
        )

    merge_translations(payload, translated, target_lang)

    menu.payload = payload.model_dump(mode="json")
    db.add(menu)
    db.commit()
    db.refresh(menu)

    return serialize_menu(menu)
