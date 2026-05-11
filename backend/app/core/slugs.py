from __future__ import annotations

import re
import unicodedata


def slugify(value: str, *, fallback: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).lower().strip()
    slug = re.sub(r"[^\w]+", "-", normalized, flags=re.UNICODE).strip("-_")
    return slug or fallback
