"""add branded menu design configuration

Revision ID: 20260717_0013
Revises: 20260710_0012
"""

from alembic import op
import sqlalchemy as sa


revision = "20260717_0013"
down_revision = "20260710_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("venues", sa.Column("website_url", sa.String(length=512), nullable=True))
    op.add_column("venues", sa.Column("address_line", sa.String(length=512), nullable=True))
    op.add_column("venues", sa.Column("business_hours_text", sa.String(length=255), nullable=True))
    op.add_column(
        "venue_settings",
        sa.Column("design_config", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )


def downgrade() -> None:
    op.drop_column("venue_settings", "design_config")
    op.drop_column("venues", "business_hours_text")
    op.drop_column("venues", "address_line")
    op.drop_column("venues", "website_url")
