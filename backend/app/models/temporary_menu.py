from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class TemporaryMenuImport(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "temporary_menu_imports"

    upload_dir: Mapped[str] = mapped_column(Text, nullable=False)
    menu_source: Mapped[str] = mapped_column(String(32), nullable=False)
    menu_link: Mapped[str | None] = mapped_column(Text, nullable=True)
    restaurant_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    country: Mapped[str | None] = mapped_column(String(64), nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    combined_pdf_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="queued", nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    warnings: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    category_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    item_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    document_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    used_fallback: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    sources: Mapped[list["TemporaryMenuImportSource"]] = relationship(
        back_populates="job",
        cascade="all, delete-orphan",
    )


class TemporaryMenuImportSource(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "temporary_menu_import_sources"

    job_id: Mapped[str] = mapped_column(ForeignKey("temporary_menu_imports.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    storage_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    public_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_generated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    job: Mapped[TemporaryMenuImport] = relationship(back_populates="sources")
