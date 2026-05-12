import unittest

from app.schemas.menu_extract import ExtractedPage, ExtractedSection, ExtractedItem
from app.services.openrouter_client import OpenRouterClient


class StubOpenRouterClient(OpenRouterClient):
    def __init__(self, responses: list[dict]) -> None:
        super().__init__()
        self.settings.openrouter_api_key = "test"
        self.responses = list(responses)
        self.payloads: list[dict] = []

    def _post_json(self, payload: dict) -> dict:
        self.payloads.append(payload)
        index = min(len(self.payloads) - 1, len(self.responses) - 1)
        return self.responses[index]


class OpenRouterClientTests(unittest.TestCase):
    def test_extract_page_retries_with_larger_token_budget_after_length_finish_reason(self) -> None:
        valid_page = ExtractedPage(
            pageNumber=2,
            sections=[
                ExtractedSection(
                    heading="Десерты",
                    items=[ExtractedItem(name="Наполеон", price="450")],
                )
            ],
        )
        client = StubOpenRouterClient(
            responses=[
                {
                    "choices": [
                        {
                            "finish_reason": "length",
                            "message": {
                                "content": "{\"pageNumber\": 2"
                            },
                        }
                    ]
                },
                {
                    "choices": [
                        {
                            "finish_reason": "stop",
                            "message": {
                                "content": valid_page.model_dump_json()
                            },
                        }
                    ]
                },
            ]
        )
        client.settings.menu_import_max_completion_tokens = 12000
        client.settings.menu_import_retry_max_completion_tokens = 24000

        page = client.extract_page(
            page_number=2,
            source_kind="pdf",
            file_path=None,
            file_name="01.pdf",
            mime_type="image/png",
            menu_link=None,
            context={},
            previous_section_headings=[],
        )

        self.assertEqual(page.sections[0].heading, "Десерты")
        self.assertEqual(client.payloads[0]["max_completion_tokens"], 12000)
        self.assertEqual(client.payloads[1]["max_completion_tokens"], 24000)


if __name__ == "__main__":
    unittest.main()
