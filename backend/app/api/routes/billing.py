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
from app.services.billing import (
    apply_successful_payment,
    build_plan_response,
    build_subscription_response,
    build_transaction_response,
    build_usage_response,
    ensure_default_subscription,
    get_public_plans,
    log_billing_event,
    mark_payment_failed,
)
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Тариф не найден.")

    unitpay = UnitPayClient()
    description = f"Подписка на сервис KwikMenu тариф: {plan.name}"
    amount = float(plan.price_amount)
    result = unitpay.init_subscription_payment(
        account=current_user.id,
        sum_amount=amount,
        description=description,
        subscription=True,
    )

    transaction = PaymentTransaction(
        user_id=current_user.id,
        subscription_id=subscription.id,
        plan_id=plan.id,
        kind="initial",
        status="pending",
        unitpay_payment_id=result.payment_id,
        amount=amount,
        currency=plan.currency,
        description=description,
        checkout_url=result.redirect_url,
        receipt_url=result.receipt_url,
        status_url=result.status_url,
        is_test=unitpay.settings.unitpay_test_mode,
        raw_request={
            "account": current_user.id,
            "description": description,
            "planCode": plan.code,
            "subscription": True,
        },
        raw_response=result.payload,
    )
    db.add(transaction)
    db.flush()
    log_billing_event(
        db,
        source="api",
        event_type="checkout_created",
        user_id=current_user.id,
        subscription_id=subscription.id,
        payment_id=transaction.id,
        payload={"planCode": plan.code, "unitpayPaymentId": transaction.unitpay_payment_id},
    )
    db.commit()
    db.refresh(transaction)
    return BillingCheckoutResponse(
        transaction=build_transaction_response(transaction),
        redirectUrl=result.redirect_url,
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

    description = f"Подписка на сервис KwikMenu тариф: {plan.name}"
    amount = float(plan.price_amount)
    result = unitpay.init_subscription_payment(
        account=current_user.id,
        sum_amount=amount,
        description=description,
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
    unitpay = UnitPayClient()
    if subscription.unitpay_subscription_id and unitpay.enabled:
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
        payload={"unitpaySubscriptionId": subscription.unitpay_subscription_id},
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
