from __future__ import annotations

import hashlib
import ipaddress
import re
import socket
import ssl
from dataclasses import dataclass
from pathlib import Path
from urllib import parse, request

import certifi


PDF_SIGNATURE = b"%PDF-"
DEFAULT_MAX_DOWNLOAD_SIZE_BYTES = 25 * 1024 * 1024


class PdfLinkDownloadError(ValueError):
    pass


@dataclass(frozen=True)
class DownloadedPdf:
    file_name: str
    size_bytes: int
    mime_type: str
    sha256: str


def download_pdf_from_url(
    *,
    url: str,
    target_dir: Path,
    max_size_bytes: int = DEFAULT_MAX_DOWNLOAD_SIZE_BYTES,
) -> DownloadedPdf:
    normalized_url = _normalize_pdf_url(url)
    _ensure_public_http_url(normalized_url)

    target_dir.mkdir(parents=True, exist_ok=True)

    ssl_context = ssl.create_default_context(cafile=certifi.where())
    req = request.Request(
        normalized_url,
        headers={
            "User-Agent": "KwikMenu PDF Importer/1.0",
            "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1",
        },
        method="GET",
    )

    with request.urlopen(req, timeout=30, context=ssl_context) as response:
        final_url = response.geturl()
        _ensure_public_http_url(final_url)

        content_type = (response.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        suggested_name = _extract_file_name(response, final_url=final_url)
        safe_name = _sanitize_file_name(suggested_name)
        if not safe_name.lower().endswith(".pdf"):
            safe_name = f"{Path(safe_name).stem or 'menu-link'}.pdf"

        target_path = target_dir / safe_name
        digest = hashlib.sha256()
        total_size = 0
        first_chunk = b""

        with target_path.open("wb") as buffer:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break

                if not first_chunk:
                    first_chunk = chunk[:16]

                total_size += len(chunk)
                if total_size > max_size_bytes:
                    raise PdfLinkDownloadError(
                        "The linked PDF is too large. Upload the file manually or use a smaller PDF."
                    )

                digest.update(chunk)
                buffer.write(chunk)

        if total_size == 0:
            raise PdfLinkDownloadError(
                "Failed to download the linked PDF. Check that the link opens directly to a PDF file."
            )

        if not first_chunk.startswith(PDF_SIGNATURE):
            raise PdfLinkDownloadError(
                "Only PDF link imports are supported for now. Upload a file manually or paste a direct PDF link."
            )

        if content_type and content_type not in {"application/pdf", "application/octet-stream", "binary/octet-stream"}:
            raise PdfLinkDownloadError(
                "Only PDF link imports are supported for now. Upload a file manually or paste a direct PDF link."
            )

        return DownloadedPdf(
            file_name=target_path.name,
            size_bytes=total_size,
            mime_type="application/pdf",
            sha256=digest.hexdigest(),
        )


def _normalize_pdf_url(url: str) -> str:
    normalized = str(url or "").strip()
    if not normalized:
        raise PdfLinkDownloadError("Enter a direct link to a menu PDF file.")
    return normalized


def _ensure_public_http_url(url: str) -> None:
    parsed = parse.urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise PdfLinkDownloadError("Enter a public direct link to a menu PDF file.")

    try:
        addresses = socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
    except socket.gaierror as exc:
        raise PdfLinkDownloadError("Failed to open the PDF link. Check the file URL and try again.") from exc

    for entry in addresses:
        raw_ip = entry[4][0]
        ip = ipaddress.ip_address(raw_ip)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_unspecified or ip.is_reserved:
            raise PdfLinkDownloadError("Enter a public direct link to a menu PDF file.")


def _extract_file_name(response, *, final_url: str) -> str:
    content_disposition = response.headers.get("Content-Disposition") or ""
    file_name_match = re.search(r'filename\*?=(?:UTF-8\'\')?"?([^\";]+)"?', content_disposition, flags=re.IGNORECASE)
    if file_name_match:
        return parse.unquote(file_name_match.group(1)).strip()

    path_name = Path(parse.urlparse(final_url).path).name
    if path_name:
        return parse.unquote(path_name)

    return "menu-link.pdf"


def _sanitize_file_name(file_name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", file_name.strip()).strip("-._")
    return cleaned or "menu-link.pdf"
