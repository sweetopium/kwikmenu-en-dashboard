from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Venue(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "venues"

    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    country: Mapped[str | None] = mapped_column(String(64), nullable=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    menus: Mapped[list["Menu"]] = relationship(back_populates="venue", cascade="all, delete-orphan")
    import_jobs: Mapped[list["MenuImportJob"]] = relationship(back_populates="venue")
    settings: Mapped["VenueSettings | None"] = relationship(
        back_populates="venue",
        cascade="all, delete-orphan",
        uselist=False,
    )


class VenueSettings(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "venue_settings"

    venue_id: Mapped[str] = mapped_column(ForeignKey("venues.id", ondelete="CASCADE"), unique=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="RUB")

    wifi_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    wifi_ssid: Mapped[str | None] = mapped_column(String(255), nullable=True)
    wifi_password: Mapped[str | None] = mapped_column(String(255), nullable=True)

    design_template: Mapped[str] = mapped_column(String(32), nullable=False, default="classic")
    design_accent_color: Mapped[str] = mapped_column(String(16), nullable=False, default="#6d67eb")
    design_logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    qr_style: Mapped[str] = mapped_column(String(32), nullable=False, default="rounded")
    qr_color: Mapped[str] = mapped_column(String(16), nullable=False, default="#863bff")
    qr_logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    qr_has_frame: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    qr_frame_text: Mapped[str] = mapped_column(String(64), nullable=False, default="СКАНИРУЙ МЕНЮ")
    qr_frame_color: Mapped[str] = mapped_column(String(16), nullable=False, default="#08060d")
    public_menu_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    venue: Mapped["Venue"] = relationship(back_populates="settings")
