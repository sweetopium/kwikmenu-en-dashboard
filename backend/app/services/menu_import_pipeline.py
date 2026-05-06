from __future__ import annotations

import re
import unicodedata
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.schemas.menu import (
    MenuCategory,
    MenuItem,
    MenuLanguage,
    MenuMeta,
    MenuPayload,
    MenuSettings,
    MenuVariant,
    VenueMeta,
)
from app.schemas.menu_extract import ExtractedItem, ExtractedPage, ExtractedSection, ExtractedVariant
from app.schemas.menu_import import MenuImportResult, UploadedSource
from app.services.openrouter_client import OpenRouterClient
from app.services.page_normalizer import NormalizedPage, PageNormalizer


def slugify(value: str, *, fallback: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii").lower()
    slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    return slug or fallback


class MenuImportPipeline:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.openrouter = OpenRouterClient()
        self.page_normalizer = PageNormalizer()

    def run(
        self,
        *,
        upload_dir: Path,
        menu_source: str,
        menu_link: str | None,
        context: dict[str, str],
        sources: list[UploadedSource],
    ) -> MenuImportResult:
        pages = self.page_normalizer.normalize(
            upload_dir=upload_dir,
            menu_source=menu_source,
            menu_link=menu_link,
            sources=sources,
        )
        if not pages:
            raise ValueError("No pages were prepared for parsing.")

        warnings: list[str] = []
        used_fallback = False
        extracted_pages: list[ExtractedPage] = []
        previous_section_headings: list[str] = []

        for page in pages:
            extracted, page_warnings, fallback_used = self._parse_page(
                page=page,
                context=context,
                previous_section_headings=previous_section_headings,
            )
            warnings.extend(page_warnings)
            used_fallback = used_fallback or fallback_used
            normalized_page = self._normalize_extracted_page(extracted)
            self._validate_extracted_page(normalized_page, page)
            extracted_pages.append(normalized_page)
            previous_section_headings = [
                section.heading.strip()
                for section in normalized_page.sections
                if section.heading and section.heading.strip()
            ]

        menu_payload = self._merge_pages(extracted_pages=extracted_pages, context=context)
        validated_menu = MenuPayload.model_validate(menu_payload.model_dump())
        self._validate_final_menu(validated_menu)

        return MenuImportResult(
            menu=validated_menu,
            sourceSummary=sources,
            categoryCount=len(validated_menu.categories),
            itemCount=sum(len(category.items) for category in validated_menu.categories),
            documentCount=len(pages),
            usedFallback=used_fallback,
            warnings=warnings,
        )

    def _parse_page(
        self,
        *,
        page: NormalizedPage,
        context: dict[str, str],
        previous_section_headings: list[str],
    ) -> tuple[ExtractedPage, list[str], bool]:
        if self.openrouter.enabled and page.source_kind in {"image", "pdf", "link"}:
            extracted = self.openrouter.extract_page(
                page_number=page.page_number,
                source_kind=page.source_kind,
                file_path=page.image_path,
                file_name=page.source_name,
                mime_type=page.mime_type,
                menu_link=page.menu_link,
                context=context,
                previous_section_headings=previous_section_headings,
            )
            return extracted, [], False

        warning = "OPENROUTER_API_KEY is not configured, fallback menu scaffold was generated."
        return self._build_fallback_page(page=page, context=context), [warning], True

    def _build_fallback_page(self, *, page: NormalizedPage, context: dict[str, str]) -> ExtractedPage:
        display_name = context.get("restaurant_name") or "Импортированное меню"
        item_name = page.source_name if page.source_kind != "link" else "Меню по ссылке"
        item_description = page.menu_link if page.source_kind == "link" else None

        return ExtractedPage(
            pageNumber=page.page_number,
            menuName=f"{display_name} — импорт",
            venueName=context.get("restaurant_name") or "KwikMenu Venue",
            sections=[
                ExtractedSection(
                    heading="Импортировано",
                    items=[
                        ExtractedItem(
                            name=item_name,
                            description=item_description,
                            price=None,
                        )
                    ],
                )
            ],
        )

    def _normalize_extracted_page(self, extracted: ExtractedPage) -> ExtractedPage:
        normalized_sections: list[ExtractedSection] = []

        for section in extracted.sections:
            normalized_items: list[ExtractedItem] = []
            for item in section.items:
                expanded_item = self._expand_compound_variants(item)
                measure_value, measure_unit = self._normalize_measure_fields(expanded_item.measureValue, expanded_item.measureUnit)
                normalized_variants: list[ExtractedVariant] = []

                for variant in expanded_item.variants:
                    variant_measure_value, variant_measure_unit = self._normalize_measure_fields(
                        variant.measureValue,
                        variant.measureUnit,
                    )
                    normalized_variants.append(
                        variant.model_copy(
                            update={
                                "measureValue": variant_measure_value,
                                "measureUnit": variant_measure_unit,
                            }
                        )
                    )

                normalized_items.append(
                    expanded_item.model_copy(
                        update={
                            "measureValue": measure_value,
                            "measureUnit": measure_unit,
                            "variants": normalized_variants,
                        }
                    )
                )

            normalized_sections.append(section.model_copy(update={"items": normalized_items}))

        return extracted.model_copy(update={"sections": normalized_sections})

    def _expand_compound_variants(self, item: ExtractedItem) -> ExtractedItem:
        if item.variants:
            return item

        price_parts = self._split_compound_price_parts(item.price)
        measure_parts, measure_unit, description = self._resolve_compound_measure_parts(item)

        if len(price_parts) < 2 or len(price_parts) != len(measure_parts):
            return item

        variants = [
            ExtractedVariant(
                label=self._build_variant_label(measure_value, measure_unit),
                price=price_part,
                measureValue=measure_value,
                measureUnit=measure_unit,
                isAvailable=item.isAvailable,
            )
            for measure_value, price_part in zip(measure_parts, price_parts)
        ]

        return item.model_copy(
            update={
                "price": None,
                "measureValue": None,
                "measureUnit": None,
                "description": description,
                "variants": variants,
            }
        )

    def _split_compound_price_parts(self, raw_price: str | None) -> list[str]:
        if not raw_price:
            return []

        raw_text = str(raw_price).strip()
        if "/" not in raw_text:
            return []

        numeric_parts = re.findall(r"\d+(?:[.,]\d+)?", raw_text)
        if len(numeric_parts) < 2:
            return []

        suffix = " ₽" if "₽" in raw_text else ""
        return [f"{value.replace(',', '.')}{suffix}" for value in numeric_parts]

    def _split_compound_measure_parts(self, raw_measure: int | float | str | None, measure_unit: Any) -> tuple[list[int | float], Any]:
        normalized_unit = self._normalize_measure_unit(measure_unit)

        if raw_measure is None:
            return [], normalized_unit

        if isinstance(raw_measure, (int, float)):
            return [raw_measure], normalized_unit

        raw_text = str(raw_measure).strip().replace(",", ".").lower()
        if "/" not in raw_text:
            return [], normalized_unit

        inferred_unit = normalized_unit or self._detect_measure_unit_from_text(raw_text)
        numeric_parts = re.findall(r"\d+(?:\.\d+)?", raw_text)
        parsed_parts: list[int | float] = []
        for value in numeric_parts:
            numeric_value = float(value)
            parsed_parts.append(int(numeric_value) if numeric_value.is_integer() else numeric_value)

        return parsed_parts if len(parsed_parts) > 1 else [], inferred_unit

    def _resolve_compound_measure_parts(self, item: ExtractedItem) -> tuple[list[int | float], Any, str | None]:
        measure_parts, measure_unit = self._split_compound_measure_parts(item.measureValue, item.measureUnit)
        if len(measure_parts) > 1:
            return measure_parts, measure_unit, item.description

        for source_name, source_text in (("description", item.description), ("name", item.name)):
            extracted_parts, extracted_unit = self._extract_measure_parts_from_text(source_text, item.measureUnit)
            if len(extracted_parts) > 1:
                cleaned_description = item.description
                if source_name == "description":
                    cleaned_description = self._clean_measure_description(source_text)
                return extracted_parts, extracted_unit, cleaned_description

        return [], self._normalize_measure_unit(item.measureUnit), item.description

    def _extract_measure_parts_from_text(self, raw_text: str | None, measure_unit: Any) -> tuple[list[int | float], Any]:
        if not raw_text:
            return [], self._normalize_measure_unit(measure_unit)

        match = re.search(
            r"(\d+(?:[.,]\d+)?(?:\s*[\\/]\s*\d+(?:[.,]\d+)?)+)\s*(ml|мл|l|л|g|гр\.?|г|kg|кг|pcs|шт\.?|portion|порц(?:ия|ии)?)",
            raw_text,
            flags=re.IGNORECASE,
        )
        if not match:
            return [], self._normalize_measure_unit(measure_unit)

        return self._split_compound_measure_parts(match.group(0), match.group(2))

    def _clean_measure_description(self, raw_text: str | None) -> str | None:
        if not raw_text:
            return raw_text

        cleaned = re.sub(
            r"\b\d+(?:[.,]\d+)?(?:\s*[\\/]\s*\d+(?:[.,]\d+)?)+\s*(?:ml|мл|l|л|g|гр\.?|г|kg|кг|pcs|шт\.?|portion|порц(?:ия|ии)?)\b",
            "",
            raw_text,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(r"\s{2,}", " ", cleaned).strip(" ,;:-")
        return cleaned or None

    def _build_variant_label(self, measure_value: int | float, measure_unit: Any) -> str:
        formatted_value = str(int(measure_value)) if isinstance(measure_value, float) and measure_value.is_integer() else str(measure_value)
        display_unit = self._display_measure_unit(measure_unit)
        return f"{formatted_value} {display_unit}".strip() if display_unit else formatted_value

    def _normalize_measure_fields(self, measure_value: int | float | str | None, measure_unit: Any) -> tuple[int | float | None, Any]:
        normalized_unit = self._normalize_measure_unit(measure_unit)
        if measure_value is None:
            return None, normalized_unit

        if isinstance(measure_value, (int, float)):
            return measure_value, normalized_unit

        raw_value = str(measure_value).strip().replace(",", ".")
        if not raw_value:
            return None, normalized_unit

        normalized_unit = normalized_unit or self._detect_measure_unit_from_text(raw_value.lower())

        if "/" in raw_value or "\\" in raw_value:
            return None, None

        match = re.search(r"\d+(?:\.\d+)?", raw_value)
        if match:
            numeric_value = float(match.group(0))
            if numeric_value.is_integer():
                return int(numeric_value), normalized_unit
            return numeric_value, normalized_unit

        return None, None

    def _normalize_measure_unit(self, measure_unit: Any) -> Any:
        if measure_unit is None:
            return None

        raw_unit = str(measure_unit).strip().lower()
        mapping = {
            "ml": "ml",
            "мл": "ml",
            "l": "l",
            "л": "l",
            "g": "g",
            "гр": "g",
            "гр.": "g",
            "г": "g",
            "kg": "kg",
            "кг": "kg",
            "pcs": "pcs",
            "шт": "pcs",
            "шт.": "pcs",
            "portion": "portion",
            "порция": "portion",
        }
        return mapping.get(raw_unit, raw_unit)

    def _detect_measure_unit_from_text(self, raw_text: str) -> Any:
        if "мл" in raw_text or " ml" in raw_text:
            return "ml"
        if re.search(r"(^|[\s])л($|[\s])", raw_text) or " l" in raw_text:
            return "l"
        if "кг" in raw_text or " kg" in raw_text:
            return "kg"
        if "гр" in raw_text or " г" in raw_text or " g" in raw_text:
            return "g"
        if "шт" in raw_text or " pcs" in raw_text:
            return "pcs"
        if "порц" in raw_text or "portion" in raw_text:
            return "portion"
        return None

    def _display_measure_unit(self, measure_unit: Any) -> str | None:
        normalized_unit = self._normalize_measure_unit(measure_unit)
        display_map = {
            "ml": "мл",
            "l": "л",
            "g": "г",
            "kg": "кг",
            "pcs": "шт",
            "portion": "порция",
        }
        return display_map.get(normalized_unit, normalized_unit)

    def _validate_extracted_page(self, extracted: ExtractedPage, page: NormalizedPage) -> None:
        if not extracted.sections:
            raise ValueError(f"Parser returned no sections for page {page.page_number} ({page.source_name}).")

        section_names: set[str] = set()
        total_items = 0

        for section in extracted.sections:
            if section.heading:
                normalized_heading = section.heading.strip().lower()
                if normalized_heading in section_names:
                    raise ValueError(
                        f"Parser returned duplicate section '{section.heading}' on page {page.page_number} ({page.source_name})."
                    )
                section_names.add(normalized_heading)
            elif not section.continuedFromPreviousPage:
                raise ValueError(
                    f"Section without heading on page {page.page_number} ({page.source_name}) "
                    "must be marked continuedFromPreviousPage=true."
                )

            if not section.items:
                raise ValueError(
                    f"Section '{section.heading or 'continuation'}' has no items on page {page.page_number} ({page.source_name})."
                )

            for item in section.items:
                total_items += 1
                if not item.name.strip():
                    raise ValueError(f"Parser returned empty item name on page {page.page_number} ({page.source_name}).")
                if item.variants and item.price:
                    raise ValueError(
                        f"Item '{item.name}' on page {page.page_number} ({page.source_name}) "
                        "has both direct price and variants."
                    )
                if not item.variants and self._has_compound_price(item.price):
                    raise ValueError(
                        f"Item '{item.name}' on page {page.page_number} ({page.source_name}) "
                        "contains multiple prices but no variants."
                    )

        if len(extracted.sections) == 1 and total_items > self.settings.menu_import_max_items_per_single_category:
            only_section = extracted.sections[0]
            if only_section.heading:
                raise ValueError(
                    f"Parser collapsed page {page.page_number} ({page.source_name}) into one section "
                    f"'{only_section.heading}' with {total_items} items."
                )

    def _merge_pages(self, *, extracted_pages: list[ExtractedPage], context: dict[str, str]) -> MenuPayload:
        category_map: dict[str, MenuCategory] = {}
        category_order: list[str] = []
        discovered_languages = {"ru", "en"}
        menu_name = context.get("restaurant_name") or "Импортированное меню"
        menu_description = None
        venue_name = context.get("restaurant_name") or "KwikMenu Venue"
        active_category_key: str | None = None

        for extracted_page in extracted_pages:
            if extracted_page.menuName:
                menu_name = extracted_page.menuName
            if extracted_page.menuDescription:
                menu_description = extracted_page.menuDescription
            if extracted_page.venueName:
                venue_name = extracted_page.venueName
            discovered_languages.update(extracted_page.languages)

            for section in extracted_page.sections:
                if section.heading and section.heading.strip():
                    category_name = section.heading.strip()
                    category_key = slugify(category_name, fallback=f"category-{len(category_order) + 1}")
                else:
                    if not active_category_key:
                        raise ValueError(
                            f"Cannot merge continuation section on page {extracted_page.pageNumber} without previous category context."
                        )
                    category_key = active_category_key
                    category_name = category_map[category_key].name

                if category_key not in category_map:
                    category_map[category_key] = MenuCategory(
                        id=category_key,
                        name=category_name,
                        description=section.description,
                        sortOrder=len(category_order) + 1,
                        isHidden=section.isHidden,
                        imageUrl=None,
                        items=[],
                        availableHours=section.availableHours,
                        translations=section.translations,
                    )
                    category_order.append(category_key)
                else:
                    existing_category = category_map[category_key]
                    if not existing_category.description and section.description:
                        existing_category.description = section.description
                    existing_category.translations = {**existing_category.translations, **section.translations}

                self._merge_items(category=category_map[category_key], new_items=section.items)
                active_category_key = category_key

        categories = [category_map[key] for key in category_order]
        for category_index, category in enumerate(categories, start=1):
            category.sortOrder = category_index
            for item_index, item in enumerate(category.items, start=1):
                item.sortOrder = item_index
                for variant_index, variant in enumerate(item.variants, start=1):
                    variant.sortOrder = variant_index

        languages = self._build_languages(sorted(discovered_languages))

        return MenuPayload(
            menuMeta=MenuMeta(
                id=slugify(menu_name, fallback="menu"),
                slug=slugify(menu_name, fallback="menu"),
                name=menu_name,
                description=menu_description,
                translations={},
            ),
            venue=VenueMeta(
                name=venue_name,
                description=context.get("city") and f"Загружено для заведения в {context['city']}" or None,
                logoUrl=None,
                coverImageUrl=None,
            ),
            categories=categories,
            languages=languages,
            settings=MenuSettings(),
        )

    def _validate_final_menu(self, menu: MenuPayload) -> None:
        if not menu.categories:
            raise ValueError("Final menu has no categories after merge.")

        total_items = sum(len(category.items) for category in menu.categories)
        if total_items == 0:
            raise ValueError("Final menu has no items after merge.")

        seen_category_names: set[str] = set()
        for category in menu.categories:
            normalized = category.name.strip().lower()
            if normalized in seen_category_names:
                raise ValueError(f"Final menu contains duplicate category '{category.name}'.")
            seen_category_names.add(normalized)

            if not category.items:
                raise ValueError(f"Final menu contains empty category '{category.name}'.")

            for item in category.items:
                if not item.variants and self._has_compound_price(item.price):
                    raise ValueError(f"Final menu item '{item.name}' contains multiple prices but no variants.")

        if len(menu.categories) == 1 and total_items > self.settings.menu_import_max_items_per_single_category:
            raise ValueError(
                f"Final menu has one category with {total_items} items. "
                "This likely means the parser failed to split the menu into sections."
            )

    def _merge_items(self, *, category: MenuCategory, new_items: list[ExtractedItem]) -> None:
        item_map = {slugify(item.name, fallback=f"item-{index}"): item for index, item in enumerate(category.items, start=1)}

        for extracted in new_items:
            item_key = slugify(extracted.name, fallback=f"item-{len(item_map) + 1}")
            existing = item_map.get(item_key)

            if existing is None:
                existing = MenuItem(
                    id=item_key,
                    name=extracted.name,
                    description=extracted.description,
                    price=extracted.price,
                    measureValue=extracted.measureValue,
                    measureUnit=extracted.measureUnit,
                    sortOrder=len(category.items) + 1,
                    isAvailable=extracted.isAvailable,
                    imageUrl=None,
                    tags=extracted.tags,
                    badge=extracted.badge,
                    availableHours=extracted.availableHours,
                    translations=extracted.translations,
                    variants=self._build_variants(extracted.variants, item_key),
                )
                category.items.append(existing)
                item_map[item_key] = existing
                continue

            if not existing.description and extracted.description:
                existing.description = extracted.description
            if not existing.price and extracted.price:
                existing.price = extracted.price
            if existing.measureValue is None and extracted.measureValue is not None:
                existing.measureValue = extracted.measureValue
            if existing.measureUnit is None and extracted.measureUnit is not None:
                existing.measureUnit = extracted.measureUnit
            existing.tags = sorted(set(existing.tags + extracted.tags))
            existing.translations = {**existing.translations, **extracted.translations}
            if existing.badge is None:
                existing.badge = extracted.badge
            if existing.availableHours is None:
                existing.availableHours = extracted.availableHours
            self._merge_variants(existing=existing, incoming=extracted.variants)

    def _build_variants(self, variants: list[ExtractedVariant], item_key: str) -> list[MenuVariant]:
        built: list[MenuVariant] = []
        for index, variant in enumerate(variants, start=1):
            built.append(
                MenuVariant(
                    id=f"{item_key}-{slugify(variant.label, fallback=f'variant-{index}')}",
                    label=variant.label,
                    price=variant.price,
                    measureValue=variant.measureValue,
                    measureUnit=variant.measureUnit,
                    sortOrder=index,
                    isAvailable=variant.isAvailable,
                    translations=variant.translations,
                )
            )
        return built

    def _merge_variants(self, *, existing: MenuItem, incoming: list[ExtractedVariant]) -> None:
        existing_map = {slugify(variant.label, fallback=variant.id): variant for variant in existing.variants}
        for incoming_variant in incoming:
            variant_key = slugify(incoming_variant.label, fallback=f"variant-{len(existing_map) + 1}")
            current = existing_map.get(variant_key)
            if current is None:
                existing.variants.append(
                    MenuVariant(
                        id=f"{existing.id}-{variant_key}",
                        label=incoming_variant.label,
                        price=incoming_variant.price,
                        measureValue=incoming_variant.measureValue,
                        measureUnit=incoming_variant.measureUnit,
                        sortOrder=len(existing.variants) + 1,
                        isAvailable=incoming_variant.isAvailable,
                        translations=incoming_variant.translations,
                    )
                )
                existing_map[variant_key] = existing.variants[-1]
                continue

            current.translations = {**current.translations, **incoming_variant.translations}
            if current.measureValue is None and incoming_variant.measureValue is not None:
                current.measureValue = incoming_variant.measureValue
            if current.measureUnit is None and incoming_variant.measureUnit is not None:
                current.measureUnit = incoming_variant.measureUnit
            if not current.price:
                current.price = incoming_variant.price

    def _build_languages(self, codes: list[str]) -> list[MenuLanguage]:
        mapping = {
            "ru": MenuLanguage(code="ru", shortLabel="RU", nativeName="Русский", flag="RU"),
            "en": MenuLanguage(code="en", shortLabel="EN", nativeName="English", flag="EN"),
        }
        languages: list[MenuLanguage] = []
        for code in codes:
            if code in mapping:
                languages.append(mapping[code])
            else:
                upper = code.upper()
                languages.append(MenuLanguage(code=code, shortLabel=upper, nativeName=upper, flag=upper))
        return languages

    def _has_compound_price(self, raw_price: str | None) -> bool:
        return len(self._split_compound_price_parts(raw_price)) > 1
