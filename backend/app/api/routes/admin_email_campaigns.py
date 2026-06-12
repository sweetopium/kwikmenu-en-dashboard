from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.routes.admin import AdminAccess
from app.models.auth import User
from app.models.email_campaign import EmailCampaignStep, ScheduledEmail
from app.services.email_campaign import email_campaign_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/email-campaigns", tags=["admin-email-campaigns"])


class EmailCampaignStepPayload(BaseModel):
    stepNumber: int = Field(..., alias="step_number")
    name: str = Field(..., max_length=255)
    delayHours: int = Field(..., alias="delay_hours", ge=0)
    subject: str = Field(..., max_length=255)
    bodyHtml: str = Field(..., alias="body_html")
    conditionRule: str = Field("always", alias="condition_rule", max_length=64)
    isActive: bool = Field(True, alias="is_active")

    class Config:
        populate_by_name = True


def _serialize_step(step: EmailCampaignStep) -> dict[str, Any]:
    return {
        "id": step.id,
        "step_number": step.step_number,
        "name": step.name,
        "delay_hours": step.delay_hours,
        "subject": step.subject,
        "body_html": step.body_html,
        "condition_rule": step.condition_rule,
        "is_active": step.is_active,
        "created_at": step.created_at,
        "updated_at": step.updated_at,
    }


@router.get("/steps")
def list_steps(
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    steps = db.query(EmailCampaignStep).order_by(EmailCampaignStep.step_number.asc()).all()
    if not steps:
        default_steps = [
            EmailCampaignStep(
                step_number=1,
                name="Добро пожаловать (сразу)",
                delay_hours=0,
                subject="Добро пожаловать в KwikMenu!",
                body_html="""<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
  <h2 style="color: #6d67eb;">Приветствуем в KwikMenu, {{name}}!</h2>
  <p>Мы рады, что вы присоединились к нам. KwikMenu поможет вашему ресторану создать стильное бесконтактное интерактивное меню по QR-коду за считанные минуты.</p>
  <p>Чтобы начать работу, перейдите в ваш личный кабинет:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_url}}" style="background-color: #6d67eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Начать настройку</a>
  </div>
  <p>Если возникнут вопросы, просто ответьте на это письмо — наша поддержка всегда на связи!</p>
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 12px; color: #888;">Вы получили это письмо, так как зарегистрировались на сайте KwikMenu.ru</p>
</div>""",
                condition_rule="always",
                is_active=True,
            ),
            EmailCampaignStep(
                step_number=2,
                name="Напоминание (через 24 часа)",
                delay_hours=24,
                subject="Создайте ваше заведение в KwikMenu",
                body_html="""<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
  <h2 style="color: #6d67eb;">{{name}}, ваше меню еще не создано</h2>
  <p>Мы заметили, что вы зарегистрировались, но еще не добавили ваше первое заведение. Это займет всего 2 минуты!</p>
  <p>После создания заведения вы сможете:</p>
  <ul>
    <li>Добавить категории блюд и напитков.</li>
    <li>Загрузить фотографии.</li>
    <li>Скачать уникальный дизайн QR-кода для столов.</li>
  </ul>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_url}}" style="background-color: #6d67eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Создать заведение</a>
  </div>
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 12px; color: #888;">Если вы больше не хотите получать эти письма, вы можете отписаться.</p>
</div>""",
                condition_rule="no_venue",
                is_active=True,
            ),
            EmailCampaignStep(
                step_number=3,
                name="Напоминание о меню (через 72 часа)",
                delay_hours=72,
                subject="Добавьте блюда в меню",
                body_html="""<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
  <h2 style="color: #6d67eb;">{{name}}, добавьте меню в KwikMenu</h2>
  <p>Вы создали заведение, но в нем еще нет меню или категорий блюд. Давайте это исправим!</p>
  <p>Красивое и структурированное меню повышает средний чек заведения на 15-20% за счет легкого заказа и качественных фото.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_url}}" style="background-color: #6d67eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Заполнить меню</a>
  </div>
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 12px; color: #888;">С уважением, команда KwikMenu.</p>
</div>""",
                condition_rule="no_menu",
                is_active=True,
            )
        ]
        db.add_all(default_steps)
        db.commit()
        for s in default_steps:
            db.refresh(s)
        steps = default_steps
    return [_serialize_step(s) for s in steps]


@router.post("/steps", status_code=status.HTTP_201_CREATED)
def create_step(
    payload: EmailCampaignStepPayload,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    step = EmailCampaignStep(
        step_number=payload.stepNumber,
        name=payload.name,
        delay_hours=payload.delayHours,
        subject=payload.subject,
        body_html=payload.bodyHtml,
        condition_rule=payload.conditionRule,
        is_active=payload.isActive,
    )
    db.add(step)
    db.commit()
    db.refresh(step)
    return _serialize_step(step)


@router.put("/steps/{step_id}")
def update_step(
    step_id: str,
    payload: EmailCampaignStepPayload,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    step = db.query(EmailCampaignStep).filter(EmailCampaignStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found.")

    step.step_number = payload.stepNumber
    step.name = payload.name
    step.delay_hours = payload.delayHours
    step.subject = payload.subject
    step.body_html = payload.bodyHtml
    step.condition_rule = payload.conditionRule
    step.is_active = payload.isActive

    db.add(step)
    db.commit()
    db.refresh(step)
    return _serialize_step(step)


@router.delete("/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_step(
    step_id: str,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> Response:
    step = db.query(EmailCampaignStep).filter(EmailCampaignStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found.")
    db.delete(step)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/logs")
def get_logs(
    q: str | None = Query(default=None, description="Search user email or step name"),
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    # 1. Base query
    query = db.query(ScheduledEmail, User, EmailCampaignStep).join(
        User, User.id == ScheduledEmail.user_id
    ).outerjoin(
        EmailCampaignStep, EmailCampaignStep.id == ScheduledEmail.step_id
    )

    if q:
        pattern = f"%{q.strip()}%"
        query = query.filter(
            (User.email.ilike(pattern)) | 
            (EmailCampaignStep.name.ilike(pattern))
        )

    if status_filter:
        query = query.filter(ScheduledEmail.status == status_filter)

    total = query.count()
    items = query.order_by(ScheduledEmail.scheduled_at.desc()).offset(offset).limit(limit).all()

    # 2. Compute Dashboard statistics
    stats = {
        "pending": db.query(ScheduledEmail).filter(ScheduledEmail.status == "pending").count(),
        "sent": db.query(ScheduledEmail).filter(ScheduledEmail.status == "sent").count(),
        "failed": db.query(ScheduledEmail).filter(ScheduledEmail.status == "failed").count(),
        "skipped": db.query(ScheduledEmail).filter(ScheduledEmail.status == "skipped").count(),
        "cancelled": db.query(ScheduledEmail).filter(ScheduledEmail.status == "cancelled").count(),
        "delivery_delivered": db.query(ScheduledEmail).filter(ScheduledEmail.delivery_status == "delivered").count(),
        "delivery_opened": db.query(ScheduledEmail).filter(ScheduledEmail.delivery_status == "opened").count(),
        "delivery_bounce": db.query(ScheduledEmail).filter(ScheduledEmail.delivery_status.in_(["bounce", "bounced"])).count(),
        "delivery_spam": db.query(ScheduledEmail).filter(ScheduledEmail.delivery_status == "spam").count(),
    }

    return {
        "total": total,
        "stats": stats,
        "items": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "user_email": user.email,
                "user_name": user.name,
                "step_id": log.step_id,
                "step_name": step.name if step else "Deleted Step",
                "scheduled_at": log.scheduled_at,
                "sent_at": log.sent_at,
                "status": log.status,
                "delivery_status": log.delivery_status,
                "error_message": log.error_message,
                "unisender_message_id": log.unisender_message_id,
                "created_at": log.created_at,
            }
            for log, user, step in items
        ]
    }


@router.post("/logs/{log_id}/send-now")
def send_now(
    log_id: str,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    log = db.query(ScheduledEmail).filter(ScheduledEmail.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found.")

    if log.status == "sent":
        raise HTTPException(status_code=400, detail="Email was already sent.")

    # Force send now by resetting status to pending and running service
    log.status = "pending"
    log.scheduled_at = datetime.now(timezone.utc)
    db.add(log)
    db.commit()

    email_campaign_service.send_scheduled_email(db, log.id)
    db.refresh(log)

    return {
        "status": log.status,
        "sent_at": log.sent_at,
        "error_message": log.error_message,
        "delivery_status": log.delivery_status,
    }


@router.post("/logs/{log_id}/cancel")
def cancel_log(
    log_id: str,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    log = db.query(ScheduledEmail).filter(ScheduledEmail.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found.")

    if log.status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot cancel email in status: {log.status}")

    log.status = "cancelled"
    log.error_message = "Cancelled manually by admin."
    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "status": log.status,
        "error_message": log.error_message,
    }
