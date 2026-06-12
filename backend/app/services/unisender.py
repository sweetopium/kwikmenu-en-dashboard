from __future__ import annotations

import logging
import requests

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
        }
        payload = {
            "message": {
                "recipients": [
                    {
                        "email": to_email,
                        "metadata": {
                            "scheduled_email_id": scheduled_email_id
                        }
                    }
                ],
                "body": {
                    "html": body_html
                },
                "subject": subject,
                "from_email": settings.unisender_sender_email,
                "from_name": settings.unisender_sender_name,
            }
        }

        logger.info("Sending transactional email via Unisender Go to %s", to_email)
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        response_json = response.json()

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
        response_json = response.json()

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


# Global singleton instance
unisender_service = UnisenderService()
