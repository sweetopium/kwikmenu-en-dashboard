from __future__ import annotations

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPrimaryKeyMixin


class PublicMenuEvent(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "public_menu_events"

    venue_id: Mapped[str] = mapped_column(ForeignKey("venues.id", ondelete="CASCADE"), index=True, nullable=False)
    menu_id: Mapped[str | None] = mapped_column(ForeignKey("menus.id", ondelete="SET NULL"), index=True, nullable=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, default="venue_public_view")
    visitor_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    referer: Mapped[str | None] = mapped_column(Text, nullable=True)
    accept_language: Mapped[str | None] = mapped_column(String(255), nullable=True)
    request_path: Mapped[str] = mapped_column(Text, nullable=False)
    query_string: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)

    venue: Mapped["Venue"] = relationship()
    menu: Mapped["Menu | None"] = relationship()


class ProductEvent(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "product_events"

    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    session_id: Mapped[str | None] = mapped_column(ForeignKey("sessions.id", ondelete="SET NULL"), index=True, nullable=True)
    venue_id: Mapped[str | None] = mapped_column(ForeignKey("venues.id", ondelete="SET NULL"), index=True, nullable=True)
    menu_id: Mapped[str | None] = mapped_column(ForeignKey("menus.id", ondelete="SET NULL"), index=True, nullable=True)
    event_name: Mapped[str] = mapped_column(String(96), index=True, nullable=False)
    event_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="dashboard")
    page: Mapped[str | None] = mapped_column(Text, nullable=True)
    properties: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    referer: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)

    user: Mapped["User | None"] = relationship()
    session: Mapped["SessionModel | None"] = relationship()
    venue: Mapped["Venue | None"] = relationship()
    menu: Mapped["Menu | None"] = relationship()
