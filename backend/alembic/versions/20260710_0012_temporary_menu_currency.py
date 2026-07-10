"""add temporary menu currency"""

from alembic import op
import sqlalchemy as sa


revision = "20260710_0012"
down_revision = "20260710_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "temporary_menu_imports",
        sa.Column("currency", sa.String(length=8), nullable=False, server_default="USD"),
    )
    op.alter_column("temporary_menu_imports", "currency", server_default=None)


def downgrade() -> None:
    op.drop_column("temporary_menu_imports", "currency")
