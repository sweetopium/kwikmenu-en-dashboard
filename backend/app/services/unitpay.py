from __future__ import annotations

import hashlib
import json
import base64
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

from fastapi import HTTPException, status

from app.core.config import get_settings


@dataclass
class UnitPayInitPaymentResult:
    payment_id: str | None
    redirect_url: str | None
    receipt_url: str | None
    status_url: str | None
    payload: dict[str, Any]


class UnitPayClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def enabled(self) -> bool:
        return bool(self._api_secret_key() and self.settings.unitpay_project_id)

    def ensure_configured(self) -> None:
        if self.enabled:
            return
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Интеграция с UnitPay не настроена.",
        )

    def init_subscription_payment(
        self,
        *,
        account: str,
        sum_amount: float,
        description: str,
        customer_email: str | None = None,
        customer_phone: str | None = None,
        receipt_items: list[dict[str, Any]] | None = None,
        subscription: bool = False,
        subscription_id: str | None = None,
    ) -> UnitPayInitPaymentResult:
        params: dict[str, Any] = {
            "paymentType": self.settings.unitpay_payment_type,
            "account": account,
            "sum": f"{sum_amount:.2f}",
            "desc": description,
            "projectId": self.settings.unitpay_project_id,
            "secretKey": self._api_secret_key(),
            "currency": self.settings.currency,
            "locale": "ru",
        }
        if self.settings.unitpay_login:
            params["login"] = self.settings.unitpay_login
        if self.settings.unitpay_test_mode:
            params["test"] = 1
        if self.settings.unitpay_hide_other_methods:
            params["hideOtherMethods"] = "true"
        if self.settings.unitpay_success_url:
            params["successUrl"] = self.settings.unitpay_success_url
        if self.settings.unitpay_fail_url:
            params["failUrl"] = self.settings.unitpay_fail_url
        if customer_email:
            params["customerEmail"] = customer_email
        if customer_phone:
            params["customerPhone"] = self._normalize_phone(customer_phone)
        if receipt_items:
            params["cashItems"] = self._encode_cash_items(receipt_items)
        if subscription:
            params["subscription"] = "true"
        if subscription_id:
            params["subscriptionId"] = subscription_id

        payload = self._api_get("initPayment", params)
        result = payload.get("result") or {}
        return UnitPayInitPaymentResult(
            payment_id=str(result.get("paymentId")) if result.get("paymentId") is not None else None,
            redirect_url=result.get("redirectUrl"),
            receipt_url=result.get("receiptUrl"),
            status_url=result.get("statusUrl"),
            payload=payload,
        )

    def list_subscriptions(self, *, all_statuses: bool = False) -> dict[str, Any]:
        params: dict[str, Any] = {
            "projectId": self.settings.unitpay_project_id,
            "secretKey": self._api_secret_key(),
        }
        if all_statuses:
            params["all"] = 1
        return self._api_get("listSubscriptions", params)

    def get_subscription(self, *, subscription_id: str) -> dict[str, Any]:
        params: dict[str, Any] = {
            "subscriptionId": subscription_id,
            "projectId": self.settings.unitpay_project_id,
            "secretKey": self._api_secret_key(),
        }
        return self._api_get("getSubscription", params)

    def get_payment(self, *, payment_id: str) -> dict[str, Any]:
        params: dict[str, Any] = {
            "paymentId": payment_id,
            "secretKey": self._api_secret_key(),
        }
        if self.settings.unitpay_test_mode:
            params["test"] = 1
            if self.settings.unitpay_login:
                params["login"] = self.settings.unitpay_login
        return self._api_get("getPayment", params)

    def close_subscription(self, *, subscription_id: str) -> dict[str, Any]:
        return self._api_get(
            "closeSubscription",
            {
                "subscriptionId": subscription_id,
                "projectId": self.settings.unitpay_project_id,
                "secretKey": self._api_secret_key(),
                **({"test": 1} if self.settings.unitpay_test_mode else {}),
            },
        )

    def refund_payment(
        self,
        *,
        payment_id: str,
        sum_amount: float | None = None,
        receipt_items: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {
            "paymentId": payment_id,
            "secretKey": self._api_secret_key(),
        }
        if sum_amount is not None:
            params["sum"] = f"{sum_amount:.2f}"
        if receipt_items:
            params["cashItems"] = self._encode_cash_items(receipt_items)
        return self._api_get("refundPayment", params)

    def verify_callback_signature(self, *, method: str, params: dict[str, Any], signature: str | None) -> bool:
        if not signature:
            return False
        sorted_values = [str(params[key]) for key in sorted(params) if key != "signature"]
        payload = "{up}".join([method, *sorted_values, self._signature_secret_key()])
        expected = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        return expected == signature

    def validate_callback_ip(self, ip_address: str | None) -> bool:
        allowed_ips = {ip.strip() for ip in self.settings.unitpay_allowed_ips.split(",") if ip.strip()}
        if not allowed_ips:
            return True
        if not ip_address:
            return False
        return ip_address in allowed_ips

    def build_checkout_link(self, *, public_key: str, payment_type: str, query_params: dict[str, Any]) -> str:
        encoded = urlencode(query_params)
        return f"{self.settings.unitpay_base_url.rstrip('/')}/pay/{public_key}/{payment_type}?{encoded}"

    def _project_secret_key(self) -> str:
        return (
            self.settings.unitpay_project_secret_key
            or self.settings.unitpay_secret_key
            or ""
        )

    def _test_secret_key(self) -> str:
        return (
            self.settings.unitpay_test_secret_key
            or self.settings.unitpay_secret_key
            or ""
        )

    def _api_secret_key(self) -> str:
        return self._test_secret_key() if self.settings.unitpay_test_mode else self._project_secret_key()

    def _signature_secret_key(self) -> str:
        return self._project_secret_key()

    def _encode_cash_items(self, cash_items: list[dict[str, Any]]) -> str:
        encoded = json.dumps(cash_items, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        return base64.b64encode(encoded).decode("ascii")

    def _normalize_phone(self, phone: str) -> str:
        return "".join(char for char in phone if char.isdigit())

    def _api_get(self, method: str, params: dict[str, Any]) -> dict[str, Any]:
        self.ensure_configured()
        query: dict[str, Any] = {"method": method}
        for key, value in params.items():
            query[f"params[{key}]"] = value
        request_url = f"{self.settings.unitpay_api_url}?{urlencode(query)}"
        try:
            with urlopen(request_url, timeout=20) as response:
                data = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            response_body = exc.read().decode("utf-8", errors="replace")
            print(
                f"[UnitPay HTTP error] method={method} status={exc.code} url={request_url} body={response_body}",
                flush=True,
            )
            try:
                payload = json.loads(response_body)
            except json.JSONDecodeError:
                payload = None
            if isinstance(payload, dict) and "error" in payload:
                message = (payload.get("error") or {}).get("message") or response_body or "UnitPay API error."
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message) from exc
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=response_body or "Не удалось выполнить запрос к UnitPay.",
            ) from exc
        except URLError as exc:
            print(
                f"[UnitPay URL error] method={method} url={request_url} reason={exc.reason}",
                flush=True,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Не удалось выполнить запрос к UnitPay: {exc.reason}",
            ) from exc
        except Exception as exc:  # noqa: BLE001
            print(
                f"[UnitPay unexpected error] method={method} url={request_url} error={exc!r}",
                flush=True,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=str(exc) or "Не удалось выполнить запрос к UnitPay.",
            ) from exc

        if "error" in data:
            message = (data.get("error") or {}).get("message") or "UnitPay API error."
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
        return data
