from __future__ import annotations

import logging
import requests
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class UnisenderService:
    @staticmethod
    def compile_template(text: str, context: dict) -> str:
        """
        Replaces placeholders like {{name}} or {{email}} with values from context.
        """
        if not text:
            return ""
        compiled = text
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            compiled = compiled.replace(placeholder, str(value or ""))
        return compiled

    def send_email(
        self,
        *,
        to_email: str,
        subject: str,
        body_html: str,
        scheduled_email_id: str,
        user_context: dict,
    ) -> str:
        """
        Sends email via Unisender Go or Unisender Classic API.
        Returns the external message/job ID.
        """
        settings = get_settings()
        if not settings.unisender_api_key:
            raise ValueError("Unisender API key is not configured.")

        # Compile templates
        compiled_subject = self.compile_template(subject, user_context)
        compiled_body = self.compile_template(body_html, user_context)

        service_type = (settings.unisender_service_type or "go").strip().lower()

        if service_type == "go":
            return self._send_go(
                settings=settings,
                to_email=to_email,
                subject=compiled_subject,
                body_html=compiled_body,
                scheduled_email_id=scheduled_email_id,
            )
        else:
            return self._send_classic(
                settings=settings,
                to_email=to_email,
                subject=compiled_subject,
                body_html=compiled_body,
            )

    def _send_go(
        self,
        settings,
        to_email: str,
        subject: str,
        body_html: str,
        scheduled_email_id: str,
    ) -> str:
        url = f"{settings.unisender_go_api_url.rstrip('/')}/email/send.json"
        headers = {
            "X-API-KEY": settings.unisender_api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        metadata = {
            "scheduled_email_id": scheduled_email_id,
            "source": "kwikmenu_onboarding",
        }
        payload = {
            "message": {
                "recipients": [
                    {
                        "email": to_email,
                        "metadata": metadata,
                    }
                ],
                "global_metadata": metadata,
                "body": {
                    "html": body_html
                },
                "subject": subject,
                "from_email": settings.unisender_sender_email,
                "from_name": settings.unisender_sender_name,
                "reply_to": settings.unisender_sender_email,
                "track_links": 1,
                "track_read": 1,
                "template_engine": "none",
                "tags": ["kwikmenu_onboarding"],
            }
        }

        logger.info("Sending transactional email via Unisender Go to %s", to_email)
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        response_json = self._response_json(response)

        if response.status_code != 200 or response_json.get("status") == "error":
            error_code = response_json.get("code")
            error_msg = response_json.get("message")
            logger.error("Unisender Go API error: code=%s message=%s", error_code, error_msg)
            raise ValueError(f"Unisender Go error: {error_msg} (code: {error_code})")

        # Get job_id from top-level response or result dict
        job_id = response_json.get("job_id")
        if not job_id:
            result = response_json.get("result")
            if isinstance(result, dict):
                job_id = result.get("job_id")

        if not job_id:
            raise ValueError(f"Unisender Go returned success but job_id is missing from response: {response_json}")

        return str(job_id)

    def configure_go_webhook(self, webhook_url: str | None = None) -> dict[str, Any]:
        settings = get_settings()
        if not settings.unisender_api_key:
            raise ValueError("Unisender API key is not configured.")

        target_url = (webhook_url or settings.unisender_webhook_url or "").strip()
        if not target_url:
            target_url = f"{settings.menu_import_api_url.rstrip('/')}/api/webhooks/unisender"

        url = f"{settings.unisender_go_api_url.rstrip('/')}/webhook/set.json"
        headers = {
            "X-API-KEY": settings.unisender_api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        payload = {
            "url": target_url,
            "status": "active",
            "event_format": "json_post",
            "delivery_info": 1,
            "single_event": 0,
            "max_parallel": 10,
            "events": {
                "spam_block": ["*"],
                "email_status": [
                    "delivered",
                    "opened",
                    "clicked",
                    "unsubscribed",
                    "subscribed",
                    "soft_bounced",
                    "hard_bounced",
                    "spam",
                ],
            },
        }

        logger.info("Configuring Unisender Go webhook: %s", target_url)
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        response_json = self._response_json(response)
        if response.status_code != 200 or response_json.get("status") == "error":
            error_code = response_json.get("code")
            error_msg = response_json.get("message")
            logger.error("Unisender Go webhook error: code=%s message=%s", error_code, error_msg)
            raise ValueError(f"Unisender Go webhook error: {error_msg} (code: {error_code})")

        return {
            "webhook_url": target_url,
            "response": response_json,
        }

    def _send_classic(
        self,
        settings,
        to_email: str,
        subject: str,
        body_html: str,
    ) -> str:
        url = f"{settings.unisender_classic_api_url.rstrip('/')}/sendEmail"
        
        if not settings.unisender_classic_list_id:
            raise ValueError("UNISENDER_CLASSIC_LIST_ID is required for Unisender Classic sendEmail API.")

        payload = {
            "format": "json",
            "api_key": settings.unisender_api_key,
            "email": to_email,
            "sender_name": settings.unisender_sender_name or "KwikMenu",
            "sender_email": settings.unisender_sender_email,
            "subject": subject,
            "body": body_html,
            "list_id": settings.unisender_classic_list_id,
        }

        logger.info("Sending transactional email via Unisender Classic to %s", to_email)
        response = requests.post(url, data=payload, timeout=15)
        response_json = self._response_json(response)

        if "error" in response_json:
            error_msg = response_json.get("error")
            error_code = response_json.get("code")
            logger.error("Unisender Classic API error: code=%s message=%s", error_code, error_msg)
            raise ValueError(f"Unisender Classic error: {error_msg} (code: {error_code})")

        result = response_json.get("result", {})
        email_id = result.get("email_id")
        if not email_id:
            # Sometime it returns success but email_id is in response directly or missing
            return "classic_success"

        return str(email_id)

    @staticmethod
    def _response_json(response: requests.Response) -> dict[str, Any]:
        try:
            data = response.json()
        except ValueError:
            text = response.text[:500] if response.text else ""
            raise ValueError(f"Unisender returned non-JSON response: status={response.status_code} body={text}")

        if not isinstance(data, dict):
            raise ValueError(f"Unisender returned unexpected JSON response: {data}")

        return data


# Global singleton instance
unisender_service = UnisenderService()
