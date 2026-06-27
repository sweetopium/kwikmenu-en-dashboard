from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path

from celery.exceptions import SoftTimeLimitExceeded

from app.core.slugs import slugify
from app.db.session import SessionLocal
from app.models import Menu, MenuImportJob, User, Venue
from app.schemas.menu_import import (
    MenuImportJobResponse,
    MenuImportResult,
    MenuImportStatus,
    UploadedSource,
)
from app.services.menu_import_pipeline import MenuImportPipeline
from app.services.billing import assert_can_create_menu_for_venue, assert_menu_within_plan_limits, get_effective_subscription
from app.services.help_request_notifications import (
    send_menu_import_failure_to_telegram,
    send_menu_import_success_to_telegram,
)
from app.services.product_analytics import record_product_event


logger = logging.getLogger(__name__)
pipeline = MenuImportPipeline()


def process_menu_import_job(job_id: str) -> None:
    db = SessionLocal()
    try:
        job = db.query(MenuImportJob).filter(MenuImportJob.id == job_id).first()
        if job is None:
            return

        if job.status == MenuImportStatus.completed.value and job.menu_id:
            logger.info("Skipping already completed menu import job job_id=%s", job.id)
            return

        logger.info(
            "Starting menu import job job_id=%s user_id=%s source_count=%s menu_source=%s menu_link=%s",
            job.id,
            job.user_id,
            len(job.sources),
            job.menu_source,
            bool(job.menu_link),
        )

        job.status = MenuImportStatus.processing.value
        job.started_at = datetime.now(timezone.utc)
        job.completed_at = None
        job.error = None
        db.add(job)
        db.commit()
        db.refresh(job)

        sources = [
            UploadedSource(
                name=source.name,
                kind=source.kind,
                mimeType=source.mime_type,
                sizeBytes=source.size_bytes,
                storageKey=source.storage_key,
                publicUrl=source.public_url,
            )
            for source in job.sources
        ]

        result = pipeline.run(
            upload_dir=Path(job.upload_dir),
            menu_source=job.menu_source,
            menu_link=job.menu_link,
            context=job.context,
            sources=sources,
        )

        user = db.query(User).filter(User.id == job.user_id).first()
        venue = _ensure_job_venue(db, job=job, result=result)
        subscription = get_effective_subscription(db, user)
        assert_can_create_menu_for_venue(db, subscription, venue.id)
        assert_menu_within_plan_limits(subscription, result.menu)
        menu = Menu(
            venue_id=venue.id,
            name=result.menu.menuMeta.name,
            slug=slugify(result.menu.menuMeta.slug or result.menu.menuMeta.name, fallback=f"menu-{job.id}"),
            description=result.menu.menuMeta.description,
            status="active",
            payload=result.menu.model_dump(mode="json"),
        )
        db.add(menu)
        db.flush()

        job.venue_id = venue.id
        job.menu_id = menu.id
        job.status = MenuImportStatus.completed.value
        job.completed_at = datetime.now(timezone.utc)
        job.error = None
        job.warnings = result.warnings
        job.category_count = result.categoryCount
        job.item_count = result.itemCount
        job.document_count = result.documentCount
        job.used_fallback = result.usedFallback
        record_product_event(
            db,
            event_name="menu_import_completed",
            source="backend",
            user=user,
            venue_id=venue.id,
            menu_id=menu.id,
            properties={
                "job_id": job.id,
                "menu_source": job.menu_source,
                "category_count": job.category_count,
                "item_count": job.item_count,
                "document_count": job.document_count,
                "used_fallback": job.used_fallback,
                "warnings_count": len(job.warnings or []),
                "flow": job.context.get("flow"),
            },
        )
        db.add(job)
        db.commit()
        delivered, message_id, telegram_error = send_menu_import_success_to_telegram(
            job=job,
            user=user,
            venue=venue,
        )
        if not delivered:
            logger.warning(
                "Menu import success Telegram notification failed job_id=%s error=%s",
                job.id,
                telegram_error,
            )
        else:
            logger.info(
                "Menu import success Telegram notification sent job_id=%s message_id=%s",
                job.id,
                message_id,
            )
        logger.info(
            "Completed menu import job job_id=%s menu_id=%s categories=%s items=%s warnings=%s used_fallback=%s",
            job.id,
            menu.id,
            job.category_count,
            job.item_count,
            job.warnings,
            job.used_fallback,
        )
    except SoftTimeLimitExceeded:
        db.rollback()
        _mark_job_failed(
            db,
            job_id=job_id,
            status=MenuImportStatus.timed_out,
            error_message=(
                "Menu recognition took too long and was stopped. Try uploading fewer pages, "
                "splitting the menu into several files, or repeating the import later."
            ),
        )
        logger.exception("Menu import job timed out job_id=%s", job_id)
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        _mark_job_failed(
            db,
            job_id=job_id,
            status=MenuImportStatus.failed,
            error_message=str(exc),
        )
        logger.exception("Menu import job failed job_id=%s error=%s", job_id, exc)
    finally:
        db.close()


def serialize_job(job: MenuImportJob) -> MenuImportJobResponse:
    result: MenuImportResult | None = None
    if job.status == MenuImportStatus.completed.value and job.menu is not None:
        payload = job.menu.payload
        result = MenuImportResult(
            menuId=job.menu.id,
            menu=payload,
            sourceSummary=[
                UploadedSource(
                    name=source.name,
                    kind=source.kind,
                    mimeType=source.mime_type,
                    sizeBytes=source.size_bytes,
                    storageKey=source.storage_key,
                    publicUrl=source.public_url,
                )
                for source in job.sources
            ],
            categoryCount=job.category_count or 0,
            itemCount=job.item_count or 0,
            documentCount=job.document_count or 0,
            usedFallback=job.used_fallback,
            warnings=job.warnings or [],
        )

    status_value = job.status
    if status_value == MenuImportStatus.accepted.value:
        status_value = MenuImportStatus.queued.value

    return MenuImportJobResponse(
        jobId=job.id,
        status=MenuImportStatus(status_value),
        createdAt=job.created_at,
        updatedAt=job.updated_at,
        startedAt=job.started_at,
        completedAt=job.completed_at,
        error=job.error,
        result=result,
    )


def _mark_job_failed(
    db,
    *,
    job_id: str,
    status: MenuImportStatus,
    error_message: str,
) -> None:
    job = db.query(MenuImportJob).filter(MenuImportJob.id == job_id).first()
    if job is None:
        return

    job.status = status.value
    job.completed_at = datetime.now(timezone.utc)
    job.error = error_message
    user = db.query(User).filter(User.id == job.user_id).first()
    venue = db.query(Venue).filter(Venue.id == job.venue_id).first() if job.venue_id else None
    record_product_event(
        db,
        event_name="menu_import_failed",
        source="backend",
        user=user,
        venue_id=job.venue_id,
        menu_id=job.menu_id,
        properties={
            "job_id": job.id,
            "status": status.value,
            "menu_source": job.menu_source,
            "flow": job.context.get("flow"),
        },
    )
    db.add(job)
    db.commit()
    delivered, message_id, telegram_error = send_menu_import_failure_to_telegram(
        job=job,
        user=user,
        venue=venue,
        error_message=error_message,
    )
    if not delivered:
        logger.warning(
            "Menu import failure Telegram notification failed job_id=%s error=%s",
            job.id,
            telegram_error,
        )
    else:
        logger.info(
            "Menu import failure Telegram notification sent job_id=%s message_id=%s",
            job.id,
            message_id,
        )


def _ensure_job_venue(db, *, job: MenuImportJob, result: MenuImportResult) -> Venue:
    if job.venue_id:
        venue = (
            db.query(Venue)
            .filter(Venue.id == job.venue_id, Venue.owner_user_id == job.user_id)
            .first()
        )
        if venue is not None:
            return venue

    venue_name = (
        job.context.get("restaurant_name")
        or result.menu.venue.name
        or result.menu.menuMeta.name
        or "New venue"
    )
    venue = Venue(
        owner_user_id=job.user_id,
        name=venue_name,
        phone=job.context.get("contact_phone"),
        country=job.context.get("country"),
        city=job.context.get("city"),
        description=result.menu.venue.description,
    )
    db.add(venue)
    db.flush()
    return venue
