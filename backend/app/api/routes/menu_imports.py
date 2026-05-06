from __future__ import annotations

import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, Request, UploadFile, status

from app.core.config import get_settings
from app.core.paths import UPLOADS_ROOT
from app.schemas.menu_import import MenuImportAcceptedResponse, MenuImportJobResponse, UploadedSource
from app.services.job_store import job_store
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
) -> MenuImportAcceptedResponse:
    uploaded_files = files or []
    context = await _extract_context(request)
    if not uploaded_files and not (menu_source == "link" and menu_link):
        raise HTTPException(status_code=400, detail="Provide files or a menu_link to start an import job.")

    job_id = str(uuid4())
    upload_dir = UPLOADS_ROOT / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    sources: list[UploadedSource] = []
    for uploaded_file in uploaded_files:
        target_path = upload_dir / uploaded_file.filename
        with target_path.open("wb") as buffer:
            shutil.copyfileobj(uploaded_file.file, buffer)

        kind = _detect_source_kind(target_path)
        size_bytes = target_path.stat().st_size
        sources.append(
            UploadedSource(
                name=uploaded_file.filename,
                kind=kind,
                mimeType=uploaded_file.content_type,
                sizeBytes=size_bytes,
            )
        )

    job = job_store.create_job(
        job_id=job_id,
        upload_dir=str(upload_dir),
        menu_source=menu_source,
        menu_link=menu_link,
        context=context,
        sources=sources,
    )

    background_tasks.add_task(process_job, job_id)

    settings = get_settings()
    return MenuImportAcceptedResponse(
        jobId=job.job_id,
        status=job.status,
        pollUrl=f"{settings.menu_import_api_url}/api/menu-imports/{job.job_id}",
        createdAt=job.created_at,
    )


@router.get("/{job_id}", response_model=MenuImportJobResponse)
def get_menu_import(job_id: str) -> MenuImportJobResponse:
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Menu import job not found.")
    return job_store.serialize(job)


def process_job(job_id: str) -> None:
    job = job_store.mark_processing(job_id)
    try:
        result = pipeline.run(
            upload_dir=Path(job.upload_dir),
            menu_source=job.menu_source,
            menu_link=job.menu_link,
            context=job.context,
            sources=job.sources,
        )
        job_store.mark_completed(job_id, result)
    except Exception as exc:  # noqa: BLE001
        job_store.mark_failed(job_id, str(exc))


async def _extract_context(request: Request) -> dict[str, str]:
    form = await request.form()
    reserved = {"files", "menu_source", "menu_link"}
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
