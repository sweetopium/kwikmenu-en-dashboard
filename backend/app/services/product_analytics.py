from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import ProductEvent, SessionModel, User
from app.services.auth import hash_session_token


SENSITIVE_PROPERTY_KEYS = {
    "password",
    "currentPassword",
    "newPassword",
    "confirmPassword",
    "email",
    "phone",
    "token",
}


def resolve_request_session(db: Session, request: Request) -> SessionModel | None:
    settings = get_settings()
    session_token = request.cookies.get(settings.auth_session_cookie_name)
    if not session_token:
        return None

    token_hash = hash_session_token(session_token)
    return db.query(SessionModel).filter(SessionModel.token_hash == token_hash).first()


def sanitize_properties(properties: dict[str, Any] | None) -> dict[str, Any]:
    if not properties:
        return {}

    sanitized: dict[str, Any] = {}
    for key, value in properties.items():
        if key in SENSITIVE_PROPERTY_KEYS:
            continue
        if isinstance(value, (str, int, float, bool)) or value is None:
            sanitized[key] = value
        elif isinstance(value, list):
            sanitized[key] = [
                item if isinstance(item, (str, int, float, bool)) or item is None else str(item)
                for item in value[:25]
            ]
        elif isinstance(value, dict):
            sanitized[key] = sanitize_properties(value)
        else:
            sanitized[key] = str(value)
    return sanitized


def get_request_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip() or None
    return request.client.host if request.client else None


def record_product_event(
    db: Session,
    *,
    event_name: str,
    request: Request | None = None,
    user: User | None = None,
    session: SessionModel | None = None,
    venue_id: str | None = None,
    menu_id: str | None = None,
    source: str = "backend",
    page: str | None = None,
    properties: dict[str, Any] | None = None,
    commit: bool = False,
) -> ProductEvent:
    if request is not None and session is None:
        session = resolve_request_session(db, request)
    if user is None and session is not None:
        user = session.user

    event = ProductEvent(
        user_id=user.id if user else None,
        session_id=session.id if session else None,
        venue_id=venue_id,
        menu_id=menu_id,
        event_name=event_name,
        event_version=1,
        source=source,
        page=page or (request.url.path if request else None),
        properties=sanitize_properties(properties),
        ip_address=get_request_ip(request) if request else None,
        user_agent=request.headers.get("user-agent") if request else None,
        referer=request.headers.get("referer") if request else None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(event)
    if commit:
        db.commit()
        db.refresh(event)
    else:
        db.flush()
    return event
