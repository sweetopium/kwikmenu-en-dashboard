from __future__ import annotations

import shutil
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import get_settings
from app.core.paths import UPLOADS_ROOT
from app.core.slugs import slugify
from app.db.session import SessionLocal
from app.models import Menu, MenuImportJob, MenuImportSource, User, Venue
from app.schemas.menu_import import (
    MenuImportAcceptedResponse,
    MenuImportJobResponse,
    MenuImportResult,
    MenuImportStatus,
    UploadedSource,
)
from app.services.menu_import_pipeline import MenuImportPipeline
from app.services.page_normalizer import IMAGE_EXTENSIONS, PDF_EXTENSION


router = APIRouter(prefix="/api/menu-imports", tags=["menu-imports"])
pipeline = MenuImportPipeline()


@router.post("", response_model=MenuImportAcceptedResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_menu_import(
    request: Request,
    background_tasks: BackgroundTasks,
    files: list[UploadFile] | None = File(default=None),
    menu_source: str = Form(default="file"),
    menu_link: str | None = Form(default=None),
    venue_id: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MenuImportAcceptedResponse:
    uploaded_files = files or []
    context = await _extract_context(request)
    if not uploaded_files and not (menu_source == "link" and menu_link):
        raise HTTPException(status_code=400, detail="Provide files or a menu_link to start an import job.")

    resolved_venue_id = _resolve_venue_id(db, user_id=current_user.id, requested_venue_id=venue_id)

    job = MenuImportJob(
        user_id=current_user.id,
        venue_id=resolved_venue_id,
        upload_dir="",
        menu_source=menu_source,
        menu_link=menu_link,
        context=context,
        status=MenuImportStatus.accepted.value,
        warnings=[],
        used_fallback=False,
    )
    db.add(job)
    db.flush()

    upload_dir = UPLOADS_ROOT / job.id
    upload_dir.mkdir(parents=True, exist_ok=True)
    job.upload_dir = str(upload_dir)

    for uploaded_file in uploaded_files:
        target_path = upload_dir / uploaded_file.filename
        with target_path.open("wb") as buffer:
            shutil.copyfileobj(uploaded_file.file, buffer)

        kind = _detect_source_kind(target_path)
        size_bytes = target_path.stat().st_size
        db.add(
            MenuImportSource(
                job_id=job.id,
                name=uploaded_file.filename,
                kind=kind,
                mime_type=uploaded_file.content_type,
                size_bytes=size_bytes,
            )
        )

    db.add(job)
    db.commit()
    db.refresh(job)

    background_tasks.add_task(process_job, job.id)

    settings = get_settings()
    return MenuImportAcceptedResponse(
        jobId=job.id,
        status=MenuImportStatus(job.status),
        pollUrl=f"{settings.menu_import_api_url}/api/menu-imports/{job.id}",
        createdAt=job.created_at,
    )


@router.get("/{job_id}", response_model=MenuImportJobResponse)
def get_menu_import(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MenuImportJobResponse:
    job = (
        db.query(MenuImportJob)
        .filter(MenuImportJob.id == job_id, MenuImportJob.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Menu import job not found.")
    return serialize_job(job)


def process_job(job_id: str) -> None:
    db = SessionLocal()
    try:
        job = db.query(MenuImportJob).filter(MenuImportJob.id == job_id).first()
        if job is None:
            return

        job.status = MenuImportStatus.processing.value
        job.started_at = datetime.now(timezone.utc)
        db.add(job)
        db.commit()
        db.refresh(job)

        sources = [
            UploadedSource(
                name=source.name,
                kind=source.kind,
                mimeType=source.mime_type,
                sizeBytes=source.size_bytes,
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

        venue = _ensure_job_venue(db, job=job, result=result)
        menu = Menu(
            venue_id=venue.id,
            name=result.menu.menuMeta.name,
            slug=slugify(result.menu.menuMeta.slug or result.menu.menuMeta.name, fallback=f"menu-{job.id}"),
            description=result.menu.menuMeta.description,
            status="draft",
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
        db.add(job)
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        job = db.query(MenuImportJob).filter(MenuImportJob.id == job_id).first()
        if job is not None:
            job.status = MenuImportStatus.failed.value
            job.completed_at = datetime.now(timezone.utc)
            job.error = str(exc)
            db.add(job)
            db.commit()
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
                )
                for source in job.sources
            ],
            categoryCount=job.category_count or 0,
            itemCount=job.item_count or 0,
            documentCount=job.document_count or 0,
            usedFallback=job.used_fallback,
            warnings=job.warnings or [],
        )

    return MenuImportJobResponse(
        jobId=job.id,
        status=MenuImportStatus(job.status),
        createdAt=job.created_at,
        updatedAt=job.updated_at,
        startedAt=job.started_at,
        completedAt=job.completed_at,
        error=job.error,
        result=result,
    )


def _ensure_job_venue(db: Session, *, job: MenuImportJob, result: MenuImportResult) -> Venue:
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
        or "Новое заведение"
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


def _resolve_venue_id(db: Session, *, user_id: str, requested_venue_id: str | None) -> str | None:
    if requested_venue_id:
        venue = db.query(Venue).filter(Venue.id == requested_venue_id, Venue.owner_user_id == user_id).first()
        if venue is None:
            raise HTTPException(status_code=404, detail="Venue not found.")
        return venue.id

    venues = db.query(Venue).filter(Venue.owner_user_id == user_id).order_by(Venue.created_at.asc()).all()
    if len(venues) == 1:
        return venues[0].id
    return None


async def _extract_context(request: Request) -> dict[str, str]:
    form = await request.form()
    reserved = {"files", "menu_source", "menu_link", "venue_id"}
    context: dict[str, str] = {}
    for key, value in form.multi_items():
        if key in reserved or isinstance(value, UploadFile):
            continue
        text_value = str(value).strip()
        if text_value:
            context[key] = text_value
    return context


def _detect_source_kind(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == PDF_EXTENSION:
        return "pdf"
    if suffix in IMAGE_EXTENSIONS:
        return "image"
    return "file"
