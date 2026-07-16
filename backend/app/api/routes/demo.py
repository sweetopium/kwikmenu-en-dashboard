from __future__ import annotations

import hashlib
import logging
import secrets
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import get_settings
from app.core.paths import UPLOADS_ROOT
from app.models import TemporaryMenuImport, TemporaryMenuImportSource
from app.schemas.menu_import import MenuImportStatus
from app.schemas.temporary_menu import (
    DemoTokenRequest,
    DemoTokenResponse,
    TemporaryMenuAcceptedResponse,
    TemporaryMenuJobResponse,
)
from app.services.object_storage import ObjectStorageClient
from app.services.page_normalizer import IMAGE_EXTENSIONS, PDF_EXTENSION
from app.services.pdf_link_downloader import PdfLinkDownloadError, download_pdf_from_url
from app.services.temporary_menu_jobs import build_public_temporary_menu_payload, serialize_temporary_menu_job
from app.tasks import process_temporary_menu_import_job_task


router = APIRouter(prefix="/api/demo", tags=["demo"])
logger = logging.getLogger(__name__)


@router.post("/auth/verify", response_model=DemoTokenResponse)
def verify_demo_token(payload: DemoTokenRequest) -> DemoTokenResponse:
    _assert_demo_token(payload.token)
    return DemoTokenResponse(ok=True)


@router.post("/imports", response_model=TemporaryMenuAcceptedResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_temporary_menu_import(
    request: Request,
    files: list[UploadFile] | None = File(default=None),
    menu_source: str = Form(default="file"),
    menu_link: str | None = Form(default=None),
    restaurant_name: str | None = Form(default=None),
    contact_phone: str | None = Form(default=None),
    city: str | None = Form(default=None),
    country: str | None = Form(default=None),
    currency: str = Form(default="USD"),
    x_demo_token: str | None = Header(default=None, alias="X-Demo-Token"),
    db: Session = Depends(get_db),
) -> TemporaryMenuAcceptedResponse:
    _assert_demo_token(x_demo_token)
    settings = get_settings()
    uploaded_files = files or []
    if not uploaded_files and not (menu_source == "link" and menu_link):
        raise HTTPException(status_code=400, detail="Provide files or a menu_link to start a demo import.")
    if len(uploaded_files) > settings.demo_magic_max_files:
        raise HTTPException(status_code=400, detail=f"Upload up to {settings.demo_magic_max_files} files.")

    job = TemporaryMenuImport(
        upload_dir="",
        menu_source=menu_source,
        menu_link=menu_link.strip() if menu_link else None,
        restaurant_name=_clean_optional(restaurant_name),
        contact_phone=_clean_optional(contact_phone),
        city=_clean_optional(city),
        country=_clean_optional(country),
        currency=_normalize_currency(currency),
        status=MenuImportStatus.queued.value,
        warnings=[],
        used_fallback=False,
    )
    db.add(job)
    db.flush()

    upload_dir = UPLOADS_ROOT / "temporary" / job.id
    upload_dir.mkdir(parents=True, exist_ok=True)
    job.upload_dir = str(upload_dir)

    total_size = 0
    if menu_source == "link" and menu_link:
        try:
            downloaded_pdf = download_pdf_from_url(url=menu_link, target_dir=upload_dir)
        except PdfLinkDownloadError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        total_size += downloaded_pdf.size_bytes
        db.add(
            TemporaryMenuImportSource(
                job_id=job.id,
                name=downloaded_pdf.file_name,
                kind="pdf",
                mime_type=downloaded_pdf.mime_type,
                size_bytes=downloaded_pdf.size_bytes,
                **_archive_source(job_id=job.id, file_path=upload_dir / downloaded_pdf.file_name, content_type=downloaded_pdf.mime_type),
            )
        )

    for file_index, uploaded_file in enumerate(uploaded_files, start=1):
        original_name = Path(uploaded_file.filename or "upload").name
        safe_name = _ordered_upload_name(file_index, original_name)
        target_path = upload_dir / safe_name
        with target_path.open("wb") as buffer:
            shutil.copyfileobj(uploaded_file.file, buffer)

        size_bytes = target_path.stat().st_size
        total_size += size_bytes
        if total_size > settings.demo_magic_max_total_upload_mb * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Total upload size must be under {settings.demo_magic_max_total_upload_mb} MB.")

        kind = _detect_source_kind(target_path)

        logger.info(
            "Saved temporary menu upload job_id=%s file=%s kind=%s size=%s sha256=%s ip=%s",
            job.id,
            safe_name,
            kind,
            size_bytes,
            _sha256_file(target_path),
            request.client.host if request.client else "unknown",
        )
        db.add(
            TemporaryMenuImportSource(
                job_id=job.id,
                name=safe_name,
                kind=kind,
                mime_type=uploaded_file.content_type,
                size_bytes=size_bytes,
                **_archive_source(job_id=job.id, file_path=target_path, content_type=uploaded_file.content_type),
            )
        )

    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        process_temporary_menu_import_job_task.delay(job.id)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to enqueue temporary menu import job_id=%s error=%s", job.id, exc)
        job.status = MenuImportStatus.failed.value
        job.error = "Demo import is temporarily unavailable. Try again in a minute."
        db.add(job)
        db.commit()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Demo import queue is temporarily unavailable.") from exc

    return TemporaryMenuAcceptedResponse(
        id=job.id,
        status=MenuImportStatus(job.status),
        pollUrl=f"/api/demo/imports/{job.id}",
        publicPath=f"/tmp/{job.id}",
        createdAt=job.created_at,
    )


@router.get("/imports/{job_id}", response_model=TemporaryMenuJobResponse)
def get_temporary_menu_import(
    job_id: str,
    x_demo_token: str | None = Header(default=None, alias="X-Demo-Token"),
    db: Session = Depends(get_db),
) -> TemporaryMenuJobResponse:
    _assert_demo_token(x_demo_token)
    job = db.query(TemporaryMenuImport).filter(TemporaryMenuImport.id == job_id).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Temporary menu import not found.")
    return serialize_temporary_menu_job(job)


@router.get("/tmp/{job_id}")
def get_public_temporary_menu(job_id: str, db: Session = Depends(get_db)) -> dict:
    job = db.query(TemporaryMenuImport).filter(TemporaryMenuImport.id == job_id).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Temporary menu not found.")
    if job.status != MenuImportStatus.completed.value or not job.payload:
        raise HTTPException(status_code=409, detail="Temporary menu is not ready yet.")
    return build_public_temporary_menu_payload(job)


def _assert_demo_token(token: str | None) -> None:
    settings = get_settings()
    expected_token = settings.demo_magic_token
    if not expected_token:
        if settings.app_env == "development":
            expected_token = "demo"
        else:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Demo token is not configured.")

    if not token or not secrets.compare_digest(token, expected_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid demo token.")


def _clean_optional(value: str | None) -> str | None:
    normalized = (value or "").strip()
    return normalized or None


def _normalize_currency(value: str | None) -> str:
    normalized = (value or "USD").strip().upper()
    if not normalized:
        return "USD"
    return normalized[:8]


def _detect_source_kind(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == PDF_EXTENSION:
        return "pdf"
    if suffix in IMAGE_EXTENSIONS:
        return "image"
    return "file"


def _ordered_upload_name(file_index: int, original_name: str) -> str:
    prefix = f"{file_index:03d}-"
    suffix = Path(original_name).suffix
    stem_limit = 255 - len(prefix) - len(suffix)
    stem = Path(original_name).stem[:stem_limit] or "upload"
    return f"{prefix}{stem}{suffix}"


def _archive_source(*, job_id: str, file_path: Path, content_type: str | None) -> dict[str, str | None]:
    storage = ObjectStorageClient()
    if not storage.enabled:
        return {"storage_key": None, "public_url": None}

    try:
        stored = storage.upload_menu_import_source(job_id=f"temporary/{job_id}", file_path=file_path, content_type=content_type)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to archive temporary source job_id=%s file=%s error=%s", job_id, file_path.name, exc)
        return {"storage_key": None, "public_url": None}
    return {"storage_key": stored.object_key, "public_url": stored.public_url}


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()
