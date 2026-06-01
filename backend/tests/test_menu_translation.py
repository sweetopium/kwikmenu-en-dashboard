import unittest
import json
from app.schemas.menu import MenuPayload, MenuMeta, VenueMeta, MenuCategory, MenuItem, MenuVariant, MenuSettings, MenuLanguage, LocalizedContent
from app.schemas.menu_translation import extract_translatable, merge_translations, TranslatableMenu, TranslatableMeta, TranslatableCategory, TranslatableItem, TranslatableVariant
from app.services.openrouter_client import OpenRouterClient


class StubOpenRouterClient(OpenRouterClient):
    def __init__(self, response: dict) -> None:
        super().__init__()
        self.settings.openrouter_api_key = "test"
        self.response = response
        self.payload: dict | None = None

    def _post_json(self, payload: dict) -> dict:
        self.payload = payload
        return self.response


class MenuTranslationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.menu_payload = MenuPayload(
            defaultLanguage="ru",
            settings=MenuSettings(),
            menuMeta=MenuMeta(
                id="menu-1",
                slug="menu-1",
                name="Основное меню",
                description="Вкусное описание",
            ),
            venue=VenueMeta(name="Вкусное Место"),
            categories=[
                MenuCategory(
                    id="cat-1",
                    name="Супы",
                    description="Горячие супчики",
                    sortOrder=1,
                    items=[
                        MenuItem(
                            id="item-1",
                            name="Борщ",
                            description="Свежий борщ со сметаной",
                            sortOrder=1,
                            price="350",
                            variants=[
                                MenuVariant(
                                    id="var-1",
                                    label="Большая порция",
                                    price="450",
                                    sortOrder=1,
                                )
                            ]
                        )
                    ]
                )
            ]
        )

    def test_extract_translatable(self) -> None:
        translatable = extract_translatable(self.menu_payload)

        self.assertEqual(translatable.menuMeta.name, "Основное меню")
        self.assertEqual(translatable.menuMeta.description, "Вкусное описание")
        self.assertEqual(len(translatable.categories), 1)
        self.assertEqual(translatable.categories[0].name, "Супы")
        self.assertEqual(translatable.categories[0].description, "Горячие супчики")
        self.assertEqual(len(translatable.items), 1)
        self.assertEqual(translatable.items[0].name, "Борщ")
        self.assertEqual(translatable.items[0].description, "Свежий борщ со сметаной")
        self.assertEqual(len(translatable.items[0].variants), 1)
        self.assertEqual(translatable.items[0].variants[0].label, "Большая порция")

    def test_merge_translations(self) -> None:
        translated = TranslatableMenu(
            menuMeta=TranslatableMeta(name="Main Menu", description="Tasty description"),
            categories=[
                TranslatableCategory(id="cat-1", name="Soups", description="Hot soups")
            ],
            items=[
                TranslatableItem(
                    id="item-1",
                    name="Borscht",
                    description="Fresh borscht with sour cream",
                    variants=[
                        TranslatableVariant(id="var-1", label="Large portion")
                    ]
                )
            ]
        )

        merge_translations(self.menu_payload, translated, "en")

        # Verify translations dicts are filled
        self.assertEqual(self.menu_payload.menuMeta.translations["en"].name, "Main Menu")
        self.assertEqual(self.menu_payload.menuMeta.translations["en"].description, "Tasty description")
        self.assertEqual(self.menu_payload.categories[0].translations["en"].name, "Soups")
        self.assertEqual(self.menu_payload.categories[0].translations["en"].description, "Hot soups")
        self.assertEqual(self.menu_payload.categories[0].items[0].translations["en"].name, "Borscht")
        self.assertEqual(self.menu_payload.categories[0].items[0].translations["en"].description, "Fresh borscht with sour cream")
        self.assertEqual(self.menu_payload.categories[0].items[0].variants[0].translations["en"].label, "Large portion")

        # Verify EN metadata is added
        en_meta = next((lang for lang in self.menu_payload.languages if lang.code == "en"), None)
        self.assertIsNotNone(en_meta)
        self.assertEqual(en_meta.shortLabel, "EN")
        self.assertEqual(en_meta.flag, "🇬🇧")

    def test_openrouter_translate_menu(self) -> None:
        translated_mock = TranslatableMenu(
            menuMeta=TranslatableMeta(name="Main Menu", description="Tasty description"),
            categories=[],
            items=[]
        )
        response_payload = {
            "choices": [
                {
                    "message": {
                        "content": translated_mock.model_dump_json()
                    }
                }
            ]
        }
        client = StubOpenRouterClient(response_payload)
        translatable = extract_translatable(self.menu_payload)

        result = client.translate_menu(translatable, "en")

        self.assertEqual(result.menuMeta.name, "Main Menu")
        self.assertEqual(client.payload["model"], client.settings.menu_import_model)
        self.assertIn("Translate all restaurant menu text in the provided JSON payload into English", client.payload["messages"][0]["content"])


if __name__ == "__main__":
    unittest.main()
