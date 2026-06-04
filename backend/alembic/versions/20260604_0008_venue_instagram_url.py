"""add venue instagram url"""

from alembic import op
import sqlalchemy as sa


revision = "20260604_0008"
down_revision = "20260520_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("venues", sa.Column("instagram_url", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("venues", "instagram_url")
