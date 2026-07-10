from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path

from celery.exceptions import SoftTimeLimitExceeded

from app.db.session import SessionLocal
from app.models import TemporaryMenuImport
from app.schemas.menu import MenuPayload
from app.schemas.menu_import import MenuImportStatus, MenuImportResult, UploadedSource
from app.schemas.temporary_menu import TemporaryMenuJobResponse, TemporaryMenuResult
from app.services.menu_import_pipeline import MenuImportPipeline


logger = logging.getLogger(__name__)
pipeline = MenuImportPipeline()


def process_temporary_menu_import_job(job_id: str) -> None:
    db = SessionLocal()
    try:
        job = db.query(TemporaryMenuImport).filter(TemporaryMenuImport.id == job_id).first()
        if job is None:
            return

        if job.status == MenuImportStatus.completed.value and job.payload:
            logger.info("Skipping already completed temporary menu import job_id=%s", job.id)
            return

        job.status = MenuImportStatus.processing.value
        job.started_at = datetime.now(timezone.utc)
        job.completed_at = None
        job.error = None
        db.add(job)
        db.commit()
        db.refresh(job)

        sources = _build_processing_sources(job)
        result = pipeline.run(
            upload_dir=Path(job.upload_dir),
            menu_source=job.menu_source,
            menu_link=job.menu_link,
            context=_build_context(job),
            sources=sources,
        )

        payload = result.menu.model_copy(
            update={
                "currency": job.currency or result.menu.currency or "USD",
                "settings": result.menu.settings.model_copy(update={"templateType": "extended"}),
            }
        )
        payload = _enrich_temporary_menu_description(job=job, menu=payload, warnings=result.warnings)

        job.payload = payload.model_dump(mode="json")
        job.status = MenuImportStatus.completed.value
        job.completed_at = datetime.now(timezone.utc)
        job.error = None
        job.warnings = result.warnings
        job.category_count = result.categoryCount
        job.item_count = result.itemCount
        job.document_count = result.documentCount
        job.used_fallback = result.usedFallback
        db.add(job)
        db.commit()
        logger.info(
            "Completed temporary menu import job_id=%s categories=%s items=%s used_fallback=%s",
            job.id,
            job.category_count,
            job.item_count,
            job.used_fallback,
        )
    except SoftTimeLimitExceeded:
        db.rollback()
        _mark_job_failed(
            db,
            job_id=job_id,
            status=MenuImportStatus.timed_out,
            error_message="Menu recognition took too long. Try fewer pages or a clearer upload.",
        )
        logger.exception("Temporary menu import job timed out job_id=%s", job_id)
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        _mark_job_failed(db, job_id=job_id, status=MenuImportStatus.failed, error_message=str(exc))
        logger.exception("Temporary menu import job failed job_id=%s error=%s", job_id, exc)
    finally:
        db.close()


def serialize_temporary_menu_job(job: TemporaryMenuImport) -> TemporaryMenuJobResponse:
    result: TemporaryMenuResult | None = None
    if job.status == MenuImportStatus.completed.value and job.payload:
        result = TemporaryMenuResult(
            id=job.id,
            menu=MenuPayload.model_validate(job.payload),
            sourceSummary=_serialize_sources(job),
            categoryCount=job.category_count or 0,
            itemCount=job.item_count or 0,
            documentCount=job.document_count or 0,
            usedFallback=job.used_fallback,
            warnings=job.warnings or [],
        )

    return TemporaryMenuJobResponse(
        id=job.id,
        status=MenuImportStatus(job.status),
        publicPath=f"/tmp/{job.id}",
        createdAt=job.created_at,
        updatedAt=job.updated_at,
        startedAt=job.started_at,
        completedAt=job.completed_at,
        error=job.error,
        result=result,
    )


def build_public_temporary_menu_payload(job: TemporaryMenuImport) -> dict:
    if job.status != MenuImportStatus.completed.value or not job.payload:
        raise ValueError("Temporary menu is not ready.")

    menu_payload = MenuPayload.model_validate(job.payload).model_dump(mode="json")
    venue_name = job.restaurant_name or menu_payload.get("venue", {}).get("name") or menu_payload.get("menuMeta", {}).get("name") or "Demo menu"
    return {
        "temporaryMenu": {
            "id": job.id,
            "status": job.status,
            "createdAt": job.created_at,
            "completedAt": job.completed_at,
        },
        "venue": {
            "id": job.id,
            "name": venue_name,
            "phone": job.contact_phone,
            "city": job.city,
            "country": job.country,
            "description": menu_payload.get("venue", {}).get("description") or "Temporary digital menu preview",
            "wifi": {"enabled": False, "ssid": "", "password": ""},
            "design": {"template": "extended", "accentColor": "#6d67eb", "logoUrl": None},
        },
        "menus": [
            {
                "id": job.id,
                "name": menu_payload.get("menuMeta", {}).get("name") or venue_name,
                "status": "active",
                "payload": menu_payload,
            }
        ],
    }


def _build_processing_sources(job: TemporaryMenuImport) -> list[UploadedSource]:
    if job.combined_pdf_name:
        combined_source = next((source for source in job.sources if source.name == job.combined_pdf_name), None)
        if combined_source:
            return [
                UploadedSource(
                    name=combined_source.name,
                    kind=combined_source.kind,
                    mimeType=combined_source.mime_type,
                    sizeBytes=combined_source.size_bytes,
                    storageKey=combined_source.storage_key,
                    publicUrl=combined_source.public_url,
                )
            ]

    return _serialize_sources(job)


def _serialize_sources(job: TemporaryMenuImport) -> list[UploadedSource]:
    return [
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


def _build_context(job: TemporaryMenuImport) -> dict[str, str]:
    context = {
        "flow": "magic_demo",
        "restaurant_name": job.restaurant_name or "Demo venue",
        "contact_phone": job.contact_phone or "",
        "city": job.city or "",
        "country": job.country or "",
        "currency": job.currency or "",
    }
    return {key: value for key, value in context.items() if value}


def _enrich_temporary_menu_description(*, job: TemporaryMenuImport, menu: MenuPayload, warnings: list[str]) -> MenuPayload:
    try:
        description = pipeline.openrouter.generate_venue_description(
            menu=menu,
            venue_name=job.restaurant_name or menu.venue.name or menu.menuMeta.name,
            city=job.city,
            country=job.country,
        )
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"Venue description enrichment skipped: {exc}")
        return menu

    if not description:
        return menu

    return menu.model_copy(
        update={
            "venue": menu.venue.model_copy(update={"description": description}),
            "menuMeta": menu.menuMeta.model_copy(update={"description": menu.menuMeta.description or description}),
        }
    )


def _mark_job_failed(db, *, job_id: str, status: MenuImportStatus, error_message: str) -> None:
    job = db.query(TemporaryMenuImport).filter(TemporaryMenuImport.id == job_id).first()
    if job is None:
        return
    job.status = status.value
    job.completed_at = datetime.now(timezone.utc)
    job.error = error_message
    db.add(job)
    db.commit()
