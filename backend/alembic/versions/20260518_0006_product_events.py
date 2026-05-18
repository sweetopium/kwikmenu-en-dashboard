"""add product events"""

from alembic import op
import sqlalchemy as sa


revision = "20260518_0006"
down_revision = "20260518_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "product_events",
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("session_id", sa.String(length=36), nullable=True),
        sa.Column("venue_id", sa.String(length=36), nullable=True),
        sa.Column("menu_id", sa.String(length=36), nullable=True),
        sa.Column("event_name", sa.String(length=96), nullable=False),
        sa.Column("event_version", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("page", sa.Text(), nullable=True),
        sa.Column("properties", sa.JSON(), nullable=False),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("referer", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["menu_id"], ["menus.id"], name=op.f("fk_product_events_menu_id_menus"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], name=op.f("fk_product_events_session_id_sessions"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_product_events_user_id_users"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name=op.f("fk_product_events_venue_id_venues"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_events")),
    )
    op.create_index(op.f("ix_product_events_created_at"), "product_events", ["created_at"], unique=False)
    op.create_index(op.f("ix_product_events_event_name"), "product_events", ["event_name"], unique=False)
    op.create_index(op.f("ix_product_events_menu_id"), "product_events", ["menu_id"], unique=False)
    op.create_index(op.f("ix_product_events_session_id"), "product_events", ["session_id"], unique=False)
    op.create_index(op.f("ix_product_events_user_id"), "product_events", ["user_id"], unique=False)
    op.create_index(op.f("ix_product_events_venue_id"), "product_events", ["venue_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_product_events_venue_id"), table_name="product_events")
    op.drop_index(op.f("ix_product_events_user_id"), table_name="product_events")
    op.drop_index(op.f("ix_product_events_session_id"), table_name="product_events")
    op.drop_index(op.f("ix_product_events_menu_id"), table_name="product_events")
    op.drop_index(op.f("ix_product_events_event_name"), table_name="product_events")
    op.drop_index(op.f("ix_product_events_created_at"), table_name="product_events")
    op.drop_table("product_events")
