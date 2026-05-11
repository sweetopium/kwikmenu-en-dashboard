"""add public menu events"""

from alembic import op
import sqlalchemy as sa


revision = "20260511_0004"
down_revision = "20260511_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "public_menu_events",
        sa.Column("venue_id", sa.String(length=36), nullable=False),
        sa.Column("menu_id", sa.String(length=36), nullable=True),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("visitor_id", sa.String(length=255), nullable=False),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("referer", sa.Text(), nullable=True),
        sa.Column("accept_language", sa.String(length=255), nullable=True),
        sa.Column("request_path", sa.Text(), nullable=False),
        sa.Column("query_string", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["menu_id"], ["menus.id"], name=op.f("fk_public_menu_events_menu_id_menus"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name=op.f("fk_public_menu_events_venue_id_venues"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_public_menu_events")),
    )
    op.create_index(op.f("ix_public_menu_events_menu_id"), "public_menu_events", ["menu_id"], unique=False)
    op.create_index(op.f("ix_public_menu_events_venue_id"), "public_menu_events", ["venue_id"], unique=False)
    op.create_index(op.f("ix_public_menu_events_visitor_id"), "public_menu_events", ["visitor_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_public_menu_events_visitor_id"), table_name="public_menu_events")
    op.drop_index(op.f("ix_public_menu_events_venue_id"), table_name="public_menu_events")
    op.drop_index(op.f("ix_public_menu_events_menu_id"), table_name="public_menu_events")
    op.drop_table("public_menu_events")
