from celery import Celery

from app.core.config import get_settings


settings = get_settings()

celery_app = Celery(
    "kwikmenu",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_default_queue="menu_imports",
    task_track_started=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
)

celery_app.autodiscover_tasks(["app"])
