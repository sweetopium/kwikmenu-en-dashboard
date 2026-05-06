from __future__ import annotations

import base64
import json
import ssl
from json import JSONDecodeError
from pathlib import Path
from typing import Any
from urllib import error, request

import certifi

from app.core.config import get_settings
from app.schemas.menu import MenuPayload
from app.schemas.menu_extract import ExtractedPage


class OpenRouterClient:
    endpoint = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def enabled(self) -> bool:
        return bool(self.settings.openrouter_api_key)

    def extract_page(
        self,
        *,
        page_number: int,
        source_kind: str,
        file_path: Path | None,
        file_name: str,
        mime_type: str | None,
        menu_link: str | None,
        context: dict[str, str],
        previous_section_headings: list[str],
    ) -> ExtractedPage:
        if not self.enabled:
            raise RuntimeError("OPENROUTER_API_KEY is not configured")

        content = [
            {
                "type": "text",
                "text": self._build_prompt(
                    page_number=page_number,
                    source_kind=source_kind,
                    file_name=file_name,
                    menu_link=menu_link,
                    context=context,
                    previous_section_headings=previous_section_headings,
                ),
            }
        ]

        if file_path is not None:
            content.append(self._build_file_content(file_path=file_path, file_name=file_name, mime_type=mime_type))
        elif menu_link:
            content.append(
                {
                    "type": "text",
                    "text": f"Menu link reference: {menu_link}",
                }
            )

        payload: dict[str, Any] = {
            "model": self.settings.menu_import_model,
            "temperature": 0,
            "max_completion_tokens": self.settings.menu_normalization_max_completion_tokens,
            "messages": [
                {
                    "role": "system",
                    "content": "You extract restaurant menu structure. Return only structured data following the provided JSON schema.",
                },
                {
                    "role": "user",
                    "content": content,
                },
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "kwikmenu_document_extract",
                    "strict": True,
                    "schema": ExtractedPage.model_json_schema(),
                },
            },
            "stream": False,
        }

        if self.settings.openrouter_pdf_engine and mime_type == "application/pdf":
            payload["plugins"] = [
                {
                    "id": "file-parser",
                    "pdf": {
                        "engine": self.settings.openrouter_pdf_engine,
                    },
                }
            ]

        response_payload = self._post_json(payload)
        raw_content = response_payload["choices"][0]["message"]["content"]
        structured = json.loads(raw_content) if isinstance(raw_content, str) else raw_content
        return ExtractedPage.model_validate(structured)

    def _build_prompt(
        self,
        *,
        page_number: int,
        source_kind: str,
        file_name: str,
        menu_link: str | None,
        context: dict[str, str],
        previous_section_headings: list[str],
    ) -> str:
        venue_name = context.get("restaurant_name", "").strip()
        city = context.get("city", "").strip()
        lines = [
            "Extract restaurant menu data from exactly one page or one standalone image.",
            "Return page-local sections only. Do not attempt to build the whole menu across all pages.",
            "Use sections as real local menu blocks on this page.",
            "If multiple visible section headings exist on the page, return one section per heading.",
            "If items continue from a previous page and no heading is visible on this page, create a section with heading=null and continuedFromPreviousPage=true.",
            "If a section clearly continues onto the next page, set continuesToNextPage=true.",
            "Never collapse unrelated menu blocks into one section.",
            "Do not use a dish name as a section heading.",
            "Keep category and item names in the source language.",
            "Do not invent categories, items, prices, descriptions, weights, variants, tags, or translations.",
            "If some field is missing or unreadable, return null, empty string, or empty array according to the schema instead of hallucinating.",
            "If the source contains only part of the menu, return only the visible sections and items from that part.",
            "Price must contain only the monetary amount for the item or variant, without volume, weight, unit labels or separators.",
            "measureValue must contain only one numeric scalar like 250 or 0.5.",
            "If a menu row shows one size and one price, always extract both the measure and the price.",
            "Example: 'Эспрессо' + '35 мл | 250₽' must become name='Эспрессо', measureValue=35, measureUnit='ml', price='250'.",
            "Example: 'Хопперс Ориджинал Драй' + '50 мл | 350₽' must become measureValue=50, measureUnit='ml', price='350'.",
            "Do not omit visible measure values for single-size items.",
            "If measureValue is extracted from a visible row and the unit is visible nearby, never leave measureUnit null.",
            "For drinks, coffee, tea, cocktails, spirits, soda, juice, water and syrups, visible 'мл/ml' must map to measureUnit='ml'.",
            "For food portions where visible unit is 'г/g', map to measureUnit='g'.",
            "If the source shows composite notation like 1/200, 120/30, 100/50/20, 1 pcs / 250 g or similar, do not put that into measureValue.",
            "For composite serving notations set measureValue to null and measureUnit to null.",
            "For variants use the variants array only when one menu item has multiple sizes or option rows under the same item.",
            "If one item has multiple sizes and multiple prices on the same line or in the same row block, return them as variants and pair them by order.",
            "If a local block or subsection has one shared size header for multiple following items, apply that size header to every item in that block.",
            "If needed, store that shared size header in section.description so downstream normalization can reuse it.",
            "Parent item price must be null when variants are present.",
            "Use this target shape for such rows: "
            "{\"name\":\"Фильтр-кофе\",\"price\":null,\"measureValue\":null,\"measureUnit\":null,"
            "\"variants\":["
            "{\"label\":\"250 мл\",\"price\":\"160\",\"measureValue\":250,\"measureUnit\":\"ml\"},"
            "{\"label\":\"350 мл\",\"price\":\"190\",\"measureValue\":350,\"measureUnit\":\"ml\"},"
            "{\"label\":\"450 мл\",\"price\":\"220\",\"measureValue\":450,\"measureUnit\":\"ml\"}"
            "]}",
            "Do not return price='160/190/220' or measureValue='250/350/450' on the parent item in that case.",
            "Another example: subsection 'Домашние лимонады' with shared size header '0,25/1л' and item '«Классический» 180/650' "
            "must become one item with variants [{label:'0.25 л', price:'180'}, {label:'1 л', price:'650'}], not price='180/650'.",
            "If there are no variants, return an empty variants array.",
            f"Page number: {page_number}",
            f"Source kind: {source_kind}",
            "Return strict structured data only, matching the schema. No prose.",
            f"Source filename: {file_name}",
        ]
        if previous_section_headings:
            lines.append(f"Previous page ended with sections: {', '.join(previous_section_headings)}")
        if menu_link:
            lines.append(f"Menu link reference: {menu_link}")
        if venue_name:
            lines.append(f"Known venue name: {venue_name}")
        if city:
            lines.append(f"Known city: {city}")
        return "\n".join(lines)

    def _build_file_content(self, *, file_path: Path, file_name: str, mime_type: str | None) -> dict[str, Any]:
        if mime_type == "application/pdf":
            encoded = base64.b64encode(file_path.read_bytes()).decode("utf-8")
            return {
                "type": "file",
                "file": {
                    "filename": file_name,
                    "file_data": f"data:application/pdf;base64,{encoded}",
                },
            }

        encoded = base64.b64encode(file_path.read_bytes()).decode("utf-8")
        media_type = mime_type or "image/jpeg"
        return {
            "type": "image_url",
            "image_url": {
                "url": f"data:{media_type};base64,{encoded}",
            },
        }

    def normalize_menu(self, menu: MenuPayload) -> MenuPayload:
        if not self.enabled:
            raise RuntimeError("OPENROUTER_API_KEY is not configured")

        payload: dict[str, Any] = {
            "model": self.settings.menu_import_model,
            "temperature": 0,
            "max_completion_tokens": self.settings.menu_normalization_max_completion_tokens,
            "messages": [
                {
                    "role": "system",
                    "content": "You normalize restaurant menu JSON. Return only structured data following the provided JSON schema.",
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Normalize this menu JSON without changing its structure.\n"
                                "Rules:\n"
                                "- Preserve category count, item count, variant count, ids, sortOrder, prices, measureValue, measureUnit, availability, images and translations.\n"
                                "- Fix obvious OCR and spelling mistakes in menu names, category names, item names, descriptions, variant labels and tags.\n"
                                "- Normalize casing to sentence case: first letter uppercase, remaining letters lowercase.\n"
                                "- For Russian menu fields, remove duplicated English subtitles from category names and item names when both languages are packed into one string.\n"
                                "- Example: 'Салаты / salads' -> 'Салаты', 'Супы / soups' -> 'Супы', 'Безалкогольные напитки / soft drinks' -> 'Безалкогольные напитки'.\n"
                                "- If measureValue and measureUnit already store the size, remove duplicated unit text from variant labels.\n"
                                "- Example: label '250 мл' with measureValue=250 and measureUnit='ml' should become '250'.\n"
                                "- Do not invent dishes, categories, descriptions, prices or variants.\n"
                                "- Return the same schema only.\n"
                                f"Menu JSON:\n{json.dumps(menu.model_dump(mode='json'), ensure_ascii=False)}"
                            ),
                        }
                    ],
                },
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "kwikmenu_menu_normalization",
                    "strict": True,
                    "schema": MenuPayload.model_json_schema(),
                },
            },
            "stream": False,
        }

        response_payload = self._post_json(payload)
        raw_content = response_payload["choices"][0]["message"]["content"]
        structured = self._decode_structured_content(raw_content, operation="menu normalization")
        return MenuPayload.model_validate(structured)

    def _decode_structured_content(self, raw_content: Any, *, operation: str) -> Any:
        if not isinstance(raw_content, str):
            return raw_content

        try:
            return json.loads(raw_content)
        except JSONDecodeError as exc:
            preview = raw_content[max(0, exc.pos - 120):exc.pos + 120]
            raise RuntimeError(
                f"OpenRouter returned invalid JSON for {operation}. "
                f"The response was likely truncated or malformed near char {exc.pos}. "
                f"Preview: {preview!r}"
            ) from exc

    def _post_json(self, payload: dict[str, Any]) -> dict[str, Any]:
        data = json.dumps(payload).encode("utf-8")
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        req = request.Request(
            self.endpoint,
            data=data,
            headers={
                "Authorization": f"Bearer {self.settings.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": self.settings.openrouter_referer,
                "X-Title": self.settings.openrouter_app_name,
            },
            method="POST",
        )

        try:
            with request.urlopen(
                req,
                timeout=self.settings.menu_import_request_timeout_seconds,
                context=ssl_context,
            ) as response:
                return json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"OpenRouter request failed: {exc.code} {detail}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"OpenRouter connection failed: {exc.reason}") from exc
