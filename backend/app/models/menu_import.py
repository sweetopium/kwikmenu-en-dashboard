from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MenuImportJob(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "menu_import_jobs"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    venue_id: Mapped[str | None] = mapped_column(ForeignKey("venues.id", ondelete="SET NULL"), index=True, nullable=True)
    menu_id: Mapped[str | None] = mapped_column(ForeignKey("menus.id", ondelete="SET NULL"), index=True, nullable=True)
    upload_dir: Mapped[str] = mapped_column(Text, nullable=False)
    menu_source: Mapped[str] = mapped_column(String(32), nullable=False)
    menu_link: Mapped[str | None] = mapped_column(Text, nullable=True)
    context: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="accepted", nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    warnings: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    category_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    item_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    document_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    used_fallback: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    sources: Mapped[list["MenuImportSource"]] = relationship(back_populates="job", cascade="all, delete-orphan")
    venue: Mapped["Venue | None"] = relationship(back_populates="import_jobs")
    menu: Mapped["Menu | None"] = relationship(back_populates="import_jobs")


class MenuImportSource(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "menu_import_sources"

    job_id: Mapped[str] = mapped_column(ForeignKey("menu_import_jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    storage_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    public_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    job: Mapped[MenuImportJob] = relationship(back_populates="sources")
