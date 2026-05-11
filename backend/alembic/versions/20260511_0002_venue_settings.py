"""add venue settings"""

from alembic import op
import sqlalchemy as sa


revision = "20260511_0002"
down_revision = "20260511_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "venue_settings",
        sa.Column("venue_id", sa.String(length=36), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False, server_default="RUB"),
        sa.Column("wifi_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("wifi_ssid", sa.String(length=255), nullable=True),
        sa.Column("wifi_password", sa.String(length=255), nullable=True),
        sa.Column("design_template", sa.String(length=32), nullable=False, server_default="classic"),
        sa.Column("design_accent_color", sa.String(length=16), nullable=False, server_default="#6d67eb"),
        sa.Column("design_logo_url", sa.Text(), nullable=True),
        sa.Column("qr_style", sa.String(length=32), nullable=False, server_default="rounded"),
        sa.Column("qr_color", sa.String(length=16), nullable=False, server_default="#863bff"),
        sa.Column("qr_logo_url", sa.Text(), nullable=True),
        sa.Column("qr_has_frame", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("qr_frame_text", sa.String(length=64), nullable=False, server_default="СКАНИРУЙ МЕНЮ"),
        sa.Column("qr_frame_color", sa.String(length=16), nullable=False, server_default="#08060d"),
        sa.Column("public_menu_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name=op.f("fk_venue_settings_venue_id_venues"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_venue_settings")),
        sa.UniqueConstraint("venue_id", name=op.f("uq_venue_settings_venue_id")),
    )
    op.create_index(op.f("ix_venue_settings_venue_id"), "venue_settings", ["venue_id"], unique=True)

    op.execute(
        """
        INSERT INTO venue_settings (
            id,
            venue_id,
            currency,
            wifi_enabled,
            design_template,
            design_accent_color,
            qr_style,
            qr_color,
            qr_has_frame,
            qr_frame_text,
            qr_frame_color,
            public_menu_enabled,
            created_at,
            updated_at
        )
        SELECT
            venues.id,
            venues.id,
            'RUB',
            false,
            'classic',
            '#6d67eb',
            'rounded',
            '#863bff',
            true,
            'СКАНИРУЙ МЕНЮ',
            '#08060d',
            true,
            now(),
            now()
        FROM venues
        """
    )

    op.alter_column("venue_settings", "currency", server_default=None)
    op.alter_column("venue_settings", "wifi_enabled", server_default=None)
    op.alter_column("venue_settings", "design_template", server_default=None)
    op.alter_column("venue_settings", "design_accent_color", server_default=None)
    op.alter_column("venue_settings", "qr_style", server_default=None)
    op.alter_column("venue_settings", "qr_color", server_default=None)
    op.alter_column("venue_settings", "qr_has_frame", server_default=None)
    op.alter_column("venue_settings", "qr_frame_text", server_default=None)
    op.alter_column("venue_settings", "qr_frame_color", server_default=None)
    op.alter_column("venue_settings", "public_menu_enabled", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_venue_settings_venue_id"), table_name="venue_settings")
    op.drop_table("venue_settings")
