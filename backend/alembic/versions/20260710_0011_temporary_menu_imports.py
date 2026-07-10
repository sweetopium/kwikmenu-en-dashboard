"""add temporary menu imports"""

from alembic import op
import sqlalchemy as sa


revision = "20260710_0011"
down_revision = "20260627_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "temporary_menu_imports",
        sa.Column("upload_dir", sa.Text(), nullable=False),
        sa.Column("menu_source", sa.String(length=32), nullable=False),
        sa.Column("menu_link", sa.Text(), nullable=True),
        sa.Column("restaurant_name", sa.String(length=255), nullable=True),
        sa.Column("contact_phone", sa.String(length=64), nullable=True),
        sa.Column("city", sa.String(length=128), nullable=True),
        sa.Column("country", sa.String(length=64), nullable=True),
        sa.Column("combined_pdf_name", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("warnings", sa.JSON(), nullable=False),
        sa.Column("category_count", sa.Integer(), nullable=True),
        sa.Column("item_count", sa.Integer(), nullable=True),
        sa.Column("document_count", sa.Integer(), nullable=True),
        sa.Column("used_fallback", sa.Boolean(), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_temporary_menu_imports")),
    )
    op.create_table(
        "temporary_menu_import_sources",
        sa.Column("job_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("mime_type", sa.String(length=255), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("storage_key", sa.Text(), nullable=True),
        sa.Column("public_url", sa.Text(), nullable=True),
        sa.Column("is_generated", sa.Boolean(), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["temporary_menu_imports.id"], name=op.f("fk_temporary_menu_import_sources_job_id_temporary_menu_imports"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_temporary_menu_import_sources")),
    )
    op.create_index(op.f("ix_temporary_menu_import_sources_job_id"), "temporary_menu_import_sources", ["job_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_temporary_menu_import_sources_job_id"), table_name="temporary_menu_import_sources")
    op.drop_table("temporary_menu_import_sources")
    op.drop_table("temporary_menu_imports")
