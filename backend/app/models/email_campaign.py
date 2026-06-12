from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class EmailCampaignStep(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "email_campaign_steps"

    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    delay_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body_html: Mapped[str] = mapped_column(Text, nullable=False)
    condition_rule: Mapped[str] = mapped_column(String(64), nullable=False, default="always")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    scheduled_emails: Mapped[list[ScheduledEmail]] = relationship(
        back_populates="step",
        cascade="all, delete-orphan",
    )


class ScheduledEmail(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "scheduled_emails"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    step_id: Mapped[str | None] = mapped_column(ForeignKey("email_campaign_steps.id", ondelete="SET NULL"), index=True, nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")  # pending, sent, failed, skipped, cancelled
    delivery_status: Mapped[str] = mapped_column(String(32), nullable=False, default="none")  # none, delivered, opened, bounced, spam
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    unisender_message_id: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)

    step: Mapped[EmailCampaignStep | None] = relationship(back_populates="scheduled_emails")
