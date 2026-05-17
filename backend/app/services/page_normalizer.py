from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import fitz

from app.schemas.menu_import import UploadedSource


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
PDF_EXTENSION = ".pdf"


logger = logging.getLogger(__name__)


@dataclass
class NormalizedPage:
    page_number: int
    source_name: str
    source_kind: str
    mime_type: str
    image_path: Path | None
    menu_link: str | None = None


class PageNormalizer:
    def normalize(
        self,
        *,
        upload_dir: Path,
        menu_source: str,
        menu_link: str | None,
        sources: list[UploadedSource],
    ) -> list[NormalizedPage]:
        normalized_pages: list[NormalizedPage] = []
        rendered_dir = upload_dir / "rendered-pages"
        rendered_dir.mkdir(parents=True, exist_ok=True)

        page_index = 1
        for source in sources:
            source_path = upload_dir / source.name
            source_kind = self._detect_source_kind(source_path, source.kind)

            if source_kind == "pdf":
                rendered_pages = self._render_pdf_pages(
                    source_path=source_path,
                    rendered_dir=rendered_dir,
                    source_name=source.name,
                    starting_page_number=page_index,
                )
                normalized_pages.extend(rendered_pages)
                page_index += len(rendered_pages)
                continue

            if source_kind == "image":
                normalized_pages.append(
                    NormalizedPage(
                        page_number=page_index,
                        source_name=source.name,
                        source_kind="image",
                        mime_type=source.mimeType or "image/jpeg",
                        image_path=source_path,
                    )
                )
                page_index += 1
                continue

        return normalized_pages

    def _render_pdf_pages(
        self,
        *,
        source_path: Path,
        rendered_dir: Path,
        source_name: str,
        starting_page_number: int,
    ) -> list[NormalizedPage]:
        document = fitz.open(source_path)
        pages: list[NormalizedPage] = []

        for index, page in enumerate(document, start=0):
            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            output_name = f"{source_path.stem}-page-{index + 1}.png"
            output_path = rendered_dir / output_name
            pixmap.save(output_path)
            logger.info(
                "Rendered PDF page source=%s page=%s size=%sx%s output=%s bytes=%s",
                source_name,
                index + 1,
                pixmap.width,
                pixmap.height,
                output_path,
                output_path.stat().st_size,
            )
            pages.append(
                NormalizedPage(
                    page_number=starting_page_number + index,
                    source_name=source_name,
                    source_kind="pdf",
                    mime_type="image/png",
                    image_path=output_path,
                )
            )

        document.close()
        return pages

    def _detect_source_kind(self, source_path: Path, fallback_kind: str) -> str:
        suffix = source_path.suffix.lower()
        if suffix == PDF_EXTENSION:
            return "pdf"
        if suffix in IMAGE_EXTENSIONS:
            return "image"
        return fallback_kind
