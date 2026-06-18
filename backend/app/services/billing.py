from __future__ import annotations

from calendar import monthrange
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import BillingEvent, Menu, MenuImportJob, PaymentTransaction, SubscriptionPlan, User, UserSubscription, Venue
from app.schemas.billing import (
    BillingPlanResponse,
    BillingSubscriptionResponse,
    BillingTransactionResponse,
    BillingUsageResponse,
)
from app.schemas.public_api import PublicBillingPlanFeatureResponse, PublicBillingPlanResponse
from app.services.unitpay import UnitPayClient
from app.schemas.menu import MenuPayload


TEMPLATE_TIER_ORDER = {
    "basic": 1,
    "extended": 2,
    "premium": 3,
}

ACTIVE_ACCESS_STATUSES = {"trialing", "active", "past_due", "canceled"}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def add_months(value: datetime, months: int = 1) -> datetime:
    month = value.month - 1 + months
    year = value.year + month // 12
    month = month % 12 + 1
    day = min(value.day, monthrange(year, month)[1])
    return value.replace(year=year, month=month, day=day)


def decimal_to_float(value: Decimal | float | int) -> float:
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def build_subscription_receipt_items(
    *,
    name: str,
    amount: Decimal | float | int,
    currency: str,
) -> list[dict[str, object]]:
    settings = get_settings()
    return [
        {
            "name": name[:128],
            "count": 1,
            "price": round(decimal_to_float(amount), 2),
            "currency": currency,
            "nds": settings.unitpay_receipt_nds,
            "type": settings.unitpay_receipt_item_type,
            "paymentMethod": settings.unitpay_receipt_payment_method,
        }
    ]


def get_plan_by_code(db: Session, code: str) -> SubscriptionPlan | None:
    return db.query(SubscriptionPlan).filter(SubscriptionPlan.code == code).first()


def get_public_plans(db: Session) -> list[SubscriptionPlan]:
    return (
        db.query(SubscriptionPlan)
        .filter(SubscriptionPlan.is_public.is_(True))
        .order_by(SubscriptionPlan.sort_order.asc(), SubscriptionPlan.created_at.asc())
        .all()
    )


def get_user_subscription(db: Session, user_id: str) -> UserSubscription | None:
    return db.query(UserSubscription).filter(UserSubscription.user_id == user_id).first()


def ensure_default_subscription(db: Session, user: User) -> UserSubscription:
    subscription = get_user_subscription(db, user.id)
    if subscription is not None:
        return subscription

    settings = get_settings()
    plan = get_plan_by_code(db, settings.billing_default_plan_code)
    if plan is None:
        raise RuntimeError(f"Default billing plan '{settings.billing_default_plan_code}' is missing.")

    current_time = now_utc()
    trial_end = current_time
    if settings.billing_trial_days > 0:
        from datetime import timedelta

        trial_end = current_time + timedelta(days=settings.billing_trial_days)

    subscription = UserSubscription(
        user_id=user.id,
        plan_id=plan.id,
        status="trialing",
        current_period_start=current_time,
        current_period_end=trial_end,
        trial_ends_at=trial_end,
        cancel_at_period_end=False,
    )
    db.add(subscription)
    db.flush()
    return subscription


def subscription_has_access(subscription: UserSubscription, *, at: datetime | None = None) -> bool:
    check_time = at or now_utc()
    if subscription.status not in ACTIVE_ACCESS_STATUSES:
        return False
    if subscription.current_period_end and subscription.current_period_end >= check_time:
        return True
    if subscription.trial_ends_at and subscription.trial_ends_at >= check_time:
        return True
    return False


def build_plan_response(plan: SubscriptionPlan) -> BillingPlanResponse:
    return BillingPlanResponse(
        id=plan.id,
        code=plan.code,
        name=plan.name,
        description=plan.description,
        priceAmount=decimal_to_float(plan.price_amount),
        currency=plan.currency,
        billingPeriod=plan.billing_period,
        isActive=plan.is_active,
        isPublic=plan.is_public,
        sortOrder=plan.sort_order,
        stripeProductId=plan.stripe_product_id,
        stripePriceId=plan.stripe_price_id,
        maxVenues=plan.max_venues,
        maxMenusPerVenue=plan.max_menus_per_venue,
        maxMenuItemsPerMenu=plan.max_menu_items_per_menu,
        aiImportsPerMonth=plan.ai_imports_per_month,
        publicMenuEnabled=plan.public_menu_enabled,
        translationsEnabled=plan.translations_enabled,
        maxTranslationLanguages=plan.max_translation_languages,
        analyticsEnabled=plan.analytics_enabled,
        qrCustomizationEnabled=plan.qr_customization_enabled,
        menuDesignCustomizationEnabled=plan.menu_design_customization_enabled,
        maxTemplateTier=plan.max_template_tier,
        prioritySupportEnabled=plan.priority_support_enabled,
    )


def build_public_plan_feature_flags(plan: SubscriptionPlan) -> list[PublicBillingPlanFeatureResponse]:
    template_tier_labels = {
        "basic": "Basic template",
        "extended": "Extended template",
        "premium": "Premium template",
    }
    return [
        PublicBillingPlanFeatureResponse(key="max_venues", label="Venue limit", enabled=True, value=plan.max_venues),
        PublicBillingPlanFeatureResponse(key="max_menus_per_venue", label="Menus per venue", enabled=True, value=plan.max_menus_per_venue),
        PublicBillingPlanFeatureResponse(key="max_menu_items_per_menu", label="Items per menu", enabled=True, value=plan.max_menu_items_per_menu),
        PublicBillingPlanFeatureResponse(key="ai_imports_per_month", label="AI imports per month", enabled=True, value=plan.ai_imports_per_month),
        PublicBillingPlanFeatureResponse(key="public_menu_enabled", label="Public menu", enabled=plan.public_menu_enabled, value=plan.public_menu_enabled),
        PublicBillingPlanFeatureResponse(key="translations_enabled", label="Translations", enabled=plan.translations_enabled, value=plan.max_translation_languages),
        PublicBillingPlanFeatureResponse(key="analytics_enabled", label="Analytics", enabled=plan.analytics_enabled, value=plan.analytics_enabled),
        PublicBillingPlanFeatureResponse(key="qr_customization_enabled", label="QR customization", enabled=plan.qr_customization_enabled, value=plan.qr_customization_enabled),
        PublicBillingPlanFeatureResponse(
            key="menu_design_customization_enabled",
            label="Menu design customization",
            enabled=plan.menu_design_customization_enabled,
            value=plan.menu_design_customization_enabled,
        ),
        PublicBillingPlanFeatureResponse(
            key="max_template_tier",
            label="Available template",
            enabled=True,
            value=template_tier_labels.get(plan.max_template_tier, plan.max_template_tier),
        ),
        PublicBillingPlanFeatureResponse(
            key="priority_support_enabled",
            label="Priority support",
            enabled=plan.priority_support_enabled,
            value=plan.priority_support_enabled,
        ),
    ]


def build_public_plan_marketing_features(plan: SubscriptionPlan) -> list[str]:
    features = [
        f"Up to {plan.max_venues} venues" if plan.max_venues > 1 else "1 venue",
        f"Up to {plan.max_menus_per_venue} menus per venue",
        f"Up to {plan.max_menu_items_per_menu} items per menu",
        f"{plan.ai_imports_per_month} AI imports per month",
    ]
    if plan.public_menu_enabled:
        features.append("Public menu")
    if plan.translations_enabled:
        features.append(f"Translations up to {plan.max_translation_languages} languages")
    else:
        features.append("No translations")
    if plan.analytics_enabled:
        features.append("Analytics")
    if plan.qr_customization_enabled:
        features.append("QR customization")
    if plan.menu_design_customization_enabled:
        features.append("Menu design customization")
    template_tier_labels = {
        "basic": "Basic template",
        "extended": "Extended template",
        "premium": "Premium template",
    }
    features.append(template_tier_labels.get(plan.max_template_tier, plan.max_template_tier))
    if plan.priority_support_enabled:
        features.append("Priority support")
    return features


def build_public_plan_response(plan: SubscriptionPlan) -> PublicBillingPlanResponse:
    return PublicBillingPlanResponse(
        id=plan.id,
        code=plan.code,
        name=plan.name,
        description=plan.description,
        priceAmount=decimal_to_float(plan.price_amount),
        annualPriceAmount=round(decimal_to_float(plan.price_amount) * 12, 2),
        currency=plan.currency,
        billingPeriod=plan.billing_period,
        sortOrder=plan.sort_order,
        isFeatured=plan.code == "pro",
        maxVenues=plan.max_venues,
        maxMenusPerVenue=plan.max_menus_per_venue,
        maxMenuItemsPerMenu=plan.max_menu_items_per_menu,
        aiImportsPerMonth=plan.ai_imports_per_month,
        publicMenuEnabled=plan.public_menu_enabled,
        translationsEnabled=plan.translations_enabled,
        maxTranslationLanguages=plan.max_translation_languages,
        analyticsEnabled=plan.analytics_enabled,
        qrCustomizationEnabled=plan.qr_customization_enabled,
        menuDesignCustomizationEnabled=plan.menu_design_customization_enabled,
        maxTemplateTier=plan.max_template_tier,
        prioritySupportEnabled=plan.priority_support_enabled,
        marketingFeatures=build_public_plan_marketing_features(plan),
        featureFlags=build_public_plan_feature_flags(plan),
    )


def build_subscription_response(subscription: UserSubscription) -> BillingSubscriptionResponse:
    return BillingSubscriptionResponse(
        id=subscription.id,
        status=subscription.status,
        cancelAtPeriodEnd=subscription.cancel_at_period_end,
        trialEndsAt=subscription.trial_ends_at,
        currentPeriodStart=subscription.current_period_start,
        currentPeriodEnd=subscription.current_period_end,
        lastPaymentAt=subscription.last_payment_at,
        lastPaymentStatus=subscription.last_payment_status,
        unitpaySubscriptionId=subscription.unitpay_subscription_id,
        stripeCustomerId=subscription.stripe_customer_id,
        stripeSubscriptionId=subscription.stripe_subscription_id,
        plan=build_plan_response(subscription.plan),
    )


def build_transaction_response(transaction: PaymentTransaction) -> BillingTransactionResponse:
    return BillingTransactionResponse(
        id=transaction.id,
        kind=transaction.kind,
        status=transaction.status,
        amount=decimal_to_float(transaction.amount),
        currency=transaction.currency,
        description=transaction.description,
        unitpayPaymentId=transaction.unitpay_payment_id,
        unitpaySubscriptionId=transaction.unitpay_subscription_id,
        stripeCheckoutSessionId=transaction.stripe_checkout_session_id,
        stripeInvoiceId=transaction.stripe_invoice_id,
        stripePaymentIntentId=transaction.stripe_payment_intent_id,
        checkoutUrl=transaction.checkout_url,
        receiptUrl=transaction.receipt_url,
        isTest=transaction.is_test,
        errorMessage=transaction.error_message,
        processedAt=transaction.processed_at,
        createdAt=transaction.created_at,
        planCode=transaction.plan.code,
        planName=transaction.plan.name,
    )


def build_usage_response(db: Session, user: User, subscription: UserSubscription) -> BillingUsageResponse:
    current_month = now_utc().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    ai_imports_used = (
        db.query(MenuImportJob)
        .filter(
            MenuImportJob.user_id == user.id,
            MenuImportJob.created_at >= current_month,
        )
        .count()
    )
    venues_count = db.query(Venue).filter(Venue.owner_user_id == user.id).count()
    plan = subscription.plan
    return BillingUsageResponse(
        venuesCount=venues_count,
        maxVenues=plan.max_venues,
        aiImportsUsedThisMonth=ai_imports_used,
        aiImportsPerMonth=plan.ai_imports_per_month,
        translationsEnabled=plan.translations_enabled,
        maxTranslationLanguages=plan.max_translation_languages,
    )


def log_billing_event(
    db: Session,
    *,
    source: str,
    event_type: str,
    user_id: str | None = None,
    subscription_id: str | None = None,
    payment_id: str | None = None,
    payload: dict | None = None,
) -> BillingEvent:
    event = BillingEvent(
        user_id=user_id,
        subscription_id=subscription_id,
        payment_id=payment_id,
        source=source,
        event_type=event_type,
        payload=payload,
    )
    db.add(event)
    db.flush()
    return event


def require_active_billing_access(subscription: UserSubscription) -> None:
    if subscription_has_access(subscription):
        return
    raise HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail="Subscription is inactive. Renew your plan to continue.",
    )


def require_plan_feature(condition: bool, message: str) -> None:
    if not condition:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)


def get_effective_subscription(db: Session, user: User) -> UserSubscription:
    subscription = ensure_default_subscription(db, user)
    db.refresh(subscription)
    return subscription


def assert_can_create_venue(db: Session, user: User) -> UserSubscription:
    subscription = get_effective_subscription(db, user)
    require_active_billing_access(subscription)
    venues_count = db.query(Venue).filter(Venue.owner_user_id == user.id).count()
    if venues_count >= subscription.plan.max_venues:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"The venue limit for the {subscription.plan.name} plan has been reached.",
        )
    return subscription


def assert_can_create_menu_import(db: Session, user: User) -> UserSubscription:
    subscription = get_effective_subscription(db, user)
    require_active_billing_access(subscription)
    current_month = now_utc().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    imports_count = (
        db.query(MenuImportJob)
        .filter(MenuImportJob.user_id == user.id, MenuImportJob.created_at >= current_month)
        .count()
    )
    if imports_count >= subscription.plan.ai_imports_per_month:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"The monthly AI import limit for the {subscription.plan.name} plan has been reached.",
        )
    return subscription


def count_menu_items(payload: MenuPayload) -> int:
    return sum(len(category.items) for category in payload.categories)


def count_translation_languages(payload: MenuPayload) -> int:
    base_language = payload.defaultLanguage
    active_languages: set[str] = set()

    def add_translation_keys(translations: dict) -> None:
        for language_code, localized in (translations or {}).items():
            if language_code == base_language:
                continue
            values = [getattr(localized, attr, None) for attr in ("name", "description", "label")]
            if any(value for value in values):
                active_languages.add(language_code)

    add_translation_keys(payload.menuMeta.translations)
    for category in payload.categories:
        add_translation_keys(category.translations)
        for item in category.items:
            add_translation_keys(item.translations)
            for variant in item.variants:
                add_translation_keys(variant.translations)

    return len(active_languages)


def assert_menu_within_plan_limits(subscription: UserSubscription, payload: MenuPayload) -> None:
    require_active_billing_access(subscription)
    assert_template_allowed(subscription, payload.settings.templateType)
    items_count = count_menu_items(payload)
    if items_count > subscription.plan.max_menu_items_per_menu:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"This menu has {items_count} items, while the {subscription.plan.name} plan limit is "
                f"{subscription.plan.max_menu_items_per_menu}."
            ),
        )

    translation_languages = count_translation_languages(payload)
    if translation_languages > 0 and not subscription.plan.translations_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Translations are not available on the {subscription.plan.name} plan.",
        )
    if translation_languages > subscription.plan.max_translation_languages:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Translation language limit on the {subscription.plan.name} plan: "
                f"{subscription.plan.max_translation_languages}."
            ),
        )


def assert_can_create_menu_for_venue(db: Session, subscription: UserSubscription, venue_id: str) -> None:
    menus_count = db.query(Menu).filter(Menu.venue_id == venue_id).count()
    if menus_count >= subscription.plan.max_menus_per_venue:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"The menus-per-venue limit for the {subscription.plan.name} plan has been reached.",
        )


def assert_template_allowed(subscription: UserSubscription, template_name: str) -> None:
    template_names = {
        "classic": "Classic",
        "minimal": "Advanced",
        "accent": "Premium",
    }
    normalized_template = (template_name or "basic").strip().lower()
    template_tier = "basic"
    if normalized_template in {"extended", "minimal"}:
        template_tier = "extended"
    elif normalized_template in {"premium", "accent"}:
        template_tier = "premium"

    allowed_order = TEMPLATE_TIER_ORDER.get(subscription.plan.max_template_tier, 1)
    template_order = TEMPLATE_TIER_ORDER.get(template_tier, 1)
    if template_order > allowed_order:
        readable_name = template_names.get(normalized_template, template_name)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"The {readable_name} template is not available on the {subscription.plan.name} plan.",
        )


def apply_successful_payment(
    subscription: UserSubscription,
    transaction: PaymentTransaction,
    *,
    unitpay_subscription_id: str | None,
    payment_time: datetime | None = None,
) -> None:
    applied_at = payment_time or now_utc()
    if transaction.kind == "recurring" and subscription.current_period_end and subscription.current_period_end > applied_at:
        period_start = subscription.current_period_end
    else:
        period_start = applied_at
    period_end = add_months(period_start, 1)

    subscription.plan_id = transaction.plan_id
    subscription.status = "active"
    subscription.current_period_start = period_start
    subscription.current_period_end = period_end
    subscription.trial_ends_at = None
    subscription.cancel_at_period_end = False
    subscription.canceled_at = None
    subscription.last_payment_at = applied_at
    subscription.last_payment_status = "success"
    subscription.last_synced_at = applied_at
    if unitpay_subscription_id:
        subscription.unitpay_subscription_id = unitpay_subscription_id
    if transaction.kind == "initial" and transaction.unitpay_payment_id:
        subscription.parent_payment_id = transaction.unitpay_payment_id


def _stripe_timestamp_to_datetime(value: Any) -> datetime | None:
    if value in (None, ""):
        return None
    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None


def _stripe_subscription_period(subscription_payload: dict[str, Any]) -> tuple[datetime | None, datetime | None]:
    period_start = _stripe_timestamp_to_datetime(subscription_payload.get("current_period_start"))
    period_end = _stripe_timestamp_to_datetime(subscription_payload.get("current_period_end"))
    if period_start and period_end:
        return period_start, period_end

    items = (subscription_payload.get("items") or {}).get("data") or []
    if items:
        first_item = items[0] or {}
        period_start = period_start or _stripe_timestamp_to_datetime(first_item.get("current_period_start"))
        period_end = period_end or _stripe_timestamp_to_datetime(first_item.get("current_period_end"))
    return period_start, period_end


def apply_stripe_subscription_state(
    subscription: UserSubscription,
    plan: SubscriptionPlan,
    *,
    stripe_subscription: dict[str, Any],
    transaction: PaymentTransaction | None = None,
) -> None:
    applied_at = now_utc()
    stripe_status = str(stripe_subscription.get("status") or "active")
    period_start, period_end = _stripe_subscription_period(stripe_subscription)
    customer = stripe_subscription.get("customer")
    subscription_id = stripe_subscription.get("id")

    subscription.plan_id = plan.id
    subscription.status = stripe_status
    subscription.current_period_start = period_start or subscription.current_period_start or applied_at
    subscription.current_period_end = period_end or subscription.current_period_end or add_months(applied_at, 1)
    subscription.trial_ends_at = _stripe_timestamp_to_datetime(stripe_subscription.get("trial_end"))
    subscription.cancel_at_period_end = bool(stripe_subscription.get("cancel_at_period_end"))
    subscription.canceled_at = _stripe_timestamp_to_datetime(stripe_subscription.get("canceled_at"))
    subscription.last_synced_at = applied_at
    if stripe_status in {"active", "trialing"}:
        subscription.last_payment_status = "success"
        subscription.last_payment_at = applied_at
    elif stripe_status in {"past_due", "unpaid", "incomplete", "incomplete_expired"}:
        subscription.last_payment_status = "error"
    if customer:
        subscription.stripe_customer_id = str(customer)
    if subscription_id:
        subscription.stripe_subscription_id = str(subscription_id)
    if transaction is not None:
        transaction.status = "success" if stripe_status in {"active", "trialing"} else stripe_status
        transaction.processed_at = applied_at


def mark_payment_failed(subscription: UserSubscription, *, error_message: str | None = None) -> None:
    subscription.status = "past_due"
    subscription.last_payment_status = "error"
    subscription.last_synced_at = now_utc()
    if error_message:
        metadata = dict(subscription.metadata_json or {})
        metadata["lastError"] = error_message
        subscription.metadata_json = metadata


def renew_due_subscriptions(db: Session, *, limit: int = 100) -> dict[str, int]:
    current_time = now_utc()
    unitpay = UnitPayClient()
    processed = 0
    created = 0
    failed = 0
    skipped = 0

    due_subscriptions = (
        db.query(UserSubscription)
        .join(UserSubscription.plan)
        .join(UserSubscription.user)
        .filter(
            UserSubscription.status.in_(("active", "past_due")),
            UserSubscription.cancel_at_period_end.is_(False),
            UserSubscription.current_period_end.is_not(None),
            UserSubscription.current_period_end <= current_time,
        )
        .order_by(UserSubscription.current_period_end.asc())
        .limit(limit)
        .all()
    )

    for subscription in due_subscriptions:
        processed += 1
        if not subscription.unitpay_subscription_id:
            skipped += 1
            continue

        existing_pending = (
            db.query(PaymentTransaction)
            .filter(
                PaymentTransaction.subscription_id == subscription.id,
                PaymentTransaction.kind == "recurring",
                PaymentTransaction.status == "pending",
            )
            .first()
        )
        if existing_pending is not None:
            skipped += 1
            continue

        plan = subscription.plan
        description = f"KwikMenu {plan.name} renewal"
        amount = float(plan.price_amount)
        receipt_items = build_subscription_receipt_items(
            name=description,
            amount=plan.price_amount,
            currency=plan.currency,
        )

        try:
            result = unitpay.init_subscription_payment(
                account=subscription.user_id,
                sum_amount=amount,
                description=description,
                customer_email=subscription.user.email,
                customer_phone=subscription.user.phone,
                receipt_items=receipt_items,
                subscription_id=subscription.unitpay_subscription_id,
            )
            transaction = PaymentTransaction(
                user_id=subscription.user_id,
                subscription_id=subscription.id,
                plan_id=plan.id,
                kind="recurring",
                status="pending",
                unitpay_payment_id=result.payment_id,
                unitpay_subscription_id=subscription.unitpay_subscription_id,
                amount=amount,
                currency=plan.currency,
                description=description,
                checkout_url=result.redirect_url,
                receipt_url=result.receipt_url,
                status_url=result.status_url,
                is_test=unitpay.settings.unitpay_test_mode,
                raw_request={
                    "subscriptionId": subscription.unitpay_subscription_id,
                    "planCode": plan.code,
                    "customerEmail": subscription.user.email,
                    "receiptItems": receipt_items,
                },
                raw_response=result.payload,
            )
            subscription.last_payment_status = "pending"
            subscription.last_synced_at = current_time
            db.add(transaction)
            db.flush()
            log_billing_event(
                db,
                source="renewal",
                event_type="renewal_payment_created",
                user_id=subscription.user_id,
                subscription_id=subscription.id,
                payment_id=transaction.id,
                payload={"planCode": plan.code, "unitpayPaymentId": transaction.unitpay_payment_id},
            )
            created += 1
        except HTTPException as exc:
            mark_payment_failed(subscription, error_message=str(exc.detail))
            db.add(
                PaymentTransaction(
                    user_id=subscription.user_id,
                    subscription_id=subscription.id,
                    plan_id=plan.id,
                    kind="recurring",
                    status="error",
                    unitpay_subscription_id=subscription.unitpay_subscription_id,
                    amount=amount,
                    currency=plan.currency,
                    description=description,
                    is_test=unitpay.settings.unitpay_test_mode,
                    error_message=str(exc.detail),
                    processed_at=current_time,
                )
            )
            log_billing_event(
                db,
                source="renewal",
                event_type="renewal_payment_failed",
                user_id=subscription.user_id,
                subscription_id=subscription.id,
                payload={"error": str(exc.detail)},
            )
            failed += 1

    db.commit()
    return {
        "processed": processed,
        "created": created,
        "failed": failed,
        "skipped": skipped,
    }
