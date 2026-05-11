from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import Response
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import generate_session_token, hash_password, verify_password
from app.models import SessionModel, User


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def build_redirect_url(*, has_venues: bool) -> str:
    return "/dashboard" if has_venues else "/onboarding/upload"


def create_user(db: Session, *, name: str, email: str, password: str) -> User:
    normalized_email = email.strip().lower()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise ValueError("Пользователь с таким email уже существует.")

    user = User(
        name=name.strip(),
        email=normalized_email,
        password_hash=hash_password(password),
    )
    db.add(user)
    db.flush()
    return user


def authenticate_user(db: Session, *, email: str, password: str) -> User:
    normalized_email = email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if user is None or not user.password_hash or not verify_password(password, user.password_hash):
        raise ValueError("Неверный email или пароль.")
    if not user.is_active:
        raise ValueError("Пользователь деактивирован.")
    return user


def update_user_profile(db: Session, *, user: User, name: str, email: str, phone: str | None) -> User:
    normalized_email = email.strip().lower()
    existing_user = db.query(User).filter(User.email == normalized_email, User.id != user.id).first()
    if existing_user:
        raise ValueError("Пользователь с таким email уже существует.")

    user.name = name.strip()
    user.email = normalized_email
    user.phone = phone.strip() if phone else None
    db.add(user)
    db.flush()
    return user


def update_user_password(
    db: Session,
    *,
    user: User,
    current_password: str,
    new_password: str,
) -> User:
    if not user.password_hash:
        raise ValueError("Смена пароля недоступна для этого способа входа.")
    if not verify_password(current_password, user.password_hash):
        raise ValueError("Текущий пароль указан неверно.")

    user.password_hash = hash_password(new_password)
    db.add(user)
    db.flush()
    return user


def create_session(
    db: Session,
    *,
    user: User,
    ip_address: str | None,
    user_agent: str | None,
) -> tuple[SessionModel, str]:
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.auth_session_ttl_hours)
    raw_token = generate_session_token()
    session_row = SessionModel(
        user_id=user.id,
        token_hash=hash_session_token(raw_token),
        expires_at=expires_at,
        last_seen_at=datetime.now(timezone.utc),
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(session_row)
    db.flush()
    return session_row, raw_token


def attach_session_cookie(response: Response, session_token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=settings.auth_session_cookie_name,
        value=session_token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        max_age=settings.auth_session_ttl_hours * 3600,
        domain=settings.auth_cookie_domain,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=settings.auth_session_cookie_name,
        domain=settings.auth_cookie_domain,
        path="/",
    )
