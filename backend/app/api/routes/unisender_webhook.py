from __future__ import annotations

import logging
from typing import Any
from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.email_campaign import ScheduledEmail

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


def _process_single_event(db: Session, event_data: dict[str, Any]) -> None:
    """
    Helper to process a single event from Unisender Go callback.
    """
    event_type = event_data.get("event")
    email_addr = event_data.get("email")
    unisender_msg_id = event_data.get("email_id")
    metadata = event_data.get("metadata") or {}
    scheduled_email_id = metadata.get("scheduled_email_id")

    logger.info(
        "Received Unisender webhook event: type=%s email=%s msg_id=%s scheduled_email_id=%s",
        event_type, email_addr, unisender_msg_id, scheduled_email_id
    )

    scheduled_email = None

    # 1. Try to find by custom metadata ID
    if scheduled_email_id:
        scheduled_email = db.query(ScheduledEmail).filter(ScheduledEmail.id == scheduled_email_id).first()

    # 2. Fall back to finding by Unisender external message ID
    if not scheduled_email and unisender_msg_id:
        scheduled_email = db.query(ScheduledEmail).filter(ScheduledEmail.unisender_message_id == str(unisender_msg_id)).first()

    if not scheduled_email:
        logger.warning(
            "Could not match Unisender event to any ScheduledEmail. email=%s msg_id=%s scheduled_email_id=%s",
            email_addr, unisender_msg_id, scheduled_email_id
        )
        return

    # Normalize event type to our delivery_status enum values
    # events: delivered, opened, clicked, soft_bounced, hard_bounced, spam, unsubscribed
    normalized_status = "none"
    event_str = str(event_type).lower().strip()

    if event_str == "delivered":
        normalized_status = "delivered"
    elif event_str in ("opened", "clicked", "read"):
        normalized_status = "opened"
    elif event_str in ("soft_bounced", "hard_bounced", "bounced"):
        normalized_status = "bounce"
    elif event_str in ("spam", "spam_complaint"):
        normalized_status = "spam"
    elif event_str == "unsubscribed":
        normalized_status = "unsubscribed"

    # Update only if state changes
    if normalized_status != "none" and scheduled_email.delivery_status != normalized_status:
        scheduled_email.delivery_status = normalized_status
        db.add(scheduled_email)
        logger.info("Updated ScheduledEmail id=%s delivery_status=%s", scheduled_email.id, normalized_status)


@router.get("/unisender", status_code=status.HTTP_200_OK)
def verify_unisender_webhook() -> dict[str, str]:
    """
    Verification endpoint for Unisender Go callback setup.
    """
    return {"status": "ok"}


@router.post("/unisender", status_code=status.HTTP_200_OK)
async def unisender_webhook(
    request: Request,
    db: Session = Depends(get_db),
) -> Response:
    """
    Public webhook receiver endpoint for Unisender Go callbacks.
    Handles single events and event arrays.
    """
    try:
        payload = await request.json()
    except Exception:
        logger.warning("Received invalid non-JSON webhook payload.")
        return Response(status_code=status.HTTP_400_BAD_REQUEST, content="Invalid JSON")

    # Unisender can send a batch (list) or a single event (dict)
    events = []
    if isinstance(payload, list):
        events = payload
    elif isinstance(payload, dict):
        # Unisender Go webhook can sometimes wrap the event inside a "data" envelope
        if "data" in payload and isinstance(payload["data"], dict):
            # inject event name from top level if needed
            single_event = payload["data"]
            if "event" not in single_event and "event" in payload:
                single_event["event"] = payload["event"]
            events = [single_event]
        else:
            events = [payload]
    else:
        logger.warning("Unsupported webhook payload type: %s", type(payload))
        return Response(status_code=status.HTTP_400_BAD_REQUEST, content="Unsupported payload type")

    # Process each event in a transaction
    for event in events:
        try:
            _process_single_event(db, event)
        except Exception:
            logger.exception("Error processing single webhook event: %s", event)

    db.commit()

    # Unisender Go requires a fast 200 OK response to avoid retries
    return Response(status_code=status.HTTP_200_OK, content="OK")
