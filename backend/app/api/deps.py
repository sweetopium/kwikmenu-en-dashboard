from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db_session
from app.models import SessionModel, User
from app.services.auth import hash_session_token


def get_db(session: Session = Depends(get_db_session)) -> Session:
    return session


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    settings = get_settings()
    session_token = request.cookies.get(settings.auth_session_cookie_name)
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    token_hash = hash_session_token(session_token)
    session_row = db.query(SessionModel).filter(SessionModel.token_hash == token_hash).first()
    if session_row is None or not session_row.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session.")
    if session_row.expires_at <= datetime.now(timezone.utc):
        session_row.is_active = False
        db.add(session_row)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired.")

    if session_row.user is None or not session_row.user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is not active.")

    session_row.last_seen_at = datetime.now(timezone.utc)
    db.add(session_row)
    db.commit()

    return session_row.user
