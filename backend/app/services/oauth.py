from __future__ import annotations

import base64
import hashlib
import json
import secrets
from dataclasses import dataclass
from typing import Any
from urllib.parse import quote, urlencode
from urllib.request import Request as UrlRequest, urlopen

from fastapi import HTTPException, Request as FastAPIRequest, Response, status

from app.core.config import Settings, get_settings


OAUTH_STATE_COOKIE_NAME = "kwikmenu_oauth_state"
OAUTH_STATE_COOKIE_PATH = "/api/auth/oauth"


@dataclass(frozen=True)
class OAuthUserProfile:
    provider: str
    provider_account_id: str
    email: str | None
    name: str
    avatar_url: str | None = None


@dataclass(frozen=True)
class OAuthProviderConfig:
    name: str
    authorize_url: str
    token_url: str
    user_info_url: str
    scopes: tuple[str, ...]


class OAuthError(ValueError):
    pass


def _request_json(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    form_data: dict[str, str] | None = None,
) -> Any:
    encoded_data = None
    request_headers = dict(headers or {})
    if form_data is not None:
        encoded_data = urlencode(form_data).encode("utf-8")
        request_headers.setdefault("Content-Type", "application/x-www-form-urlencoded")

    request = UrlRequest(url, data=encoded_data, headers=request_headers, method=method)
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def _frontend_base_url(settings: Settings) -> str:
    return settings.menu_import_frontend_origin.rstrip("/")


def _backend_base_url(settings: Settings) -> str:
    return settings.menu_import_api_url.rstrip("/")


def _callback_url(provider: str, settings: Settings) -> str:
    return f"{_backend_base_url(settings)}/api/auth/oauth/{provider}/callback"


def _login_error_redirect(detail: str, settings: Settings) -> str:
    return f"{_frontend_base_url(settings)}/login?oauth_error={quote(detail)}"


def set_oauth_state_cookie(response: Response, *, provider: str) -> str:
    settings = get_settings()
    nonce = secrets.token_urlsafe(32)
    response.set_cookie(
        key=OAUTH_STATE_COOKIE_NAME,
        value=f"{provider}:{nonce}",
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        max_age=10 * 60,
        domain=settings.auth_cookie_domain,
        path=OAUTH_STATE_COOKIE_PATH,
    )
    return nonce


def clear_oauth_state_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=OAUTH_STATE_COOKIE_NAME,
        domain=settings.auth_cookie_domain,
        path=OAUTH_STATE_COOKIE_PATH,
    )


def validate_oauth_state(request: FastAPIRequest, *, provider: str, state: str | None) -> None:
    cookie_value = request.cookies.get(OAUTH_STATE_COOKIE_NAME)
    if not state or not cookie_value or cookie_value != f"{provider}:{state}":
        raise OAuthError("OAuth state validation failed.")


def _google_provider(settings: Settings) -> OAuthProviderConfig:
    if not settings.oauth_google_client_id or not settings.oauth_google_client_secret:
        raise OAuthError("Google OAuth credentials are not configured.")
    return OAuthProviderConfig(
        name="google",
        authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
        token_url="https://oauth2.googleapis.com/token",
        user_info_url="https://openidconnect.googleapis.com/v1/userinfo",
        scopes=("openid", "email", "profile"),
    )


def _yandex_provider(settings: Settings) -> OAuthProviderConfig:
    if not settings.oauth_yandex_client_id or not settings.oauth_yandex_client_secret:
        raise OAuthError("Yandex OAuth credentials are not configured.")
    return OAuthProviderConfig(
        name="yandex",
        authorize_url="https://oauth.yandex.com/authorize",
        token_url="https://oauth.yandex.com/token",
        user_info_url="https://login.yandex.ru/info?format=json",
        scopes=(),
    )


def _mailru_provider(settings: Settings) -> OAuthProviderConfig:
    if not settings.oauth_mailru_client_id or not settings.oauth_mailru_client_secret:
        raise OAuthError("Mail.ru OAuth credentials are not configured.")
    return OAuthProviderConfig(
        name="mailru",
        authorize_url="https://connect.mail.ru/oauth/authorize",
        token_url="https://connect.mail.ru/oauth/token",
        user_info_url="https://www.appsmail.ru/platform/api",
        scopes=(),
    )


def get_provider_config(provider: str, settings: Settings | None = None) -> OAuthProviderConfig:
    current_settings = settings or get_settings()
    normalized = provider.strip().lower()
    if normalized == "google":
        raise OAuthError("Google OAuth is disabled.")
    if normalized == "yandex":
        return _yandex_provider(current_settings)
    if normalized == "mailru":
        return _mailru_provider(current_settings)
    raise OAuthError(f"Unsupported OAuth provider '{provider}'.")


def build_authorize_url(provider: str, *, state: str, settings: Settings | None = None) -> str:
    current_settings = settings or get_settings()
    config = get_provider_config(provider, current_settings)
    redirect_uri = _callback_url(config.name, current_settings)

    if config.name == "google":
        params = {
            "client_id": current_settings.oauth_google_client_id or "",
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(config.scopes),
            "state": state,
            "access_type": "online",
            "include_granted_scopes": "true",
            "prompt": "select_account",
        }
    elif config.name == "yandex":
        params = {
            "response_type": "code",
            "client_id": current_settings.oauth_yandex_client_id or "",
            "redirect_uri": redirect_uri,
            "state": state,
        }
    else:
        params = {
            "client_id": current_settings.oauth_mailru_client_id or "",
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "state": state,
        }

    return f"{config.authorize_url}?{urlencode(params)}"


def exchange_code_for_profile(
    provider: str,
    *,
    code: str,
    settings: Settings | None = None,
) -> OAuthUserProfile:
    current_settings = settings or get_settings()
    config = get_provider_config(provider, current_settings)
    redirect_uri = _callback_url(config.name, current_settings)

    if config.name == "google":
        token_payload = _request_json(
            config.token_url,
            method="POST",
            form_data={
                "client_id": current_settings.oauth_google_client_id or "",
                "client_secret": current_settings.oauth_google_client_secret or "",
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )
        access_token = token_payload.get("access_token")
        if not access_token:
            raise OAuthError("Google token exchange failed.")
        profile_payload = _request_json(
            config.user_info_url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        provider_account_id = str(profile_payload.get("sub") or "")
        email = profile_payload.get("email")
        name = (profile_payload.get("name") or email or "Google User").strip()
        if not provider_account_id:
            raise OAuthError("Google profile did not return a user id.")
        return OAuthUserProfile(
            provider="google",
            provider_account_id=provider_account_id,
            email=email,
            name=name,
            avatar_url=profile_payload.get("picture"),
        )

    if config.name == "yandex":
        basic_credentials = base64.b64encode(
            f"{current_settings.oauth_yandex_client_id}:{current_settings.oauth_yandex_client_secret}".encode("utf-8")
        ).decode("utf-8")
        token_payload = _request_json(
            config.token_url,
            method="POST",
            headers={"Authorization": f"Basic {basic_credentials}"},
            form_data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": current_settings.oauth_yandex_client_id or "",
                "client_secret": current_settings.oauth_yandex_client_secret or "",
                "redirect_uri": redirect_uri,
            },
        )
        access_token = token_payload.get("access_token")
        if not access_token:
            raise OAuthError("Yandex token exchange failed.")
        profile_payload = _request_json(
            config.user_info_url,
            headers={"Authorization": f"OAuth {access_token}"},
        )
        provider_account_id = str(profile_payload.get("id") or "")
        email = profile_payload.get("default_email") or (
            profile_payload.get("emails") or [None]
        )[0]
        name = (
            profile_payload.get("real_name")
            or " ".join(
                part for part in [profile_payload.get("first_name"), profile_payload.get("last_name")] if part
            )
            or profile_payload.get("display_name")
            or profile_payload.get("login")
            or email
            or "Yandex User"
        ).strip()
        avatar_url = None
        avatar_id = profile_payload.get("default_avatar_id")
        if avatar_id:
            avatar_url = f"https://avatars.yandex.net/get-yapic/{avatar_id}/islands-200"
        if not provider_account_id:
            raise OAuthError("Yandex profile did not return a user id.")
        return OAuthUserProfile(
            provider="yandex",
            provider_account_id=provider_account_id,
            email=email,
            name=name,
            avatar_url=avatar_url,
        )

    token_payload = _request_json(
        config.token_url,
        method="POST",
        form_data={
            "client_id": current_settings.oauth_mailru_client_id or "",
            "client_secret": current_settings.oauth_mailru_client_secret or "",
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        },
    )
    access_token = token_payload.get("access_token")
    provider_account_id = str(token_payload.get("x_mailru_vid") or "")
    if not access_token or not provider_account_id:
        raise OAuthError("Mail.ru token exchange failed.")

    api_params = {
        "app_id": current_settings.oauth_mailru_client_id or "",
        "method": "users.getInfo",
        "secure": "1",
        "session_key": access_token,
    }
    signature_base = "".join(f"{key}={api_params[key]}" for key in sorted(api_params))
    api_params["sig"] = hashlib.md5(
        f"{signature_base}{current_settings.oauth_mailru_client_secret or ''}".encode("utf-8")
    ).hexdigest()
    profile_payload = _request_json(f"{config.user_info_url}?{urlencode(api_params)}")
    profile = profile_payload[0] if isinstance(profile_payload, list) and profile_payload else {}

    first_name = (profile.get("first_name") or "").strip()
    last_name = (profile.get("last_name") or "").strip()
    name = " ".join(part for part in [first_name, last_name] if part).strip()
    if not name:
        name = (profile.get("nick") or profile.get("email") or "Mail.ru User").strip()

    return OAuthUserProfile(
        provider="mailru",
        provider_account_id=str(profile.get("uid") or provider_account_id),
        email=profile.get("email"),
        name=name,
        avatar_url=profile.get("pic_big") or profile.get("pic"),
    )


def redirect_to_frontend(response: Response, *, redirect_path: str) -> Response:
    settings = get_settings()
    response.status_code = status.HTTP_302_FOUND
    response.headers["Location"] = f"{_frontend_base_url(settings)}{redirect_path}"
    return response


def redirect_to_frontend_login_error(response: Response, *, detail: str) -> Response:
    response.status_code = status.HTTP_302_FOUND
    response.headers["Location"] = _login_error_redirect(detail, get_settings())
    return response


def ensure_oauth_request_valid(provider: str) -> str:
    try:
        return get_provider_config(provider).name
    except OAuthError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
