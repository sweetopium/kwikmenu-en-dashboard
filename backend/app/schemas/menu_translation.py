from __future__ import annotations

from pydantic import BaseModel, Field
from app.schemas.menu import MenuPayload, LocalizedContent
from app.services.menu_languages import ensure_menu_language


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
    venue: TranslatableMeta | None = None
    menuMeta: TranslatableMeta
    categories: list[TranslatableCategory] = Field(default_factory=list)
    items: list[TranslatableItem] = Field(default_factory=list)


def extract_translatable(payload: MenuPayload) -> TranslatableMenu:
    def_lang = payload.defaultLanguage

    def get_val(obj, field):
        if not obj:
            return None
        trans = getattr(obj, "translations", {}).get(def_lang)
        if trans:
            val = getattr(trans, field, None)
            if val:
                return val
        return getattr(obj, field, None)

    venue = None
    if payload.venue:
        venue = TranslatableMeta(
            name=get_val(payload.venue, "name") or payload.venue.name or "",
            description=get_val(payload.venue, "description") or payload.venue.description,
        )

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

    return TranslatableMenu(venue=venue, menuMeta=meta, categories=categories, items=items)


def merge_translations(payload: MenuPayload, translated: TranslatableMenu, target_lang: str) -> None:
    if translated.venue and payload.venue:
        payload.venue.translations[target_lang] = LocalizedContent(
            name=translated.venue.name,
            description=translated.venue.description,
        )

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

    ensure_menu_language(payload, target_lang)
