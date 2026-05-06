from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import Lock
from typing import Any

from app.schemas.menu_import import MenuImportJobResponse, MenuImportResult, MenuImportStatus, UploadedSource


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class StoredJob:
    job_id: str
    upload_dir: str
    menu_source: str
    menu_link: str | None
    context: dict[str, str]
    sources: list[UploadedSource]
    status: MenuImportStatus = MenuImportStatus.accepted
    created_at: datetime = field(default_factory=utcnow)
    updated_at: datetime = field(default_factory=utcnow)
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error: str | None = None
    result: MenuImportResult | None = None


class JobStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._jobs: dict[str, StoredJob] = {}

    def create_job(
        self,
        *,
        job_id: str,
        upload_dir: str,
        menu_source: str,
        menu_link: str | None,
        context: dict[str, str],
        sources: list[UploadedSource],
    ) -> StoredJob:
        with self._lock:
            job = StoredJob(
                job_id=job_id,
                upload_dir=upload_dir,
                menu_source=menu_source,
                menu_link=menu_link,
                context=context,
                sources=sources,
            )
            self._jobs[job_id] = job
            return job

    def get_job(self, job_id: str) -> StoredJob | None:
        with self._lock:
            return self._jobs.get(job_id)

    def mark_processing(self, job_id: str) -> StoredJob:
        with self._lock:
            job = self._jobs[job_id]
            job.status = MenuImportStatus.processing
            job.started_at = utcnow()
            job.updated_at = utcnow()
            return job

    def mark_completed(self, job_id: str, result: MenuImportResult) -> StoredJob:
        with self._lock:
            job = self._jobs[job_id]
            job.status = MenuImportStatus.completed
            job.result = result
            job.completed_at = utcnow()
            job.updated_at = utcnow()
            return job

    def mark_failed(self, job_id: str, error: str) -> StoredJob:
        with self._lock:
            job = self._jobs[job_id]
            job.status = MenuImportStatus.failed
            job.error = error
            job.completed_at = utcnow()
            job.updated_at = utcnow()
            return job

    def serialize(self, job: StoredJob) -> MenuImportJobResponse:
        return MenuImportJobResponse(
            jobId=job.job_id,
            status=job.status,
            createdAt=job.created_at,
            updatedAt=job.updated_at,
            startedAt=job.started_at,
            completedAt=job.completed_at,
            error=job.error,
            result=job.result,
        )


job_store = JobStore()
