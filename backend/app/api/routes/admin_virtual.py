from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.routes.admin import AdminAccess
from app.core.security import hash_password
from app.models import Menu, MenuImportJob, User, Venue, VenueSettings
from app.services.auth import attach_session_cookie, create_session
from app.services.billing import ensure_default_subscription

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/virtual-clients", tags=["admin-virtual"])


class CreateVirtualClientRequest(BaseModel):
    id: str = Field(..., description="Fixed UUID for virtual client/venue")
    name: str = Field("Виртуальный клиент", description="Name of the virtual client")


class ActivateVirtualClientRequest(BaseModel):
    email: EmailStr = Field(..., description="Real customer email")
    password: str = Field(..., min_length=6, description="Real customer password")
    name: str | None = Field(None, description="Optional new name for the customer")


@router.post("", status_code=status.HTTP_201_CREATED)
def create_virtual_client(
    payload: CreateVirtualClientRequest,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    uuid_str = payload.id.strip().lower()
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.id == uuid_str).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким UUID уже существует.",
        )
        
    placeholder_email = f"virtual-{uuid_str}@virtual.kwikmenu.ru"
    existing_email = db.query(User).filter(User.email == placeholder_email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким заглушечным e-mail уже существует.",
        )

    # 1. Create User
    user = User(
        id=uuid_str,
        email=placeholder_email,
        name=payload.name.strip(),
        password_hash=None,
        is_active=True,
    )
    db.add(user)
    db.flush()

    # 2. Setup subscription
    ensure_default_subscription(db, user)

    db.commit()
    logger.info("Created virtual client user_id=%s", user.id)
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "createdAt": user.created_at,
    }


@router.post("/{client_id}/impersonate")
def impersonate_virtual_client(
    client_id: str,
    response: Response,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    user = db.query(User).filter(User.id == client_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден.",
        )

    # Create session
    session_row, session_token = create_session(
        db,
        user=user,
        ip_address="impersonated",
        user_agent="Admin Impersonation Tool",
    )
    db.commit()

    from app.core.config import get_settings
    settings = get_settings()
    frontend_base = settings.menu_import_frontend_origin.rstrip("/")
    magic_url = f"{frontend_base}/api/auth/magic-login?token={session_token}"

    logger.info("Admin generated impersonation magic url for user user_id=%s session_id=%s", user.id, session_row.id)

    return {
        "status": "ok",
        "userId": user.id,
        "email": user.email,
        "sessionToken": session_token,
        "magicUrl": magic_url,
    }



@router.post("/{client_id}/reset")
def reset_virtual_client(
    client_id: str,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    user = db.query(User).filter(User.id == client_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден.",
        )

    # Find any venues owned by this user
    venues = db.query(Venue).filter(Venue.owner_user_id == user.id).all()
    for venue in venues:
        # 1. Delete all menus under this venue
        db.query(Menu).filter(Menu.venue_id == venue.id).delete(synchronize_session=False)

        # 2. Delete all import jobs under this venue
        db.query(MenuImportJob).filter(MenuImportJob.venue_id == venue.id).delete(synchronize_session=False)

        # 3. Delete the venue settings
        db.query(VenueSettings).filter(VenueSettings.venue_id == venue.id).delete(synchronize_session=False)

        # 4. Delete the venue
        db.query(Venue).filter(Venue.id == venue.id).delete(synchronize_session=False)

    db.commit()
    logger.info("Reset virtual client slot user_id=%s", user.id)

    return {
        "status": "ok",
        "userId": user.id,
    }


@router.post("/{client_id}/activate")
def activate_virtual_client(
    client_id: str,
    payload: ActivateVirtualClientRequest,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    user = db.query(User).filter(User.id == client_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден.",
        )

    target_email = payload.email.strip().lower()
    
    # Check if target email is already in use by another user
    existing_email = db.query(User).filter(User.email == target_email, User.id != user.id).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует.",
        )

    # Convert placeholder email to real email, update name and password
    user.email = target_email
    user.password_hash = hash_password(payload.password)
    if payload.name:
        user.name = payload.name.strip()
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    logger.info("Activated virtual client to real client user_id=%s email=%s", user.id, user.email)

    return {
        "status": "ok",
        "userId": user.id,
        "email": user.email,
        "name": user.name,
    }
