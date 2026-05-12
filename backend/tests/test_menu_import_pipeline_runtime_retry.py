import unittest
from pathlib import Path

from app.schemas.menu_extract import ExtractedItem, ExtractedPage, ExtractedSection
from app.services.menu_import_pipeline import MenuImportPipeline
from app.services.page_normalizer import NormalizedPage


class FlakyOpenRouterClient:
    def __init__(self) -> None:
        self.enabled = True
        self.calls = 0

    def extract_page(self, **_: object) -> ExtractedPage:
        self.calls += 1
        if self.calls == 1:
            raise RuntimeError("OpenRouter returned malformed structured content for page 2 (01.pdf).")
        return ExtractedPage(
            pageNumber=2,
            sections=[
                ExtractedSection(
                    heading="Десерты",
                    items=[ExtractedItem(name="Наполеон", price="450")],
                )
            ],
        )


class MenuImportPipelineRuntimeRetryTests(unittest.TestCase):
    def test_parse_page_retries_after_runtime_error(self) -> None:
        pipeline = MenuImportPipeline()
        pipeline.settings.menu_import_page_parse_attempts = 3
        pipeline.openrouter = FlakyOpenRouterClient()

        parsed_page, warnings, used_fallback = pipeline._parse_page(
            page=NormalizedPage(
                page_number=2,
                source_name="01.pdf",
                source_kind="pdf",
                mime_type="image/png",
                image_path=Path("rendered-pages/01-page-2.png"),
            ),
            context={},
            previous_section_headings=[],
        )

        self.assertEqual(pipeline.openrouter.calls, 2)
        self.assertEqual(parsed_page.sections[0].heading, "Десерты")
        self.assertEqual(warnings, [])
        self.assertFalse(used_fallback)


if __name__ == "__main__":
    unittest.main()
