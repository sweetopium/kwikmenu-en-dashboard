from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import SessionModel, User, Venue
from app.schemas.auth import (
    AuthResponse,
    CurrentUserResponse,
    LoginRequest,
    PasswordUpdateRequest,
    ProfileUpdateRequest,
    RegisterRequest,
)
from app.services.auth import (
    attach_session_cookie,
    authenticate_user,
    build_redirect_url,
    clear_session_cookie,
    create_session,
    create_user,
    find_or_create_oauth_user,
    update_user_password,
    update_user_profile,
)
from app.services.product_analytics import record_product_event
from app.services.oauth import (
    build_authorize_url,
    clear_oauth_state_cookie,
    ensure_oauth_request_valid,
    exchange_code_for_profile,
    redirect_to_frontend,
    redirect_to_frontend_login_error,
    set_oauth_state_cookie,
    validate_oauth_state,
    OAuthError,
)


router = APIRouter(prefix="/api/auth", tags=["auth"])


def serialize_user(user: User) -> CurrentUserResponse:
    providers = sorted({account.provider for account in user.auth_accounts})
    if user.password_hash:
      providers = ["password", *providers]

    return CurrentUserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        hasPassword=bool(user.password_hash),
        authProviders=providers,
        createdAt=user.created_at,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    if payload.password != payload.confirmPassword:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match.")

    try:
        user = create_user(db, name=payload.name, email=payload.email, password=payload.password)
        session_row, session_token = create_session(
            db,
            user=user,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        record_product_event(
            db,
            request=request,
            user=user,
            session=session_row,
            event_name="register_completed",
            source="backend",
            properties={"auth_provider": "password"},
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    attach_session_cookie(response, session_token)
    return AuthResponse(
        user=serialize_user(user),
        redirectUrl=build_redirect_url(has_venues=False),
    )


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    try:
        user = authenticate_user(db, email=payload.email, password=payload.password)
        session_row, session_token = create_session(
            db,
            user=user,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        has_venues = db.query(Venue).filter(Venue.owner_user_id == user.id).first() is not None
        record_product_event(
            db,
            request=request,
            user=user,
            session=session_row,
            event_name="login_completed",
            source="backend",
            properties={"auth_provider": "password", "has_venues": has_venues},
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    attach_session_cookie(response, session_token)
    return AuthResponse(
        user=serialize_user(user),
        redirectUrl=build_redirect_url(has_venues=has_venues),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> Response:
    session_token = request.cookies.get("kwikmenu_session")
    if session_token:
        from app.services.auth import hash_session_token

        token_hash = hash_session_token(session_token)
        session_row = db.query(SessionModel).filter(SessionModel.token_hash == token_hash).first()
        if session_row:
            session_row.is_active = False
            db.add(session_row)
            db.commit()

    clear_session_cookie(response)
    return response


@router.get("/magic-login")
def magic_login(
    token: str,
    response: Response,
    db: Session = Depends(get_db),
) -> Response:
    from datetime import datetime, timezone
    from app.services.auth import hash_session_token

    token_hash = hash_session_token(token)
    session_row = (
        db.query(SessionModel)
        .filter(
            SessionModel.token_hash == token_hash,
            SessionModel.is_active == True,
        )
        .first()
    )

    if not session_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired login token.",
        )

    if session_row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired.",
        )

    attach_session_cookie(response, token)

    response.status_code = status.HTTP_302_FOUND
    response.headers["Location"] = "/dashboard"
    return response



@router.get("/me", response_model=CurrentUserResponse)
def me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CurrentUserResponse:
    db.refresh(current_user)
    return serialize_user(current_user)


@router.patch("/profile", response_model=CurrentUserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CurrentUserResponse:
    try:
        user = update_user_profile(
            db,
            user=current_user,
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
        )
        db.commit()
        db.refresh(user)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return serialize_user(user)


@router.post("/password", response_model=CurrentUserResponse)
def change_password(
    payload: PasswordUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CurrentUserResponse:
    if payload.newPassword != payload.confirmPassword:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match.")

    try:
        user = update_user_password(
            db,
            user=current_user,
            current_password=payload.currentPassword,
            new_password=payload.newPassword,
        )
        db.commit()
        db.refresh(user)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return serialize_user(user)


@router.get("/oauth/{provider}")
def oauth_provider_redirect(provider: str, response: Response) -> Response:
    normalized_provider = ensure_oauth_request_valid(provider)
    state = set_oauth_state_cookie(response, provider=normalized_provider)
    response.status_code = status.HTTP_302_FOUND
    response.headers["Location"] = build_authorize_url(normalized_provider, state=state)
    return response


@router.get("/oauth/{provider}/callback")
def oauth_provider_callback(
    provider: str,
    request: Request,
    response: Response,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
) -> Response:
    normalized_provider = ensure_oauth_request_valid(provider)
    try:
        if error:
            raise OAuthError(f"{normalized_provider} OAuth was cancelled or rejected: {error}")
        validate_oauth_state(request, provider=normalized_provider, state=state)
        if not code:
            raise OAuthError("OAuth callback did not include an authorization code.")

        profile = exchange_code_for_profile(normalized_provider, code=code)
        user = find_or_create_oauth_user(
            db,
            provider=profile.provider,
            provider_account_id=profile.provider_account_id,
            email=profile.email,
            name=profile.name,
        )
        session_row, session_token = create_session(
            db,
            user=user,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        has_venues = db.query(Venue).filter(Venue.owner_user_id == user.id).first() is not None
        record_product_event(
            db,
            request=request,
            user=user,
            session=session_row,
            event_name="login_completed",
            source="backend",
            properties={"auth_provider": normalized_provider, "has_venues": has_venues},
        )
        db.commit()
        attach_session_cookie(response, session_token)
        clear_oauth_state_cookie(response)
        return redirect_to_frontend(response, redirect_path=build_redirect_url(has_venues=has_venues))
    except (OAuthError, ValueError) as exc:
        db.rollback()
        clear_oauth_state_cookie(response)
        return redirect_to_frontend_login_error(response, detail=str(exc))
