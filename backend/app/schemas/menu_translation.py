from __future__ import annotations

from pydantic import BaseModel, Field
from app.schemas.menu import MenuPayload, LocalizedContent, MenuLanguage


class TranslatableMeta(BaseModel):
    name: str
    description: str | None = None


class TranslatableCategory(BaseModel):
    id: str
    name: str
    description: str | None = None


class TranslatableVariant(BaseModel):
    id: str
    label: str


class TranslatableItem(BaseModel):
    id: str
    name: str
    description: str | None = None
    variants: list[TranslatableVariant] = Field(default_factory=list)


class TranslatableMenu(BaseModel):
    menuMeta: TranslatableMeta
    categories: list[TranslatableCategory] = Field(default_factory=list)
    items: list[TranslatableItem] = Field(default_factory=list)


def extract_translatable(payload: MenuPayload) -> TranslatableMenu:
    def_lang = payload.defaultLanguage

    def get_val(obj, field):
        trans = obj.translations.get(def_lang)
        if trans:
            val = getattr(trans, field, None)
            if val:
                return val
        return getattr(obj, field, None)

    meta = TranslatableMeta(
        name=get_val(payload.menuMeta, "name") or payload.menuMeta.name or "",
        description=get_val(payload.menuMeta, "description") or payload.menuMeta.description,
    )

    categories = []
    items = []
    for cat in payload.categories:
        categories.append(
            TranslatableCategory(
                id=cat.id,
                name=get_val(cat, "name") or cat.name or "",
                description=get_val(cat, "description") or cat.description,
            )
        )
        for item in cat.items:
            variants = []
            for var in item.variants:
                variants.append(
                    TranslatableVariant(
                        id=var.id,
                        label=get_val(var, "label") or var.label or "",
                    )
                )
            items.append(
                TranslatableItem(
                    id=item.id,
                    name=get_val(item, "name") or item.name or "",
                    description=get_val(item, "description") or item.description,
                    variants=variants,
                )
            )

    return TranslatableMenu(menuMeta=meta, categories=categories, items=items)


def merge_translations(payload: MenuPayload, translated: TranslatableMenu, target_lang: str) -> None:
    meta_trans = LocalizedContent(
        name=translated.menuMeta.name,
        description=translated.menuMeta.description,
    )
    payload.menuMeta.translations[target_lang] = meta_trans

    cat_map = {c.id: c for c in translated.categories}
    item_map = {i.id: i for i in translated.items}
    var_map = {}
    for item in translated.items:
        for var in item.variants:
            var_map[var.id] = var

    for cat in payload.categories:
        t_cat = cat_map.get(cat.id)
        if t_cat:
            cat.translations[target_lang] = LocalizedContent(
                name=t_cat.name,
                description=t_cat.description,
            )

        for item in cat.items:
            t_item = item_map.get(item.id)
            if t_item:
                item.translations[target_lang] = LocalizedContent(
                    name=t_item.name,
                    description=t_item.description,
                )

            for var in item.variants:
                t_var = var_map.get(var.id)
                if t_var:
                    var.translations[target_lang] = LocalizedContent(
                        label=t_var.label,
                    )

    lang_metadata = {
        "ru": {"shortLabel": "RU", "nativeName": "Русский", "flag": "🇷🇺"},
        "en": {"shortLabel": "EN", "nativeName": "English", "flag": "🇬🇧"},
        "ar": {"shortLabel": "AR", "nativeName": "العربية", "flag": "🇦🇪"},
        "kk": {"shortLabel": "KZ", "nativeName": "Қазақша", "flag": "🇰🇿"},
        "tr": {"shortLabel": "TR", "nativeName": "Türkçe", "flag": "🇹🇷"},
        "de": {"shortLabel": "DE", "nativeName": "Deutsch", "flag": "🇩🇪"},
        "fr": {"shortLabel": "FR", "nativeName": "Français", "flag": "🇫🇷"},
        "es": {"shortLabel": "ES", "nativeName": "Español", "flag": "🇪🇸"},
        "zh": {"shortLabel": "ZH", "nativeName": "中文", "flag": "🇨🇳"},
        "he": {"shortLabel": "HE", "nativeName": "עברית", "flag": "🇮🇱"},
    }

    meta = lang_metadata.get(target_lang.lower())
    if meta:
        existing = next((l for l in payload.languages if l.code == target_lang), None)
        if existing:
            # Repair default/placeholder flags with beautiful emoji flags
            if existing.flag in {None, "", target_lang.upper(), "RU", "EN", "AR", "KZ", "TR", "DE", "FR", "ES", "ZH", "HE"}:
                existing.flag = meta["flag"]
                existing.shortLabel = meta["shortLabel"]
                existing.nativeName = meta["nativeName"]
        else:
            payload.languages.append(
                MenuLanguage(
                    code=target_lang,
                    shortLabel=meta["shortLabel"],
                    nativeName=meta["nativeName"],
                    flag=meta["flag"],
                )
            )
    else:
        existing_codes = {l.code for l in payload.languages}
        if target_lang not in existing_codes:
            payload.languages.append(
                MenuLanguage(
                    code=target_lang,
                    shortLabel=target_lang.upper(),
                    nativeName=target_lang.upper(),
                    flag=target_lang.upper(),
                )
            )
