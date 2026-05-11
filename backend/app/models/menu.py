from __future__ import annotations

from sqlalchemy import ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Menu(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "menus"

    venue_id: Mapped[str] = mapped_column(ForeignKey("venues.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)

    venue: Mapped["Venue"] = relationship(back_populates="menus")
    import_jobs: Mapped[list["MenuImportJob"]] = relationship(back_populates="menu")
