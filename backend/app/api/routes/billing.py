from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import PaymentTransaction, SubscriptionPlan, User, UserSubscription
from app.schemas.billing import (
    BillingCheckoutRequest,
    BillingCheckoutResponse,
    BillingSummaryResponse,
    BillingSubscriptionResponse,
    BillingSyncResponse,
    BillingTestSubscriptionChargeRequest,
)
from app.core.config import get_settings
from app.services.billing import (
    apply_successful_payment,
    apply_stripe_subscription_state,
    build_plan_response,
    build_subscription_receipt_items,
    build_subscription_response,
    build_transaction_response,
    build_usage_response,
    ensure_default_subscription,
    get_public_plans,
    log_billing_event,
    mark_payment_failed,
)
from app.services.stripe_billing import StripeBillingClient
from app.services.unitpay import UnitPayClient


router = APIRouter(prefix="/api/billing", tags=["billing"])


def _normalize_callback_params(request: Request) -> tuple[str, dict[str, str]]:
    method = ""
    params: dict[str, str] = {}
    for key, value in request.query_params.items():
        if key == "method":
            method = value.strip().lower()
            continue
        if key.startswith("params[") and key.endswith("]"):
            params[key[7:-1]] = value
            continue
        params[key] = value
    return method, params


def _get_transaction_for_user(db: Session, current_user: User, payment_id: str) -> PaymentTransaction | None:
    return (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.id == payment_id, PaymentTransaction.user_id == current_user.id)
        .first()
    )


def _get_transaction_for_user_by_unitpay_id(
    db: Session,
    current_user: User,
    unitpay_payment_id: str,
) -> PaymentTransaction | None:
    return (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.unitpay_payment_id == unitpay_payment_id,
            PaymentTransaction.user_id == current_user.id,
        )
        .first()
    )


def _get_plan_by_stripe_price_id(db: Session, price_id: str | None) -> SubscriptionPlan | None:
    if not price_id:
        return None
    return db.query(SubscriptionPlan).filter(SubscriptionPlan.stripe_price_id == price_id).first()


def _extract_stripe_price_id(subscription_payload: dict) -> str | None:
    items = (subscription_payload.get("items") or {}).get("data") or []
    if not items:
        return None
    price = (items[0] or {}).get("price") or {}
    price_id = price.get("id")
    return str(price_id) if price_id else None


def _stripe_checkout_urls() -> tuple[str, str]:
    settings = get_settings()
    frontend_origin = settings.menu_import_frontend_origin.rstrip("/")
    success_url = settings.stripe_checkout_success_url or f"{frontend_origin}/dashboard/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = settings.stripe_checkout_cancel_url or f"{frontend_origin}/dashboard/billing/fail"
    return success_url, cancel_url


def _apply_stripe_checkout_session(
    *,
    db: Session,
    session_payload: dict,
    transaction: PaymentTransaction | None = None,
) -> UserSubscription:
    session_id = str(session_payload.get("id") or "")
    subscription_payload = session_payload.get("subscription")
    stripe = StripeBillingClient()
    if isinstance(subscription_payload, str):
        subscription_payload = stripe.retrieve_subscription(subscription_payload)
    if not isinstance(subscription_payload, dict):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stripe subscription is missing.")

    metadata = session_payload.get("metadata") or subscription_payload.get("metadata") or {}
    subscription_id = metadata.get("subscriptionId")
    user_id = metadata.get("userId") or session_payload.get("client_reference_id")
    plan_code = metadata.get("planCode")
    price_id = _extract_stripe_price_id(subscription_payload)

    subscription = None
    if subscription_id:
        subscription = db.query(UserSubscription).filter(UserSubscription.id == str(subscription_id)).first()
    if subscription is None and user_id:
        subscription = db.query(UserSubscription).filter(UserSubscription.user_id == str(user_id)).first()
    if subscription is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription target not found.")

    plan = _get_plan_by_stripe_price_id(db, price_id)
    if plan is None and plan_code:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == str(plan_code)).first()
    if plan is None:
        plan = subscription.plan

    if transaction is None and session_id:
        transaction = db.query(PaymentTransaction).filter(PaymentTransaction.stripe_checkout_session_id == session_id).first()
    if transaction is not None:
        transaction.raw_response = session_payload
        transaction.stripe_checkout_session_id = session_id or transaction.stripe_checkout_session_id
        transaction.stripe_invoice_id = str(session_payload.get("invoice") or "") or transaction.stripe_invoice_id
        transaction.stripe_payment_intent_id = str(session_payload.get("payment_intent") or "") or transaction.stripe_payment_intent_id

    apply_stripe_subscription_state(
        subscription,
        plan,
        stripe_subscription=subscription_payload,
        transaction=transaction,
    )
    db.add(subscription)
    if transaction is not None:
        db.add(transaction)
    return subscription


def _sync_transaction_record(
    *,
    transaction: PaymentTransaction,
    current_user: User,
    db: Session,
) -> BillingSyncResponse:
    subscription = ensure_default_subscription(db, current_user)
    unitpay = UnitPayClient()
    if not transaction.unitpay_payment_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Платеж не содержит UnitPay ID.")

    payment_payload = unitpay.get_payment(payment_id=transaction.unitpay_payment_id)
    payment_result = payment_payload.get("result") or {}
    remote_status = str(payment_result.get("status") or "wait")
    transaction.raw_response = payment_payload
    transaction.processed_at = datetime.now(timezone.utc)
    transaction.receipt_url = payment_result.get("receiptUrl") or transaction.receipt_url
    transaction.error_message = payment_result.get("errorMessage")

    if remote_status == "success":
        transaction.status = "success"
        apply_successful_payment(
            subscription,
            transaction,
            unitpay_subscription_id=transaction.unitpay_subscription_id,
            payment_time=transaction.processed_at,
        )
    elif remote_status in {"error", "error_pay", "error_check"}:
        transaction.status = "error"
        mark_payment_failed(subscription, error_message=transaction.error_message)
    else:
        transaction.status = "pending"
        subscription.last_synced_at = datetime.now(timezone.utc)

    log_billing_event(
        db,
        source="api",
        event_type="payment_synced",
        user_id=current_user.id,
        subscription_id=subscription.id,
        payment_id=transaction.id,
        payload={"remoteStatus": remote_status},
    )
    db.add(transaction)
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return BillingSyncResponse(subscription=build_subscription_response(subscription), syncedAt=datetime.now(timezone.utc))


@router.get("/me", response_model=BillingSummaryResponse)
def get_my_billing(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BillingSummaryResponse:
    subscription = ensure_default_subscription(db, current_user)
    db.commit()
    db.refresh(subscription)
    recent_transactions = (
        db.query(PaymentTransaction)
        .join(SubscriptionPlan, SubscriptionPlan.id == PaymentTransaction.plan_id)
        .filter(PaymentTransaction.user_id == current_user.id)
        .order_by(PaymentTransaction.created_at.desc())
        .limit(10)
        .all()
    )
    plans = get_public_plans(db)
    return BillingSummaryResponse(
        subscription=build_subscription_response(subscription),
        usage=build_usage_response(db, current_user, subscription),
        plans=[build_plan_response(plan) for plan in plans],
        recentTransactions=[build_transaction_response(transaction) for transaction in recent_transactions],
    )


@router.post("/checkout", response_model=BillingCheckoutResponse)
def create_checkout(
    payload: BillingCheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BillingCheckoutResponse:
    subscription = ensure_default_subscription(db, current_user)
    plan = (
        db.query(SubscriptionPlan)
        .filter(SubscriptionPlan.code == payload.planCode, SubscriptionPlan.is_active.is_(True))
        .first()
    )
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")
    if not plan.stripe_price_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stripe price is not configured for this plan.")

    stripe = StripeBillingClient()
    success_url, cancel_url = _stripe_checkout_urls()
    description = f"KwikMenu {plan.name} subscription"
    amount = float(plan.price_amount)
    transaction = PaymentTransaction(
        user_id=current_user.id,
        subscription_id=subscription.id,
        plan_id=plan.id,
        kind="initial",
        status="pending",
        amount=amount,
        currency=plan.currency,
        description=description,
        is_test=stripe.secret_key.startswith("sk_test_") if stripe.secret_key else False,
        raw_request={
            "description": description,
            "planCode": plan.code,
            "stripePriceId": plan.stripe_price_id,
            "customerEmail": current_user.email,
        },
    )
    db.add(transaction)
    db.flush()

    result = stripe.create_checkout_session(
        price_id=plan.stripe_price_id,
        success_url=success_url,
        cancel_url=cancel_url,
        customer_email=current_user.email,
        customer_id=subscription.stripe_customer_id,
        client_reference_id=current_user.id,
        metadata={
            "userId": current_user.id,
            "subscriptionId": subscription.id,
            "planCode": plan.code,
            "transactionId": transaction.id,
        },
    )
    transaction.stripe_checkout_session_id = result.session_id
    transaction.checkout_url = result.url
    transaction.raw_response = result.payload

    log_billing_event(
        db,
        source="api",
        event_type="checkout_created",
        user_id=current_user.id,
        subscription_id=subscription.id,
        payment_id=transaction.id,
        payload={"planCode": plan.code, "stripeCheckoutSessionId": transaction.stripe_checkout_session_id},
    )
    db.commit()
    db.refresh(transaction)
    return BillingCheckoutResponse(
        transaction=build_transaction_response(transaction),
        redirectUrl=result.url,
    )


@router.post("/test/subscription-charge", response_model=BillingCheckoutResponse)
def create_test_subscription_charge(
    payload: BillingTestSubscriptionChargeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BillingCheckoutResponse:
    unitpay = UnitPayClient()
    if not unitpay.settings.unitpay_test_mode:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Тестовое списание по subscriptionId доступно только при UNITPAY_TEST_MODE=true.",
        )

    subscription = ensure_default_subscription(db, current_user)
    plan = subscription.plan
    if payload.planCode:
        requested_plan = (
            db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.code == payload.planCode, SubscriptionPlan.is_active.is_(True))
            .first()
        )
        if requested_plan is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Тариф не найден.")
        plan = requested_plan

    description = f"KwikMenu {plan.name} subscription"
    amount = float(plan.price_amount)
    receipt_items = build_subscription_receipt_items(
        name=description,
        amount=plan.price_amount,
        currency=plan.currency,
    )
    result = unitpay.init_subscription_payment(
        account=current_user.id,
        sum_amount=amount,
        description=description,
        customer_email=current_user.email,
        customer_phone=current_user.phone,
        receipt_items=receipt_items,
        subscription_id=str(payload.subscriptionId),
    )

    transaction = PaymentTransaction(
        user_id=current_user.id,
        subscription_id=subscription.id,
        plan_id=plan.id,
        kind="recurring_test",
        status="pending",
        unitpay_payment_id=result.payment_id,
        unitpay_subscription_id=str(payload.subscriptionId),
        amount=amount,
        currency=plan.currency,
        description=description,
        checkout_url=result.redirect_url,
        receipt_url=result.receipt_url,
        status_url=result.status_url,
        is_test=True,
        raw_request={
            "account": current_user.id,
            "description": description,
            "planCode": plan.code,
            "subscriptionId": str(payload.subscriptionId),
            "customerEmail": current_user.email,
            "receiptItems": receipt_items,
        },
        raw_response=result.payload,
    )
    db.add(transaction)
    db.flush()
    log_billing_event(
        db,
        source="api",
        event_type="test_recurring_checkout_created",
        user_id=current_user.id,
        subscription_id=subscription.id,
        payment_id=transaction.id,
        payload={
            "planCode": plan.code,
            "unitpayPaymentId": transaction.unitpay_payment_id,
            "subscriptionId": str(payload.subscriptionId),
        },
    )
    db.commit()
    db.refresh(transaction)
    return BillingCheckoutResponse(
        transaction=build_transaction_response(transaction),
        redirectUrl=result.redirect_url,
    )


@router.post("/cancel", response_model=BillingSubscriptionResponse)
def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BillingSubscriptionResponse:
    subscription = ensure_default_subscription(db, current_user)
    if subscription.stripe_subscription_id:
        stripe = StripeBillingClient()
        if stripe.enabled:
            stripe.cancel_subscription(subscription.stripe_subscription_id)
    unitpay = UnitPayClient()
    if not subscription.stripe_subscription_id and subscription.unitpay_subscription_id and unitpay.enabled:
        unitpay.close_subscription(subscription_id=subscription.unitpay_subscription_id)

    subscription.cancel_at_period_end = True
    subscription.canceled_at = datetime.now(timezone.utc)
    if subscription.status == "trialing":
        subscription.status = "canceled"

    log_billing_event(
        db,
        source="api",
        event_type="subscription_canceled",
        user_id=current_user.id,
        subscription_id=subscription.id,
        payload={
            "stripeSubscriptionId": subscription.stripe_subscription_id,
            "unitpaySubscriptionId": subscription.unitpay_subscription_id,
        },
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return build_subscription_response(subscription)


@router.post("/transactions/{payment_id}/sync", response_model=BillingSyncResponse)
def sync_transaction(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BillingSyncResponse:
    transaction = _get_transaction_for_user(db, current_user, payment_id)
    if transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Платеж не найден.")
    return _sync_transaction_record(transaction=transaction, current_user=current_user, db=db)


@router.post("/transactions/unitpay/{unitpay_payment_id}/sync", response_model=BillingSyncResponse)
def sync_transaction_by_unitpay_payment_id(
    unitpay_payment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BillingSyncResponse:
    transaction = _get_transaction_for_user_by_unitpay_id(db, current_user, unitpay_payment_id)
    if transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Платеж не найден.")
    return _sync_transaction_record(transaction=transaction, current_user=current_user, db=db)


@router.post("/transactions/stripe/session/{session_id}/sync", response_model=BillingSyncResponse)
def sync_transaction_by_stripe_session_id(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BillingSyncResponse:
    transaction = (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.stripe_checkout_session_id == session_id,
            PaymentTransaction.user_id == current_user.id,
        )
        .first()
    )
    if transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found.")

    stripe = StripeBillingClient()
    session_payload = stripe.retrieve_checkout_session(session_id)
    subscription = _apply_stripe_checkout_session(db=db, session_payload=session_payload, transaction=transaction)
    log_billing_event(
        db,
        source="api",
        event_type="stripe_checkout_synced",
        user_id=current_user.id,
        subscription_id=subscription.id,
        payment_id=transaction.id,
        payload={"stripeCheckoutSessionId": session_id},
    )
    db.commit()
    db.refresh(subscription)
    return BillingSyncResponse(subscription=build_subscription_response(subscription), syncedAt=datetime.now(timezone.utc))


@router.post("/stripe/webhook")
async def handle_stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    stripe = StripeBillingClient()
    raw_body = await request.body()
    event = stripe.verify_webhook_event(raw_body, request.headers.get("stripe-signature"))
    event_type = str(event.get("type") or "")
    event_object = (event.get("data") or {}).get("object") or {}

    subscription = None
    transaction = None
    if event_type == "checkout.session.completed":
        session_payload = event_object
        session_id = str(session_payload.get("id") or "")
        if session_id:
            transaction = db.query(PaymentTransaction).filter(PaymentTransaction.stripe_checkout_session_id == session_id).first()
        subscription = _apply_stripe_checkout_session(db=db, session_payload=session_payload, transaction=transaction)
    elif event_type in {"customer.subscription.updated", "customer.subscription.deleted"}:
        stripe_subscription_id = str(event_object.get("id") or "")
        subscription = db.query(UserSubscription).filter(UserSubscription.stripe_subscription_id == stripe_subscription_id).first()
        if subscription is not None:
            price_id = _extract_stripe_price_id(event_object)
            plan = _get_plan_by_stripe_price_id(db, price_id) or subscription.plan
            apply_stripe_subscription_state(subscription, plan, stripe_subscription=event_object)
            db.add(subscription)
    elif event_type in {"invoice.payment_succeeded", "invoice.payment_failed"}:
        stripe_subscription_id = str(event_object.get("subscription") or "")
        subscription = db.query(UserSubscription).filter(UserSubscription.stripe_subscription_id == stripe_subscription_id).first()
        if subscription is not None:
            if event_type == "invoice.payment_succeeded":
                subscription.status = "active"
                subscription.last_payment_status = "success"
                subscription.last_payment_at = datetime.now(timezone.utc)
            else:
                subscription.status = "past_due"
                subscription.last_payment_status = "error"
            subscription.last_synced_at = datetime.now(timezone.utc)
            db.add(subscription)

    log_billing_event(
        db,
        source="stripe",
        event_type=event_type or "unknown",
        user_id=subscription.user_id if subscription is not None else None,
        subscription_id=subscription.id if subscription is not None else None,
        payment_id=transaction.id if transaction is not None else None,
        payload={"eventId": event.get("id"), "type": event_type},
    )
    db.commit()
    return {"received": True}


@router.get("/unitpay/callback")
def handle_unitpay_callback(
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    unitpay = UnitPayClient()
    method, params = _normalize_callback_params(request)
    signature = params.get("signature")
    client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else None)

    if not unitpay.validate_callback_ip(client_ip):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="UnitPay IP is not allowed.")
    if not unitpay.verify_callback_signature(method=method, params=params, signature=signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid UnitPay signature.")

    unitpay_payment_id = params.get("unitpayId")
    unitpay_subscription_id = params.get("subscriptionId")
    account = params.get("account")
    payment_sum = params.get("orderSum")

    transaction = None
    if unitpay_payment_id:
        transaction = db.query(PaymentTransaction).filter(PaymentTransaction.unitpay_payment_id == str(unitpay_payment_id)).first()

    current_user = None
    subscription = None
    if transaction is not None:
        current_user = transaction.user
        subscription = transaction.subscription or db.query(UserSubscription).filter(UserSubscription.user_id == transaction.user_id).first()
    elif account:
        current_user = db.query(User).filter(User.id == str(account)).first()
        if current_user:
            subscription = ensure_default_subscription(db, current_user)

    if current_user is None or subscription is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Billing target not found.")

    if transaction is None:
        transaction = PaymentTransaction(
            user_id=current_user.id,
            subscription_id=subscription.id,
            plan_id=subscription.plan_id,
            kind="callback",
            status="pending",
            unitpay_payment_id=str(unitpay_payment_id) if unitpay_payment_id else None,
            unitpay_subscription_id=str(unitpay_subscription_id) if unitpay_subscription_id else None,
            amount=float(payment_sum or 0),
            currency=str(params.get("orderCurrency") or subscription.plan.currency),
            description=str(params.get("desc") or "UnitPay callback payment"),
            is_test=str(params.get("test") or "0") == "1",
            raw_callback=params,
        )
        db.add(transaction)
        db.flush()

    transaction.raw_callback = params
    transaction.unitpay_subscription_id = str(unitpay_subscription_id) if unitpay_subscription_id else transaction.unitpay_subscription_id
    transaction.processed_at = datetime.now(timezone.utc)

    if method == "pay":
        transaction.status = "success"
        apply_successful_payment(
            subscription,
            transaction,
            unitpay_subscription_id=str(unitpay_subscription_id) if unitpay_subscription_id else None,
            payment_time=transaction.processed_at,
        )
    elif method == "error":
        transaction.status = "error"
        transaction.error_message = str(params.get("errorMessage") or "Payment error")
        mark_payment_failed(subscription, error_message=transaction.error_message)
    elif method == "preauth":
        transaction.status = "preauth"
        subscription.last_synced_at = datetime.now(timezone.utc)
    else:
        transaction.status = "check"
        subscription.last_synced_at = datetime.now(timezone.utc)

    log_billing_event(
        db,
        source="callback",
        event_type=f"unitpay_{method or 'unknown'}",
        user_id=current_user.id,
        subscription_id=subscription.id,
        payment_id=transaction.id,
        payload=params,
    )
    db.add(transaction)
    db.add(subscription)
    db.commit()

    return {"result": {"message": "Запрос успешно обработан"}}
