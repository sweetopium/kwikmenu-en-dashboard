import unittest
from pathlib import Path

from app.schemas.menu_extract import ExtractedItem, ExtractedPage, ExtractedSection
from app.services.menu_import_pipeline import MenuImportPipeline
from app.services.page_normalizer import NormalizedPage


class FakeOpenRouterClient:
    def __init__(self, responses: list[ExtractedPage]) -> None:
        self.enabled = True
        self._responses = list(responses)
        self.calls = 0

    def extract_page(self, **_: object) -> ExtractedPage:
        self.calls += 1
        index = min(self.calls - 1, len(self._responses) - 1)
        return self._responses[index]


class MenuImportPipelineTests(unittest.TestCase):
    def _build_page(self) -> NormalizedPage:
        return NormalizedPage(
            page_number=1,
            source_name="01.pdf",
            source_kind="pdf",
            mime_type="image/png",
            image_path=Path("rendered-pages/01-page-1.png"),
        )

    def test_parse_page_retries_after_empty_sections(self) -> None:
        pipeline = MenuImportPipeline()
        pipeline.settings.menu_import_page_parse_attempts = 3
        pipeline.openrouter = FakeOpenRouterClient(
            responses=[
                ExtractedPage(pageNumber=1, sections=[]),
                ExtractedPage(
                    pageNumber=1,
                    sections=[
                        ExtractedSection(
                            heading="Салаты",
                            items=[ExtractedItem(name="Греческий", price="680")],
                        )
                    ],
                ),
            ]
        )

        parsed_page, warnings, used_fallback = pipeline._parse_page(
            page=self._build_page(),
            context={},
            previous_section_headings=[],
        )

        self.assertEqual(pipeline.openrouter.calls, 2)
        self.assertFalse(used_fallback)
        self.assertEqual(warnings, [])
        self.assertEqual(len(parsed_page.sections), 1)
        self.assertEqual(parsed_page.sections[0].heading, "Салаты")

    def test_parse_page_raises_after_retry_budget_is_exhausted(self) -> None:
        pipeline = MenuImportPipeline()
        pipeline.settings.menu_import_page_parse_attempts = 2
        pipeline.openrouter = FakeOpenRouterClient(
            responses=[
                ExtractedPage(pageNumber=1, sections=[]),
                ExtractedPage(pageNumber=1, sections=[]),
            ]
        )

        with self.assertRaisesRegex(ValueError, "Parser returned no sections for page 1"):
            pipeline._parse_page(
                page=self._build_page(),
                context={},
                previous_section_headings=[],
            )

        self.assertEqual(pipeline.openrouter.calls, 2)

    def test_merge_pages_uses_detected_non_english_language_as_default(self) -> None:
        pipeline = MenuImportPipeline()

        payload = pipeline._merge_pages(
            extracted_pages=[
                ExtractedPage(
                    pageNumber=1,
                    languages=["tr"],
                    sections=[
                        ExtractedSection(
                            heading="Başlangıçlar",
                            items=[ExtractedItem(name="Beyran", description="Dana eti, sarımsak", price="250")],
                        )
                    ],
                )
            ],
            context={"restaurant_name": "Istanbul"},
        )

        self.assertEqual(payload.defaultLanguage, "tr")
        self.assertEqual(payload.languages[0].code, "tr")
        self.assertEqual(payload.languages[0].flag, "🇹🇷")
        self.assertEqual(payload.categories[0].name, "Başlangıçlar")
        self.assertEqual(payload.categories[0].items[0].description, "Dana eti, sarımsak")

    def test_merge_pages_falls_back_to_english_when_language_is_unknown(self) -> None:
        pipeline = MenuImportPipeline()

        payload = pipeline._merge_pages(
            extracted_pages=[
                ExtractedPage(
                    pageNumber=1,
                    sections=[
                        ExtractedSection(
                            heading="Starters",
                            items=[ExtractedItem(name="Soup", price="12")],
                        )
                    ],
                )
            ],
            context={},
        )

        self.assertEqual(payload.defaultLanguage, "en")
        self.assertEqual([language.code for language in payload.languages], ["en"])


if __name__ == "__main__":
    unittest.main()
