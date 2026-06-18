from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class SubscriptionPlan(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "subscription_plans"

    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="USD")
    billing_period: Mapped[str] = mapped_column(String(16), nullable=False, default="month")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=100)

    max_venues: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    max_menus_per_venue: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    max_menu_items_per_menu: Mapped[int] = mapped_column(Integer, nullable=False, default=150)
    ai_imports_per_month: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    public_menu_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    translations_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    max_translation_languages: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    analytics_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    qr_customization_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    menu_design_customization_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    max_template_tier: Mapped[str] = mapped_column(String(32), nullable=False, default="basic")
    priority_support_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    subscriptions: Mapped[list["UserSubscription"]] = relationship(back_populates="plan")
    payments: Mapped[list["PaymentTransaction"]] = relationship(back_populates="plan")


class UserSubscription(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "user_subscriptions"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan_id: Mapped[str] = mapped_column(ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="trialing")
    unitpay_subscription_id: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    parent_payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    current_period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_payment_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_payment_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    user: Mapped["User"] = relationship(back_populates="subscription")
    plan: Mapped["SubscriptionPlan"] = relationship(back_populates="subscriptions")
    payments: Mapped[list["PaymentTransaction"]] = relationship(back_populates="subscription")
    events: Mapped[list["BillingEvent"]] = relationship(back_populates="subscription")


class PaymentTransaction(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payment_transactions"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    subscription_id: Mapped[str | None] = mapped_column(ForeignKey("user_subscriptions.id", ondelete="SET NULL"), index=True, nullable=True)
    plan_id: Mapped[str] = mapped_column(ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    unitpay_payment_id: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    unitpay_subscription_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="USD")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    checkout_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    receipt_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_test: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_request: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    raw_response: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    raw_callback: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user: Mapped["User"] = relationship(back_populates="payment_transactions")
    subscription: Mapped["UserSubscription | None"] = relationship(back_populates="payments")
    plan: Mapped["SubscriptionPlan"] = relationship(back_populates="payments")
    events: Mapped[list["BillingEvent"]] = relationship(back_populates="payment")


class BillingEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "billing_events"

    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    subscription_id: Mapped[str | None] = mapped_column(ForeignKey("user_subscriptions.id", ondelete="SET NULL"), index=True, nullable=True)
    payment_id: Mapped[str | None] = mapped_column(ForeignKey("payment_transactions.id", ondelete="SET NULL"), index=True, nullable=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user: Mapped["User | None"] = relationship(back_populates="billing_events")
    subscription: Mapped["UserSubscription | None"] = relationship(back_populates="events")
    payment: Mapped["PaymentTransaction | None"] = relationship(back_populates="events")
