from __future__ import annotations

import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from typing import Any

import requests
from fastapi import HTTPException, status

from app.core.config import get_settings


@dataclass(frozen=True)
class StripeCheckoutSessionResult:
    session_id: str
    url: str
    payload: dict[str, Any]


class StripeBillingClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.secret_key = self.settings.stripe_secret_key
        self.api_url = self.settings.stripe_api_url.rstrip("/")

    @property
    def enabled(self) -> bool:
        return bool(self.secret_key)

    def _request(
        self,
        method: str,
        path: str,
        *,
        data: list[tuple[str, str | int | bool]] | dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if not self.secret_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stripe is not configured. Add STRIPE_SECRET_KEY.",
            )

        request_kwargs: dict[str, Any] = {
            "auth": (self.secret_key, ""),
            "timeout": 30,
        }
        if method.upper() == "GET":
            request_kwargs["params"] = data
        else:
            request_kwargs["data"] = data

        response = requests.request(
            method,
            f"{self.api_url}{path}",
            **request_kwargs,
        )
        payload = response.json() if response.content else {}
        if response.status_code >= 400:
            message = payload.get("error", {}).get("message") if isinstance(payload, dict) else None
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message or "Stripe request failed.",
            )
        return payload

    def create_checkout_session(
        self,
        *,
        price_id: str,
        success_url: str,
        cancel_url: str,
        customer_email: str,
        customer_id: str | None,
        client_reference_id: str,
        metadata: dict[str, str],
    ) -> StripeCheckoutSessionResult:
        data: list[tuple[str, str | int | bool]] = [
            ("mode", "subscription"),
            ("success_url", success_url),
            ("cancel_url", cancel_url),
            ("client_reference_id", client_reference_id),
            ("line_items[0][price]", price_id),
            ("line_items[0][quantity]", 1),
            ("allow_promotion_codes", "true"),
            ("automatic_tax[enabled]", "true" if self.settings.stripe_automatic_tax_enabled else "false"),
        ]
        if customer_id:
            data.append(("customer", customer_id))
        else:
            data.append(("customer_email", customer_email))
        for key, value in metadata.items():
            data.append((f"metadata[{key}]", value))
            data.append((f"subscription_data[metadata][{key}]", value))

        payload = self._request("POST", "/checkout/sessions", data=data)
        session_id = str(payload.get("id") or "")
        checkout_url = str(payload.get("url") or "")
        if not session_id or not checkout_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stripe did not return a checkout URL.",
            )
        return StripeCheckoutSessionResult(session_id=session_id, url=checkout_url, payload=payload)

    def retrieve_checkout_session(self, session_id: str) -> dict[str, Any]:
        return self._request(
            "GET",
            f"/checkout/sessions/{session_id}",
            data=[("expand[]", "subscription"), ("expand[]", "customer")],
        )

    def retrieve_subscription(self, subscription_id: str) -> dict[str, Any]:
        return self._request("GET", f"/subscriptions/{subscription_id}")

    def cancel_subscription(self, subscription_id: str) -> dict[str, Any]:
        return self._request("DELETE", f"/subscriptions/{subscription_id}")

    def verify_webhook_event(self, raw_body: bytes, signature_header: str | None) -> dict[str, Any]:
        webhook_secret = self.settings.stripe_webhook_secret
        if not webhook_secret:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stripe webhook secret is not configured.")
        if not signature_header:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Stripe signature.")

        parts: dict[str, list[str]] = {}
        for item in signature_header.split(","):
            key, _, value = item.partition("=")
            if key and value:
                parts.setdefault(key, []).append(value)

        timestamp_values = parts.get("t") or []
        signatures = parts.get("v1") or []
        if not timestamp_values or not signatures:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Stripe signature header.")

        timestamp = timestamp_values[0]
        try:
            timestamp_int = int(timestamp)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Stripe signature timestamp.") from exc
        if abs(time.time() - timestamp_int) > 300:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stale Stripe webhook signature.")

        signed_payload = timestamp.encode("utf-8") + b"." + raw_body
        expected = hmac.new(webhook_secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
        if not any(hmac.compare_digest(expected, signature) for signature in signatures):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Stripe webhook signature.")

        return json.loads(raw_body.decode("utf-8"))
