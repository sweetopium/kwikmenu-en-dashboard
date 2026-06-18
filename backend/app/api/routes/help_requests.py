from __future__ import annotations

import shutil
import time
from collections import defaultdict, deque
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.paths import DATA_ROOT
from app.models import HelpRequest
from app.schemas.help_request import HelpRequestCreateResponse
from app.services.help_request_notifications import send_help_request_to_telegram

router = APIRouter(prefix="/api/help-requests", tags=["help-requests"])

HELP_REQUEST_UPLOADS_ROOT = DATA_ROOT / "help-requests"
ALLOWED_MENU_SOURCES = {"file", "link"}
ALLOWED_MESSENGERS = {"telegram", "max", "whatsapp", "call"}
ALLOWED_FILE_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx", ".xls", ".xlsx"}
ALLOWED_FILE_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
MAX_MENU_FILE_SIZE_BYTES = 10 * 1024 * 1024
RATE_LIMIT_WINDOW_SECONDS = 5 * 60
RATE_LIMIT_MAX_REQUESTS = 5
REQUEST_LOG: dict[str, deque[float]] = defaultdict(deque)


def _normalize_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _enforce_rate_limit(request: Request) -> str:
    client_ip = _normalize_client_ip(request)
    now = time.time()
    bucket = REQUEST_LOG[client_ip]
    while bucket and now - bucket[0] > RATE_LIMIT_WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Try again in a few minutes.",
        )
    bucket.append(now)
    return client_ip


def _validate_menu_link(menu_link: str | None) -> str:
    normalized_link = (menu_link or "").strip()
    if not normalized_link:
        raise HTTPException(status_code=400, detail="Enter a menu link or choose to attach it later.")
    parsed = urlparse(normalized_link)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=400, detail="The menu link must start with http:// or https://")
    return normalized_link


def _validate_menu_file_meta(menu_file: UploadFile | None) -> tuple[str, str]:
    if menu_file is None or not menu_file.filename:
        raise HTTPException(status_code=400, detail="Attach a menu file or choose to attach it later.")

    safe_name = Path(menu_file.filename).name
    extension = Path(safe_name).suffix.lower()
    content_type = (menu_file.content_type or "").lower()

    if extension not in ALLOWED_FILE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported menu file format.")
    if content_type and content_type not in ALLOWED_FILE_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported menu file MIME type.")

    return safe_name, content_type


def _persist_uploaded_file(help_request_id: str, menu_file: UploadFile, safe_name: str) -> tuple[str, int]:
    HELP_REQUEST_UPLOADS_ROOT.mkdir(parents=True, exist_ok=True)
    request_dir = HELP_REQUEST_UPLOADS_ROOT / help_request_id
    request_dir.mkdir(parents=True, exist_ok=True)
    target_path = request_dir / safe_name

    total_bytes = 0
    try:
        with target_path.open("wb") as buffer:
            while True:
                chunk = menu_file.file.read(1024 * 1024)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_MENU_FILE_SIZE_BYTES:
                    raise HTTPException(status_code=400, detail="Menu file is too large. Maximum size is 10 MB.")
                buffer.write(chunk)
    except Exception:
        shutil.rmtree(request_dir, ignore_errors=True)
        raise
    finally:
        menu_file.file.close()

    if total_bytes == 0:
        shutil.rmtree(request_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail="Menu file is empty.")

    return str(target_path), total_bytes


@router.post("", response_model=HelpRequestCreateResponse, status_code=status.HTTP_201_CREATED)
def create_help_request(
    request: Request,
    name: str = Form(...),
    phone: str = Form(...),
    messenger: str = Form(...),
    country_code: str = Form(...),
    country_name: str = Form(...),
    city: str = Form(...),
    restaurant_name: str = Form(...),
    upload_later: bool = Form(...),
    menu_source: str = Form(...),
    menu_link: str | None = Form(default=None),
    menu_file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
) -> HelpRequestCreateResponse:
    client_ip = _enforce_rate_limit(request)
    normalized = {
        "name": name.strip(),
        "phone": phone.strip(),
        "messenger": messenger.strip().lower(),
        "country_code": country_code.strip().lower(),
        "country_name": country_name.strip(),
        "city": city.strip(),
        "restaurant_name": restaurant_name.strip(),
        "menu_source": menu_source.strip().lower(),
        "menu_link": menu_link.strip() if menu_link else None,
    }

    if not all(
        [
            normalized["name"],
            normalized["phone"],
            normalized["messenger"],
            normalized["country_code"],
            normalized["country_name"],
            normalized["city"],
            normalized["restaurant_name"],
        ]
    ):
        raise HTTPException(status_code=400, detail="Fill in all required request fields.")

    if normalized["messenger"] not in ALLOWED_MESSENGERS:
        raise HTTPException(status_code=400, detail="Invalid contact messenger.")

    if normalized["menu_source"] not in ALLOWED_MENU_SOURCES:
        raise HTTPException(status_code=400, detail="Invalid menu delivery method.")

    safe_name: str | None = None
    menu_content_type: str | None = None

    if upload_later:
        normalized["menu_link"] = None
        menu_file = None
    elif normalized["menu_source"] == "link":
        normalized["menu_link"] = _validate_menu_link(normalized["menu_link"])
    elif normalized["menu_source"] == "file":
        safe_name, menu_content_type = _validate_menu_file_meta(menu_file)

    help_request = HelpRequest(
        name=normalized["name"],
        phone=normalized["phone"],
        messenger=normalized["messenger"],
        country_code=normalized["country_code"],
        country_name=normalized["country_name"],
        city=normalized["city"],
        restaurant_name=normalized["restaurant_name"],
        upload_later=upload_later,
        menu_source=normalized["menu_source"],
        menu_link=normalized["menu_link"],
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
    )

    request_dir: Path | None = None
    try:
        db.add(help_request)
        db.flush()

        if not upload_later and normalized["menu_source"] == "file" and menu_file is not None and safe_name is not None:
            request_dir = HELP_REQUEST_UPLOADS_ROOT / help_request.id
            file_path, file_size_bytes = _persist_uploaded_file(help_request.id, menu_file, safe_name)
            help_request.menu_file_name = safe_name
            help_request.menu_file_path = file_path
            help_request.menu_file_mime_type = menu_content_type
            help_request.menu_file_size_bytes = file_size_bytes

        db.add(help_request)
        db.commit()
        db.refresh(help_request)
    except HTTPException:
        db.rollback()
        if request_dir is not None:
            shutil.rmtree(request_dir, ignore_errors=True)
        raise
    except Exception:
        db.rollback()
        if request_dir is not None:
            shutil.rmtree(request_dir, ignore_errors=True)
        raise

    delivered, message_id, telegram_error = send_help_request_to_telegram(help_request)
    try:
        help_request.telegram_delivered = delivered
        help_request.telegram_message_id = message_id
        help_request.telegram_error = telegram_error
        db.add(help_request)
        db.commit()
        db.refresh(help_request)
    except Exception:
        db.rollback()

    return HelpRequestCreateResponse(
        id=help_request.id,
        createdAt=help_request.created_at,
        telegramDelivered=help_request.telegram_delivered,
    )
