from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.auth import User
from app.models.venue import Venue
from app.models.menu import Menu
from app.models.email_campaign import EmailCampaignStep, ScheduledEmail
from app.services.unisender import unisender_service

logger = logging.getLogger(__name__)


class EmailCampaignService:
    def schedule_campaign_for_user(self, db: Session, user: User) -> None:
        """
        Schedules all active campaign steps for a registered user.
        Enqueues Celery tasks with an ETA matching the delay.
        """
        # If user has no email or is virtual placeholders, don't schedule
        if not user.email or user.email.endswith("@virtual.kwikmenu.ru"):
            logger.info("Skipping campaign scheduling for user_id=%s (virtual or missing email)", user.id)
            return

        active_steps = (
            db.query(EmailCampaignStep)
            .filter(EmailCampaignStep.is_active == True)
            .order_by(EmailCampaignStep.step_number.asc())
            .all()
        )

        if not active_steps:
            logger.info("No active email campaign steps configured.")
            return

        # Cancel any existing pending emails just in case
        self.cancel_pending_emails_for_user(db, user.id)

        now_time = datetime.now(timezone.utc)
        settings = get_settings()

        for step in active_steps:
            scheduled_at = now_time + timedelta(hours=step.delay_hours)
            
            scheduled_email = ScheduledEmail(
                user_id=user.id,
                step_id=step.id,
                scheduled_at=scheduled_at,
                status="pending",
                delivery_status="none",
            )
            db.add(scheduled_email)
            db.flush()

            # Enqueue Celery task asynchronously with ETA
            # Dynamic import to avoid circular dependencies
            from app.tasks import send_scheduled_email_task
            send_scheduled_email_task.apply_async(
                args=[scheduled_email.id],
                eta=scheduled_at,
            )
            logger.info(
                "Scheduled email step=%s for user=%s at %s",
                step.name, user.email, scheduled_at
            )

    def evaluate_condition(self, db: Session, user: User, condition_rule: str) -> bool:
        """
        Evaluates a campaign condition. Returns True if condition matches (email should be sent),
        False otherwise (email should be skipped).
        """
        rule = condition_rule.strip().lower()
        if rule == "always":
            return True

        if rule == "no_venue":
            # Check if user has no venues at all
            venue_count = db.query(Venue).filter(Venue.owner_user_id == user.id).count()
            return venue_count == 0

        if rule == "no_menu":
            # Check if user has no menus created
            venues = db.query(Venue).filter(Venue.owner_user_id == user.id).all()
            if not venues:
                return True
            venue_ids = [v.id for v in venues]
            menu_count = db.query(Menu).filter(Menu.venue_id.in_(venue_ids)).count()
            return menu_count == 0

        # Custom rules can be added here
        logger.warning("Unknown condition rule: %s. Defaulting to True.", condition_rule)
        return True

    def send_scheduled_email(self, db: Session, scheduled_email_id: str) -> None:
        """
        Executes sending of a single scheduled email. Evaluates triggers,
        checks conditions, renders templates, and invokes Unisender API.
        """
        scheduled_email = (
            db.query(ScheduledEmail)
            .filter(ScheduledEmail.id == scheduled_email_id)
            .first()
        )

        if not scheduled_email:
            logger.warning("Scheduled email not found: %s", scheduled_email_id)
            return

        if scheduled_email.status != "pending":
            logger.info("Scheduled email %s has status=%s. Skipping.", scheduled_email_id, scheduled_email.status)
            return

        user = db.query(User).filter(User.id == scheduled_email.user_id).first()
        if not user or not user.is_active:
            scheduled_email.status = "cancelled"
            scheduled_email.error_message = "User not found or inactive."
            db.add(scheduled_email)
            db.commit()
            logger.info("Cancelled email %s: user not found or inactive.", scheduled_email_id)
            return

        step = scheduled_email.step
        if not step or not step.is_active:
            scheduled_email.status = "skipped"
            scheduled_email.error_message = "Campaign step is inactive or deleted."
            db.add(scheduled_email)
            db.commit()
            logger.info("Skipped email %s: step is inactive/deleted.", scheduled_email_id)
            return

        # Check sending condition dynamically
        should_send = self.evaluate_condition(db, user, step.condition_rule)
        if not should_send:
            scheduled_email.status = "skipped"
            db.add(scheduled_email)
            db.commit()
            logger.info("Skipped email %s: condition %s not met.", scheduled_email_id, step.condition_rule)
            return

        # Prepare user template context
        settings = get_settings()
        user_context = {
            "name": user.name or "",
            "email": user.email,
            "dashboard_url": settings.menu_import_frontend_origin.rstrip("/") or "https://app.kwikme.nu",
        }

        try:
            unisender_msg_id = unisender_service.send_email(
                to_email=user.email,
                subject=step.subject,
                body_html=step.body_html,
                scheduled_email_id=scheduled_email.id,
                user_context=user_context,
            )
            scheduled_email.status = "sent"
            scheduled_email.sent_at = datetime.now(timezone.utc)
            scheduled_email.unisender_message_id = unisender_msg_id
            logger.info("Successfully sent email id=%s to=%s msg_id=%s", scheduled_email.id, user.email, unisender_msg_id)
        except Exception as exc:
            scheduled_email.status = "failed"
            scheduled_email.error_message = str(exc)
            logger.exception("Failed to send scheduled email id=%s to=%s", scheduled_email.id, user.email)

        db.add(scheduled_email)
        db.commit()

    def cancel_pending_emails_for_user(self, db: Session, user_id: str) -> None:
        """
        Cancels all pending scheduled campaign emails for a specific user.
        """
        db.query(ScheduledEmail).filter(
            ScheduledEmail.user_id == user_id,
            ScheduledEmail.status == "pending",
        ).update(
            {
                ScheduledEmail.status: "cancelled",
                ScheduledEmail.error_message: "Cancelled by service trigger update."
            },
            synchronize_session=False
        )
        db.commit()
        logger.info("Cancelled all pending scheduled emails for user_id=%s", user_id)


# Global singleton instance
email_campaign_service = EmailCampaignService()
