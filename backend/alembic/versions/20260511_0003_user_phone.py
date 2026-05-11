"""add user phone"""

from alembic import op
import sqlalchemy as sa


revision = "20260511_0003"
down_revision = "20260511_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "phone")
