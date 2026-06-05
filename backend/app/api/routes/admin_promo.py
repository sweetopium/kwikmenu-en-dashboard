from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.routes.admin import AdminAccess
from app.models.promo_page import PromoPage
from app.schemas.promo_page import PromoPageCreateRequest, PromoPageUpdateRequest

router = APIRouter(prefix="/api/admin/promo-pages", tags=["admin-promo"])


@router.get("")
def list_promo_pages(
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    pages = db.query(PromoPage).order_by(PromoPage.created_at.desc()).all()
    return {
        "items": [
            {
                "id": page.id,
                "slug": page.slug,
                "title": page.title,
                "content": page.content,
                "createdAt": page.created_at,
                "updatedAt": page.updated_at,
            }
            for page in pages
        ]
    }


@router.get("/{page_id}")
def get_promo_page(
    page_id: str,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    page = db.query(PromoPage).filter(PromoPage.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promo page not found.",
        )
    return {
        "id": page.id,
        "slug": page.slug,
        "title": page.title,
        "content": page.content,
        "createdAt": page.created_at,
        "updatedAt": page.updated_at,
    }


@router.post("")
def create_promo_page(
    payload: PromoPageCreateRequest,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    existing = db.query(PromoPage).filter(PromoPage.slug == payload.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A page with this slug already exists.",
        )

    page = PromoPage(
        slug=payload.slug,
        title=payload.title,
        content=payload.content,
    )
    db.add(page)
    db.commit()
    db.refresh(page)

    return {
        "id": page.id,
        "slug": page.slug,
        "title": page.title,
        "content": page.content,
        "createdAt": page.created_at,
        "updatedAt": page.updated_at,
    }


@router.patch("/{page_id}")
def update_promo_page(
    page_id: str,
    payload: PromoPageUpdateRequest,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    page = db.query(PromoPage).filter(PromoPage.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promo page not found.",
        )

    if payload.slug is not None and payload.slug != page.slug:
        existing = db.query(PromoPage).filter(PromoPage.slug == payload.slug).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A page with this slug already exists.",
            )
        page.slug = payload.slug

    if payload.title is not None:
        page.title = payload.title

    if payload.content is not None:
        page.content = payload.content

    db.commit()
    db.refresh(page)

    return {
        "id": page.id,
        "slug": page.slug,
        "title": page.title,
        "content": page.content,
        "createdAt": page.created_at,
        "updatedAt": page.updated_at,
    }


@router.delete("/{page_id}")
def delete_promo_page(
    page_id: str,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    page = db.query(PromoPage).filter(PromoPage.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promo page not found.",
        )

    db.delete(page)
    db.commit()

    return {"status": "ok"}
