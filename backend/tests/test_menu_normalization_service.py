import unittest

from app.schemas.menu import MenuCategory, MenuItem, MenuMeta, MenuPayload, MenuSettings, VenueMeta
from app.services.menu_normalization_service import MenuNormalizationService


class MenuNormalizationServiceTests(unittest.TestCase):
    def test_apply_deterministic_cleanup_normalizes_category_name_sentence_case(self) -> None:
        service = MenuNormalizationService()
        menu = MenuPayload(
            settings=MenuSettings(),
            menuMeta=MenuMeta(
                id="menu-1",
                slug="menu-1",
                name="ОСНОВНОЕ МЕНЮ",
            ),
            venue=VenueMeta(name="Тест"),
            categories=[
                MenuCategory(
                    id="cat-1",
                    name="ХОЛОДНЫЕ ЗАКУСКИ",
                    sortOrder=0,
                    items=[
                        MenuItem(
                            id="item-1",
                            name="ЦЕЗАРЬ С КУРИЦЕЙ",
                            sortOrder=0,
                            price="790",
                        )
                    ],
                )
            ],
        )

        normalized = service.apply_deterministic_cleanup(menu)

        self.assertEqual(normalized.categories[0].name, "Холодные закуски")
        self.assertEqual(normalized.categories[0].items[0].name, "Цезарь с курицей")
        self.assertEqual(normalized.menuMeta.name, "Основное меню")


if __name__ == "__main__":
    unittest.main()
