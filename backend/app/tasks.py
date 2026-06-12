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


@celery_app.task(
    name="email_campaign.send_scheduled_email",
    bind=True,
    max_retries=3,
    default_retry_delay=2,
)
def send_scheduled_email_task(self, scheduled_email_id: str) -> None:
    from app.db.session import SessionLocal
    from app.services.email_campaign import email_campaign_service
    from app.models.email_campaign import ScheduledEmail
    
    with SessionLocal() as db:
        scheduled_email = db.query(ScheduledEmail).filter(ScheduledEmail.id == scheduled_email_id).first()
        if not scheduled_email:
            raise self.retry(exc=ValueError(f"Scheduled email {scheduled_email_id} not found in DB yet."))
        email_campaign_service.send_scheduled_email(db, scheduled_email_id)


