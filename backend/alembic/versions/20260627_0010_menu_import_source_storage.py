"""add storage links to menu import sources"""

from alembic import op
import sqlalchemy as sa


revision = "20260627_0010"
down_revision = "20260618_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("menu_import_sources", sa.Column("storage_key", sa.Text(), nullable=True))
    op.add_column("menu_import_sources", sa.Column("public_url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("menu_import_sources", "public_url")
    op.drop_column("menu_import_sources", "storage_key")
