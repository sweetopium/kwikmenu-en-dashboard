"""add stripe billing fields"""

from alembic import op
import sqlalchemy as sa


revision = "20260618_0009"
down_revision = "a847f74479c6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("subscription_plans", sa.Column("stripe_product_id", sa.String(length=128), nullable=True))
    op.add_column("subscription_plans", sa.Column("stripe_price_id", sa.String(length=128), nullable=True))
    op.add_column("user_subscriptions", sa.Column("stripe_customer_id", sa.String(length=128), nullable=True))
    op.add_column("user_subscriptions", sa.Column("stripe_subscription_id", sa.String(length=128), nullable=True))
    op.create_unique_constraint(op.f("uq_user_subscriptions_stripe_subscription_id"), "user_subscriptions", ["stripe_subscription_id"])
    op.add_column("payment_transactions", sa.Column("stripe_checkout_session_id", sa.String(length=128), nullable=True))
    op.add_column("payment_transactions", sa.Column("stripe_invoice_id", sa.String(length=128), nullable=True))
    op.add_column("payment_transactions", sa.Column("stripe_payment_intent_id", sa.String(length=128), nullable=True))
    op.create_unique_constraint(op.f("uq_payment_transactions_stripe_checkout_session_id"), "payment_transactions", ["stripe_checkout_session_id"])

    op.execute(
        sa.text(
            """
            UPDATE subscription_plans
            SET price_amount = 20.00,
                stripe_product_id = 'prod_Uj7Xpc6egpZIkD',
                stripe_price_id = 'price_1TjfHx46GNgLIyYApzEt1hIM',
                updated_at = NOW()
            WHERE code = 'starter'
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE subscription_plans
            SET code = 'basic',
                name = 'Basic',
                description = 'Up to 3 venues, extended templates, and translations.',
                price_amount = 50.00,
                stripe_product_id = 'prod_Uj7XEZOdOtPRg7',
                stripe_price_id = 'price_1TjfIp46GNgLIyYA8Urii45G',
                updated_at = NOW()
            WHERE code = 'business'
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE subscription_plans
            SET price_amount = 99.00,
                stripe_product_id = 'prod_Uj7YkEr3M2LLQe',
                stripe_price_id = 'price_1TjfJK46GNgLIyYANnyINYU7',
                updated_at = NOW()
            WHERE code = 'pro'
            """
        )
    )


def downgrade() -> None:
    op.execute(sa.text("UPDATE subscription_plans SET code = 'business', name = 'Business' WHERE code = 'basic'"))
    op.drop_constraint(op.f("uq_payment_transactions_stripe_checkout_session_id"), "payment_transactions", type_="unique")
    op.drop_column("payment_transactions", "stripe_payment_intent_id")
    op.drop_column("payment_transactions", "stripe_invoice_id")
    op.drop_column("payment_transactions", "stripe_checkout_session_id")
    op.drop_constraint(op.f("uq_user_subscriptions_stripe_subscription_id"), "user_subscriptions", type_="unique")
    op.drop_column("user_subscriptions", "stripe_subscription_id")
    op.drop_column("user_subscriptions", "stripe_customer_id")
    op.drop_column("subscription_plans", "stripe_price_id")
    op.drop_column("subscription_plans", "stripe_product_id")
