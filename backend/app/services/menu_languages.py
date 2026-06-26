from __future__ import annotations

from app.schemas.menu import MenuLanguage, MenuPayload


LANGUAGE_METADATA: dict[str, dict[str, str]] = {
    "ru": {"shortLabel": "RU", "nativeName": "Russian", "flag": "🇷🇺"},
    "en": {"shortLabel": "EN", "nativeName": "English", "flag": "🇬🇧"},
    "ar": {"shortLabel": "AR", "nativeName": "العربية", "flag": "🇦🇪"},
    "kk": {"shortLabel": "KZ", "nativeName": "Kazakh", "flag": "🇰🇿"},
    "tr": {"shortLabel": "TR", "nativeName": "Türkçe", "flag": "🇹🇷"},
    "de": {"shortLabel": "DE", "nativeName": "Deutsch", "flag": "🇩🇪"},
    "fr": {"shortLabel": "FR", "nativeName": "Français", "flag": "🇫🇷"},
    "es": {"shortLabel": "ES", "nativeName": "Español", "flag": "🇪🇸"},
    "zh": {"shortLabel": "ZH", "nativeName": "中文", "flag": "🇨🇳"},
    "he": {"shortLabel": "HE", "nativeName": "עברית", "flag": "🇮🇱"},
}

VALID_MENU_LANGUAGE_CODES = set(LANGUAGE_METADATA)


def normalize_language_code(code: object) -> str | None:
    normalized = str(code or "").strip().lower().replace("_", "-")
    if not normalized:
        return None
    short_code = normalized.split("-")[0]
    return short_code if short_code in VALID_MENU_LANGUAGE_CODES else None


def build_menu_language(code: str) -> MenuLanguage:
    normalized = normalize_language_code(code) or code.strip().lower()
    meta = LANGUAGE_METADATA.get(normalized)
    if meta:
        return MenuLanguage(code=normalized, **meta)

    upper = normalized.upper()
    return MenuLanguage(code=normalized, shortLabel=upper, nativeName=upper, flag=upper)


def ensure_menu_language(payload: MenuPayload, code: str) -> None:
    normalized = normalize_language_code(code) or code.strip().lower()
    if not normalized:
        return

    replacement = build_menu_language(normalized)
    existing = next((language for language in payload.languages if language.code == normalized), None)
    if existing:
        existing.shortLabel = replacement.shortLabel
        existing.nativeName = replacement.nativeName
        existing.flag = replacement.flag
        return

    payload.languages.append(replacement)


def choose_default_language(language_codes: list[str]) -> str:
    normalized_codes = [code for code in (normalize_language_code(value) for value in language_codes) if code]
    for code in normalized_codes:
        if code != "en":
            return code
    return normalized_codes[0] if normalized_codes else "en"
