from __future__ import annotations

from sqlalchemy import BigInteger, Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class HelpRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "help_requests"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(64), nullable=False)
    messenger: Mapped[str] = mapped_column(String(32), nullable=False)
    country_code: Mapped[str] = mapped_column(String(16), nullable=False)
    country_name: Mapped[str] = mapped_column(String(128), nullable=False)
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    restaurant_name: Mapped[str] = mapped_column(String(255), nullable=False)

    upload_later: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    menu_source: Mapped[str] = mapped_column(String(32), nullable=False)
    menu_link: Mapped[str | None] = mapped_column(Text, nullable=True)
    menu_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    menu_file_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    menu_file_mime_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    menu_file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)

    telegram_delivered: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    telegram_message_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    telegram_error: Mapped[str | None] = mapped_column(Text, nullable=True)
