from __future__ import annotations

import re
from typing import Any

from app.schemas.menu import MenuCategory, MenuItem, MenuPayload, MenuVariant
from app.schemas.menu_normalization import MenuNormalizationResult
from app.services.openrouter_client import OpenRouterClient


class MenuNormalizationService:
    def __init__(self) -> None:
        self.openrouter = OpenRouterClient()

    def run(self, menu: MenuPayload) -> MenuNormalizationResult:
        warnings: list[str] = []
        used_fallback = False

        normalized_menu = menu
        if self.openrouter.enabled:
            try:
                normalized_menu = self.openrouter.normalize_menu(menu)
                self._validate_shape_integrity(original=menu, normalized=normalized_menu)
            except Exception as exc:  # noqa: BLE001
                used_fallback = True
                warnings.append(f"LLM normalizer fallback: {exc}")
                normalized_menu = menu
        else:
            used_fallback = True
            warnings.append("OPENROUTER_API_KEY is not configured, deterministic normalizer was used.")

        normalized_menu = self._apply_deterministic_cleanup(normalized_menu)
        normalized_menu = MenuPayload.model_validate(normalized_menu.model_dump())
        self._validate_shape_integrity(original=menu, normalized=normalized_menu)

        return MenuNormalizationResult(
            menu=normalized_menu,
            usedFallback=used_fallback,
            warnings=warnings,
        )

    def _validate_shape_integrity(self, *, original: MenuPayload, normalized: MenuPayload) -> None:
        if len(original.categories) != len(normalized.categories):
            raise ValueError("Normalizer changed category count.")

        for original_category, normalized_category in zip(original.categories, normalized.categories):
            if original_category.id != normalized_category.id:
                raise ValueError("Normalizer changed category ids or order.")
            if len(original_category.items) != len(normalized_category.items):
                raise ValueError(f"Normalizer changed item count for category '{original_category.id}'.")

            for original_item, normalized_item in zip(original_category.items, normalized_category.items):
                if original_item.id != normalized_item.id:
                    raise ValueError("Normalizer changed item ids or order.")
                if len(original_item.variants) != len(normalized_item.variants):
                    raise ValueError(f"Normalizer changed variant count for item '{original_item.id}'.")
                if original_item.measureValue is not None and normalized_item.measureValue is None:
                    raise ValueError(f"Normalizer removed measureValue for item '{original_item.id}'.")
                if original_item.measureUnit is not None and normalized_item.measureUnit is None:
                    raise ValueError(f"Normalizer removed measureUnit for item '{original_item.id}'.")

                for original_variant, normalized_variant in zip(original_item.variants, normalized_item.variants):
                    if original_variant.id != normalized_variant.id:
                        raise ValueError("Normalizer changed variant ids or order.")
                    if original_variant.measureValue is not None and normalized_variant.measureValue is None:
                        raise ValueError(f"Normalizer removed measureValue for variant '{original_variant.id}'.")
                    if original_variant.measureUnit is not None and normalized_variant.measureUnit is None:
                        raise ValueError(f"Normalizer removed measureUnit for variant '{original_variant.id}'.")

    def _apply_deterministic_cleanup(self, menu: MenuPayload) -> MenuPayload:
        cleaned_categories: list[MenuCategory] = []
        for category in menu.categories:
            cleaned_items: list[MenuItem] = []
            for item in category.items:
                cleaned_variants = [self._normalize_variant(variant) for variant in item.variants]
                item_measure_value, item_measure_unit = self._normalize_measure_pair(item.measureValue, item.measureUnit)
                cleaned_items.append(
                    item.model_copy(
                        update={
                            "name": self._normalize_sentence_case(item.name),
                            "description": self._normalize_description(item.description),
                            "measureValue": item_measure_value,
                            "measureUnit": item_measure_unit,
                            "tags": [self._normalize_sentence_case(tag) for tag in item.tags if tag and tag.strip()],
                            "variants": cleaned_variants,
                        }
                    )
                )

            cleaned_categories.append(
                category.model_copy(
                    update={
                        "name": self._normalize_category_name(category.name, menu.defaultLanguage),
                        "description": self._normalize_description(category.description),
                        "items": cleaned_items,
                    }
                )
            )

        return menu.model_copy(
            update={
                "menuMeta": menu.menuMeta.model_copy(
                    update={
                        "name": self._normalize_sentence_case(menu.menuMeta.name),
                        "description": self._normalize_description(menu.menuMeta.description),
                    }
                ),
                "categories": cleaned_categories,
            }
        )

    def _normalize_variant(self, variant: MenuVariant) -> MenuVariant:
        measure_value, measure_unit = self._normalize_measure_pair(variant.measureValue, variant.measureUnit)
        return variant.model_copy(
            update={
                "measureValue": measure_value,
                "measureUnit": measure_unit,
                "label": self._normalize_variant_label(variant.label, measure_value, measure_unit),
            }
        )

    def _normalize_sentence_case(self, value: str | None) -> str | None:
        if value is None:
            return None

        cleaned = re.sub(r"\s+", " ", value).strip()
        if not cleaned:
            return ""

        lowered = cleaned.lower()
        match = re.search(r"[A-Za-zА-Яа-яЁё]", lowered)
        if not match:
            return lowered

        index = match.start()
        return lowered[:index] + lowered[index].upper() + lowered[index + 1:]

    def _normalize_description(self, value: str | None) -> str | None:
        normalized = self._normalize_sentence_case(value)
        return normalized or None

    def _normalize_category_name(self, value: str | None, default_language: str) -> str | None:
        cleaned = self._normalize_sentence_case(value)
        if not cleaned:
            return cleaned

        if default_language != "ru":
            return cleaned

        return self._strip_english_duplicate_suffix(cleaned)

    def _normalize_variant_label(self, label: str, measure_value: Any, measure_unit: Any) -> str:
        cleaned = re.sub(r"\s+", " ", label or "").strip()
        if not cleaned:
            return ""

        numeric_prefix = self._extract_numeric_prefix(cleaned)
        measure_unit_token = self._unit_token(measure_unit)

        if measure_value is not None:
            formatted_value = self._format_measure_value(measure_value)
            if numeric_prefix == formatted_value:
                return formatted_value

        if measure_value is not None and measure_unit_token:
            formatted_value = self._format_measure_value(measure_value)
            expected_with_unit = f"{formatted_value} {measure_unit_token}".lower()
            if cleaned.lower() == expected_with_unit:
                return formatted_value

        return self._normalize_sentence_case(cleaned) or ""

    def _normalize_measure_pair(self, measure_value: Any, measure_unit: Any) -> tuple[Any, Any]:
        if measure_value is None or measure_unit is None:
            return measure_value, measure_unit

        try:
            numeric_value = float(str(measure_value).replace(",", ".").strip())
        except ValueError:
            return measure_value, measure_unit

        unit = self._unit_code(measure_unit)

        if unit == "l" and 0 < numeric_value < 1:
            converted_value = numeric_value * 1000
            return self._finalize_measure_value(converted_value), "ml"

        if unit == "kg" and 0 < numeric_value < 1:
            converted_value = numeric_value * 1000
            return self._finalize_measure_value(converted_value), "g"

        return self._finalize_measure_value(numeric_value), measure_unit

    def _finalize_measure_value(self, numeric_value: float) -> int | float:
        return int(numeric_value) if numeric_value.is_integer() else numeric_value

    def _extract_numeric_prefix(self, value: str) -> str | None:
        match = re.fullmatch(r"(\d+(?:[.,]\d+)?)\s*[a-zA-Zа-яА-Я.]*", value)
        if not match:
            return None
        return self._format_measure_value(match.group(1))

    def _format_measure_value(self, value: Any) -> str:
        text = str(value).strip().replace(",", ".")
        try:
            numeric_value = float(text)
        except ValueError:
            return text
        return str(int(numeric_value)) if numeric_value.is_integer() else str(numeric_value)

    def _unit_token(self, measure_unit: Any) -> str | None:
        if measure_unit is None:
            return None

        unit_code = self._unit_code(measure_unit)
        mapping = {
            "ml": "мл",
            "l": "л",
            "g": "г",
            "kg": "кг",
            "pcs": "шт",
            "portion": "порция",
        }
        return mapping.get(unit_code, unit_code)

    def _unit_code(self, measure_unit: Any) -> str:
        if hasattr(measure_unit, "value"):
            return str(measure_unit.value)
        return str(measure_unit)

    def _strip_english_duplicate_suffix(self, value: str) -> str:
        parts = [part.strip() for part in re.split(r"\s*/\s*", value) if part.strip()]
        if len(parts) < 2:
            return value

        primary = parts[0]
        suffix = parts[-1]
        if re.search(r"[А-Яа-яЁё]", primary) and re.fullmatch(r"[A-Za-z0-9 &'().-]+", suffix):
            return primary

        return value
