from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.routes.admin import require_admin_access
from app.models import SubscriptionPlan, UserSubscription
from app.schemas.billing import BillingPlanResponse, BillingPlanUpdateRequest
from app.services.billing import build_plan_response, renew_due_subscriptions


router = APIRouter(prefix="/api/admin/billing", tags=["admin-billing"])

AdminAccess = Depends(require_admin_access)


@router.get("/plans", response_model=list[BillingPlanResponse])
def list_billing_plans(
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> list[BillingPlanResponse]:
    plans = db.query(SubscriptionPlan).order_by(SubscriptionPlan.sort_order.asc(), SubscriptionPlan.created_at.asc()).all()
    return [build_plan_response(plan) for plan in plans]


@router.patch("/plans/{plan_id}", response_model=BillingPlanResponse)
def update_billing_plan(
    plan_id: str,
    payload: BillingPlanUpdateRequest,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> BillingPlanResponse:
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if plan is None:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    plan.name = payload.name.strip()
    plan.description = payload.description.strip() if payload.description else None
    plan.price_amount = payload.priceAmount
    plan.currency = payload.currency.strip().upper()
    plan.billing_period = payload.billingPeriod.strip()
    plan.is_active = payload.isActive
    plan.is_public = payload.isPublic
    plan.sort_order = payload.sortOrder
    plan.max_venues = payload.maxVenues
    plan.max_menus_per_venue = payload.maxMenusPerVenue
    plan.max_menu_items_per_menu = payload.maxMenuItemsPerMenu
    plan.ai_imports_per_month = payload.aiImportsPerMonth
    plan.public_menu_enabled = payload.publicMenuEnabled
    plan.translations_enabled = payload.translationsEnabled
    plan.max_translation_languages = payload.maxTranslationLanguages
    plan.analytics_enabled = payload.analyticsEnabled
    plan.qr_customization_enabled = payload.qrCustomizationEnabled
    plan.menu_design_customization_enabled = payload.menuDesignCustomizationEnabled
    plan.max_template_tier = payload.maxTemplateTier.strip().lower()
    plan.priority_support_enabled = payload.prioritySupportEnabled

    db.add(plan)
    db.commit()
    db.refresh(plan)
    return build_plan_response(plan)


@router.get("/subscriptions")
def list_billing_subscriptions(
    limit: int = Query(default=100, ge=1, le=500),
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    rows = (
        db.query(UserSubscription)
        .join(UserSubscription.user)
        .join(UserSubscription.plan)
        .order_by(UserSubscription.updated_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "items": [
            {
                "id": row.id,
                "userId": row.user_id,
                "email": row.user.email,
                "name": row.user.name,
                "planCode": row.plan.code,
                "planName": row.plan.name,
                "status": row.status,
                "cancelAtPeriodEnd": row.cancel_at_period_end,
                "currentPeriodEnd": row.current_period_end,
                "trialEndsAt": row.trial_ends_at,
                "lastPaymentAt": row.last_payment_at,
                "lastPaymentStatus": row.last_payment_status,
                "unitpaySubscriptionId": row.unitpay_subscription_id,
                "updatedAt": row.updated_at,
            }
            for row in rows
        ]
    }


@router.post("/process-renewals")
def process_due_renewals(
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    return renew_due_subscriptions(db)
