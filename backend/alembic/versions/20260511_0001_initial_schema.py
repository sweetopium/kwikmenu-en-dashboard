"""initial schema"""

from alembic import op
import sqlalchemy as sa


revision = "20260511_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "auth_accounts",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("provider_account_id", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_auth_accounts_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_auth_accounts")),
    )
    op.create_index(op.f("ix_auth_accounts_user_id"), "auth_accounts", ["user_id"], unique=False)
    op.create_unique_constraint("uq_auth_accounts_provider_provider_account", "auth_accounts", ["provider", "provider_account_id"])

    op.create_table(
        "sessions",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_sessions_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_sessions")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_sessions_token_hash")),
    )
    op.create_index(op.f("ix_sessions_token_hash"), "sessions", ["token_hash"], unique=True)
    op.create_index(op.f("ix_sessions_user_id"), "sessions", ["user_id"], unique=False)

    op.create_table(
        "venues",
        sa.Column("owner_user_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=64), nullable=True),
        sa.Column("country", sa.String(length=64), nullable=True),
        sa.Column("city", sa.String(length=128), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], name=op.f("fk_venues_owner_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_venues")),
    )
    op.create_index(op.f("ix_venues_owner_user_id"), "venues", ["owner_user_id"], unique=False)

    op.create_table(
        "menus",
        sa.Column("venue_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name=op.f("fk_menus_venue_id_venues"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_menus")),
    )
    op.create_index(op.f("ix_menus_slug"), "menus", ["slug"], unique=False)
    op.create_index(op.f("ix_menus_venue_id"), "menus", ["venue_id"], unique=False)

    op.create_table(
        "menu_import_jobs",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("venue_id", sa.String(length=36), nullable=True),
        sa.Column("menu_id", sa.String(length=36), nullable=True),
        sa.Column("upload_dir", sa.Text(), nullable=False),
        sa.Column("menu_source", sa.String(length=32), nullable=False),
        sa.Column("menu_link", sa.Text(), nullable=True),
        sa.Column("context", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("warnings", sa.JSON(), nullable=False),
        sa.Column("category_count", sa.Integer(), nullable=True),
        sa.Column("item_count", sa.Integer(), nullable=True),
        sa.Column("document_count", sa.Integer(), nullable=True),
        sa.Column("used_fallback", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["menu_id"], ["menus.id"], name=op.f("fk_menu_import_jobs_menu_id_menus"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_menu_import_jobs_user_id_users"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name=op.f("fk_menu_import_jobs_venue_id_venues"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_menu_import_jobs")),
    )
    op.create_index(op.f("ix_menu_import_jobs_menu_id"), "menu_import_jobs", ["menu_id"], unique=False)
    op.create_index(op.f("ix_menu_import_jobs_user_id"), "menu_import_jobs", ["user_id"], unique=False)
    op.create_index(op.f("ix_menu_import_jobs_venue_id"), "menu_import_jobs", ["venue_id"], unique=False)

    op.create_table(
        "menu_import_sources",
        sa.Column("job_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("mime_type", sa.String(length=255), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["menu_import_jobs.id"], name=op.f("fk_menu_import_sources_job_id_menu_import_jobs"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_menu_import_sources")),
    )
    op.create_index(op.f("ix_menu_import_sources_job_id"), "menu_import_sources", ["job_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_menu_import_sources_job_id"), table_name="menu_import_sources")
    op.drop_table("menu_import_sources")
    op.drop_index(op.f("ix_menu_import_jobs_venue_id"), table_name="menu_import_jobs")
    op.drop_index(op.f("ix_menu_import_jobs_user_id"), table_name="menu_import_jobs")
    op.drop_index(op.f("ix_menu_import_jobs_menu_id"), table_name="menu_import_jobs")
    op.drop_table("menu_import_jobs")
    op.drop_index(op.f("ix_menus_venue_id"), table_name="menus")
    op.drop_index(op.f("ix_menus_slug"), table_name="menus")
    op.drop_table("menus")
    op.drop_index(op.f("ix_venues_owner_user_id"), table_name="venues")
    op.drop_table("venues")
    op.drop_index(op.f("ix_sessions_user_id"), table_name="sessions")
    op.drop_index(op.f("ix_sessions_token_hash"), table_name="sessions")
    op.drop_table("sessions")
    op.drop_index(op.f("ix_auth_accounts_user_id"), table_name="auth_accounts")
    op.drop_table("auth_accounts")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
