"""add help requests"""

from alembic import op
import sqlalchemy as sa


revision = "20260518_0005"
down_revision = "20260511_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "help_requests",
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=64), nullable=False),
        sa.Column("messenger", sa.String(length=32), nullable=False),
        sa.Column("country_code", sa.String(length=16), nullable=False),
        sa.Column("country_name", sa.String(length=128), nullable=False),
        sa.Column("city", sa.String(length=128), nullable=False),
        sa.Column("restaurant_name", sa.String(length=255), nullable=False),
        sa.Column("upload_later", sa.Boolean(), nullable=False),
        sa.Column("menu_source", sa.String(length=32), nullable=False),
        sa.Column("menu_link", sa.Text(), nullable=True),
        sa.Column("menu_file_name", sa.String(length=255), nullable=True),
        sa.Column("menu_file_path", sa.Text(), nullable=True),
        sa.Column("menu_file_mime_type", sa.String(length=255), nullable=True),
        sa.Column("menu_file_size_bytes", sa.Integer(), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("telegram_delivered", sa.Boolean(), nullable=False),
        sa.Column("telegram_message_id", sa.BigInteger(), nullable=True),
        sa.Column("telegram_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_help_requests")),
    )
    op.create_index(op.f("ix_help_requests_created_at"), "help_requests", ["created_at"], unique=False)
    op.create_index(op.f("ix_help_requests_messenger"), "help_requests", ["messenger"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_help_requests_messenger"), table_name="help_requests")
    op.drop_index(op.f("ix_help_requests_created_at"), table_name="help_requests")
    op.drop_table("help_requests")
