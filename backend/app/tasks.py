from app.celery_app import celery_app
from app.core.config import get_settings
from app.services.menu_import_jobs import process_menu_import_job


settings = get_settings()


@celery_app.task(
    name="menu_import.process_job",
    soft_time_limit=settings.menu_import_task_soft_time_limit_seconds,
    time_limit=settings.menu_import_task_hard_time_limit_seconds,
)
def process_menu_import_job_task(job_id: str) -> None:
    process_menu_import_job(job_id)


@celery_app.task(name="email_campaign.send_scheduled_email")
def send_scheduled_email_task(scheduled_email_id: str) -> None:
    from app.db.session import SessionLocal
    from app.services.email_campaign import email_campaign_service
    
    with SessionLocal() as db:
        email_campaign_service.send_scheduled_email(db, scheduled_email_id)

