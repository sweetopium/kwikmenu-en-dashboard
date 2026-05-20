"""billing and subscriptions"""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from alembic import op
import sqlalchemy as sa


revision = "20260520_0007"
down_revision = "20260518_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "subscription_plans",
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("billing_period", sa.String(length=16), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_public", sa.Boolean(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("max_venues", sa.Integer(), nullable=False),
        sa.Column("max_menus_per_venue", sa.Integer(), nullable=False),
        sa.Column("max_menu_items_per_menu", sa.Integer(), nullable=False),
        sa.Column("ai_imports_per_month", sa.Integer(), nullable=False),
        sa.Column("public_menu_enabled", sa.Boolean(), nullable=False),
        sa.Column("translations_enabled", sa.Boolean(), nullable=False),
        sa.Column("max_translation_languages", sa.Integer(), nullable=False),
        sa.Column("analytics_enabled", sa.Boolean(), nullable=False),
        sa.Column("qr_customization_enabled", sa.Boolean(), nullable=False),
        sa.Column("menu_design_customization_enabled", sa.Boolean(), nullable=False),
        sa.Column("max_template_tier", sa.String(length=32), nullable=False),
        sa.Column("priority_support_enabled", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_subscription_plans")),
    )
    op.create_index(op.f("ix_subscription_plans_code"), "subscription_plans", ["code"], unique=True)

    op.create_table(
        "user_subscriptions",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("plan_id", sa.String(length=36), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("unitpay_subscription_id", sa.String(length=64), nullable=True),
        sa.Column("parent_payment_id", sa.String(length=64), nullable=True),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancel_at_period_end", sa.Boolean(), nullable=False),
        sa.Column("canceled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_payment_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_payment_status", sa.String(length=32), nullable=True),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["plan_id"], ["subscription_plans.id"], name=op.f("fk_user_subscriptions_plan_id_subscription_plans"), ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_subscriptions_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_subscriptions")),
        sa.UniqueConstraint("unitpay_subscription_id", name=op.f("uq_user_subscriptions_unitpay_subscription_id")),
        sa.UniqueConstraint("user_id", name=op.f("uq_user_subscriptions_user_id")),
    )

    op.create_table(
        "payment_transactions",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("subscription_id", sa.String(length=36), nullable=True),
        sa.Column("plan_id", sa.String(length=36), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("unitpay_payment_id", sa.String(length=64), nullable=True),
        sa.Column("unitpay_subscription_id", sa.String(length=64), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("checkout_url", sa.Text(), nullable=True),
        sa.Column("receipt_url", sa.Text(), nullable=True),
        sa.Column("status_url", sa.Text(), nullable=True),
        sa.Column("is_test", sa.Boolean(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("raw_request", sa.JSON(), nullable=True),
        sa.Column("raw_response", sa.JSON(), nullable=True),
        sa.Column("raw_callback", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["plan_id"], ["subscription_plans.id"], name=op.f("fk_payment_transactions_plan_id_subscription_plans"), ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["subscription_id"], ["user_subscriptions.id"], name=op.f("fk_payment_transactions_subscription_id_user_subscriptions"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_payment_transactions_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_payment_transactions")),
        sa.UniqueConstraint("unitpay_payment_id", name=op.f("uq_payment_transactions_unitpay_payment_id")),
    )
    op.create_index(op.f("ix_payment_transactions_subscription_id"), "payment_transactions", ["subscription_id"], unique=False)
    op.create_index(op.f("ix_payment_transactions_user_id"), "payment_transactions", ["user_id"], unique=False)

    op.create_table(
        "billing_events",
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("subscription_id", sa.String(length=36), nullable=True),
        sa.Column("payment_id", sa.String(length=36), nullable=True),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["payment_id"], ["payment_transactions.id"], name=op.f("fk_billing_events_payment_id_payment_transactions"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["subscription_id"], ["user_subscriptions.id"], name=op.f("fk_billing_events_subscription_id_user_subscriptions"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_billing_events_user_id_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_billing_events")),
    )
    op.create_index(op.f("ix_billing_events_payment_id"), "billing_events", ["payment_id"], unique=False)
    op.create_index(op.f("ix_billing_events_subscription_id"), "billing_events", ["subscription_id"], unique=False)
    op.create_index(op.f("ix_billing_events_user_id"), "billing_events", ["user_id"], unique=False)

    now = datetime.now(timezone.utc)
    plan_rows = [
        {
            "id": "plan-starter",
            "code": "starter",
            "name": "Starter",
            "description": "1 заведение для небольшого меню с базовым дизайном.",
            "price_amount": 990.00,
            "currency": "RUB",
            "billing_period": "month",
            "is_active": True,
            "is_public": True,
            "sort_order": 10,
            "max_venues": 1,
            "max_menus_per_venue": 3,
            "max_menu_items_per_menu": 150,
            "ai_imports_per_month": 5,
            "public_menu_enabled": True,
            "translations_enabled": False,
            "max_translation_languages": 0,
            "analytics_enabled": True,
            "qr_customization_enabled": False,
            "menu_design_customization_enabled": False,
            "max_template_tier": "basic",
            "priority_support_enabled": False,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": "plan-business",
            "code": "business",
            "name": "Business",
            "description": "До 3 заведений, расширенный шаблон и переводы.",
            "price_amount": 2490.00,
            "currency": "RUB",
            "billing_period": "month",
            "is_active": True,
            "is_public": True,
            "sort_order": 20,
            "max_venues": 3,
            "max_menus_per_venue": 10,
            "max_menu_items_per_menu": 500,
            "ai_imports_per_month": 30,
            "public_menu_enabled": True,
            "translations_enabled": True,
            "max_translation_languages": 3,
            "analytics_enabled": True,
            "qr_customization_enabled": True,
            "menu_design_customization_enabled": True,
            "max_template_tier": "extended",
            "priority_support_enabled": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": "plan-pro",
            "code": "pro",
            "name": "Pro",
            "description": "Старший тариф для сети заведений и premium-шаблона.",
            "price_amount": 5490.00,
            "currency": "RUB",
            "billing_period": "month",
            "is_active": True,
            "is_public": True,
            "sort_order": 30,
            "max_venues": 10,
            "max_menus_per_venue": 50,
            "max_menu_items_per_menu": 2000,
            "ai_imports_per_month": 150,
            "public_menu_enabled": True,
            "translations_enabled": True,
            "max_translation_languages": 10,
            "analytics_enabled": True,
            "qr_customization_enabled": True,
            "menu_design_customization_enabled": True,
            "max_template_tier": "premium",
            "priority_support_enabled": True,
            "created_at": now,
            "updated_at": now,
        },
    ]
    plans_table = sa.table(
        "subscription_plans",
        sa.column("id", sa.String),
        sa.column("code", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
        sa.column("price_amount", sa.Numeric),
        sa.column("currency", sa.String),
        sa.column("billing_period", sa.String),
        sa.column("is_active", sa.Boolean),
        sa.column("is_public", sa.Boolean),
        sa.column("sort_order", sa.Integer),
        sa.column("max_venues", sa.Integer),
        sa.column("max_menus_per_venue", sa.Integer),
        sa.column("max_menu_items_per_menu", sa.Integer),
        sa.column("ai_imports_per_month", sa.Integer),
        sa.column("public_menu_enabled", sa.Boolean),
        sa.column("translations_enabled", sa.Boolean),
        sa.column("max_translation_languages", sa.Integer),
        sa.column("analytics_enabled", sa.Boolean),
        sa.column("qr_customization_enabled", sa.Boolean),
        sa.column("menu_design_customization_enabled", sa.Boolean),
        sa.column("max_template_tier", sa.String),
        sa.column("priority_support_enabled", sa.Boolean),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    op.bulk_insert(plans_table, plan_rows)

    connection = op.get_bind()
    users = list(connection.execute(sa.text("SELECT id FROM users")))
    subscriptions_table = sa.table(
        "user_subscriptions",
        sa.column("id", sa.String),
        sa.column("user_id", sa.String),
        sa.column("plan_id", sa.String),
        sa.column("status", sa.String),
        sa.column("current_period_start", sa.DateTime(timezone=True)),
        sa.column("current_period_end", sa.DateTime(timezone=True)),
        sa.column("trial_ends_at", sa.DateTime(timezone=True)),
        sa.column("cancel_at_period_end", sa.Boolean),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    trial_end = now + timedelta(days=14)
    if users:
        op.bulk_insert(
            subscriptions_table,
            [
                {
                    "id": str(uuid4()),
                    "user_id": row.id,
                    "plan_id": "plan-starter",
                    "status": "trialing",
                    "current_period_start": now,
                    "current_period_end": trial_end,
                    "trial_ends_at": trial_end,
                    "cancel_at_period_end": False,
                    "created_at": now,
                    "updated_at": now,
                }
                for row in users
            ],
        )


def downgrade() -> None:
    op.drop_index(op.f("ix_billing_events_user_id"), table_name="billing_events")
    op.drop_index(op.f("ix_billing_events_subscription_id"), table_name="billing_events")
    op.drop_index(op.f("ix_billing_events_payment_id"), table_name="billing_events")
    op.drop_table("billing_events")
    op.drop_index(op.f("ix_payment_transactions_user_id"), table_name="payment_transactions")
    op.drop_index(op.f("ix_payment_transactions_subscription_id"), table_name="payment_transactions")
    op.drop_table("payment_transactions")
    op.drop_table("user_subscriptions")
    op.drop_index(op.f("ix_subscription_plans_code"), table_name="subscription_plans")
    op.drop_table("subscription_plans")
