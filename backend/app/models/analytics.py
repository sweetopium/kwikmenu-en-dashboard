from __future__ import annotations

from sqlalchemy import DateTime, ForeignKey, String, Text
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
