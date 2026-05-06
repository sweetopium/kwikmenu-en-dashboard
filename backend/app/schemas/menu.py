from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class MenuUnit(str, Enum):
    ml = "ml"
    l = "l"
    g = "g"
    kg = "kg"
    pcs = "pcs"
    portion = "portion"


def normalize_menu_unit_value(value: object) -> str | None:
    if value is None:
        return None

    raw_value = str(value).strip().lower()
    if not raw_value:
        return None

    if "." in raw_value:
        raw_value = raw_value.split(".")[-1]

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
        "pc": "pcs",
        "шт": "pcs",
        "шт.": "pcs",
        "portion": "portion",
        "порция": "portion",
        "порц": "portion",
    }
    return mapping.get(raw_value)


class MenuBadge(str, Enum):
    hit = "hit"
    new = "new"
    season = "season"
    spicy = "spicy"
    vegan = "vegan"


class MenuAvailableHours(StrictModel):
    start: str
    end: str


class LocalizedContent(StrictModel):
    name: str | None = None
    description: str | None = None
    label: str | None = None


class MenuLanguage(StrictModel):
    code: str
    shortLabel: str
    nativeName: str
    flag: str | None = None


class MenuSettings(StrictModel):
    templateType: str = "simple-menu"
    showItemImages: bool = False
    theme: str = "imported"
    showLocalSubcategoryNav: bool = False
    variantsLayout: str = "rows"
    showVariantPrices: bool = True
    addonsMode: str = "separate-category"


class MenuMeta(StrictModel):
    id: str
    slug: str
    name: str
    description: str | None = None
    translations: dict[str, LocalizedContent] = Field(default_factory=dict)


class VenueMeta(StrictModel):
    name: str
    description: str | None = None
    logoUrl: str | None = None
    coverImageUrl: str | None = None


class MenuVariant(StrictModel):
    id: str
    label: str
    price: str
    measureValue: int | float | None = None
    measureUnit: MenuUnit | None = None
    sortOrder: int
    isAvailable: bool = True
    translations: dict[str, LocalizedContent] = Field(default_factory=dict)

    @field_validator("measureUnit", mode="before")
    @classmethod
    def validate_measure_unit(cls, value: object) -> object:
        return normalize_menu_unit_value(value)


class MenuItem(StrictModel):
    id: str
    name: str
    description: str | None = None
    price: str | None = None
    measureValue: int | float | None = None
    measureUnit: MenuUnit | None = None
    sortOrder: int
    isAvailable: bool = True
    imageUrl: str | None = None
    tags: list[str] = Field(default_factory=list)
    badge: MenuBadge | None = None
    availableHours: MenuAvailableHours | None = None
    translations: dict[str, LocalizedContent] = Field(default_factory=dict)
    variants: list[MenuVariant] = Field(default_factory=list)

    @field_validator("measureUnit", mode="before")
    @classmethod
    def validate_measure_unit(cls, value: object) -> object:
        return normalize_menu_unit_value(value)


class MenuCategory(StrictModel):
    id: str
    name: str
    description: str | None = None
    sortOrder: int
    isHidden: bool = False
    imageUrl: str | None = None
    items: list[MenuItem] = Field(default_factory=list)
    availableHours: MenuAvailableHours | None = None
    translations: dict[str, LocalizedContent] = Field(default_factory=dict)


class MenuPayload(StrictModel):
    schemaVersion: int = 2
    defaultLanguage: str = "ru"
    currency: str = "RUB"
    settings: MenuSettings = Field(default_factory=MenuSettings)
    languages: list[MenuLanguage] = Field(
        default_factory=lambda: [
            MenuLanguage(code="ru", shortLabel="RU", nativeName="Русский", flag="RU"),
            MenuLanguage(code="en", shortLabel="EN", nativeName="English", flag="EN"),
        ]
    )
    menuMeta: MenuMeta
    venue: VenueMeta
    categories: list[MenuCategory]
