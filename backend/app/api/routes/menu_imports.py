from __future__ import annotations

import hashlib
import logging
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.tasks import process_menu_import_job_task
from app.core.config import get_settings
from app.core.paths import UPLOADS_ROOT
from app.models import MenuImportJob, MenuImportSource, User, Venue
from app.schemas.menu_import import (
    MenuImportAcceptedResponse,
    MenuImportJobResponse,
    MenuImportStatus,
)
from app.services.menu_import_jobs import serialize_job
from app.services.pdf_link_downloader import PdfLinkDownloadError, download_pdf_from_url
from app.services.page_normalizer import IMAGE_EXTENSIONS, PDF_EXTENSION


router = APIRouter(prefix="/api/menu-imports", tags=["menu-imports"])
logger = logging.getLogger(__name__)


@router.post("", response_model=MenuImportAcceptedResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_menu_import(
    request: Request,
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
        status=MenuImportStatus.queued.value,
        warnings=[],
        used_fallback=False,
    )
    db.add(job)
    db.flush()

    upload_dir = UPLOADS_ROOT / job.id
    upload_dir.mkdir(parents=True, exist_ok=True)
    job.upload_dir = str(upload_dir)

    if menu_source == "link" and menu_link:
        try:
            downloaded_pdf = download_pdf_from_url(url=menu_link, target_dir=upload_dir)
        except PdfLinkDownloadError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        logger.info(
            "Downloaded menu import PDF from link job_id=%s user_id=%s file=%s size=%s sha256=%s",
            job.id,
            current_user.id,
            downloaded_pdf.file_name,
            downloaded_pdf.size_bytes,
            downloaded_pdf.sha256,
        )
        db.add(
            MenuImportSource(
                job_id=job.id,
                name=downloaded_pdf.file_name,
                kind="pdf",
                mime_type=downloaded_pdf.mime_type,
                size_bytes=downloaded_pdf.size_bytes,
            )
        )

    for uploaded_file in uploaded_files:
        target_path = upload_dir / uploaded_file.filename
        with target_path.open("wb") as buffer:
            shutil.copyfileobj(uploaded_file.file, buffer)

        kind = _detect_source_kind(target_path)
        size_bytes = target_path.stat().st_size
        file_sha256 = _sha256_file(target_path)
        logger.info(
            "Saved menu import upload job_id=%s user_id=%s file=%s kind=%s content_type=%s size=%s sha256=%s",
            job.id,
            current_user.id,
            uploaded_file.filename,
            kind,
            uploaded_file.content_type,
            size_bytes,
            file_sha256,
        )
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

    try:
        process_menu_import_job_task.delay(job.id)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to enqueue menu import job job_id=%s error=%s", job.id, exc)
        job.status = MenuImportStatus.failed.value
        job.error = "Сервис импорта сейчас недоступен. Попробуйте повторить загрузку через минуту."
        db.add(job)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Menu import queue is temporarily unavailable.",
        ) from exc

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


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


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
