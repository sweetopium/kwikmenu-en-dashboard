from pydantic import Field

from app.schemas.menu import LocalizedContent, MenuAvailableHours, MenuBadge, MenuUnit, StrictModel


RawMeasureValue = int | float | str | None


class ExtractedVariant(StrictModel):
    label: str
    price: str
    measureValue: RawMeasureValue = None
    measureUnit: MenuUnit | None = None
    isAvailable: bool = True
    translations: dict[str, LocalizedContent] = Field(default_factory=dict)


class ExtractedItem(StrictModel):
    name: str
    description: str | None = None
    price: str | None = None
    measureValue: RawMeasureValue = None
    measureUnit: MenuUnit | None = None
    isAvailable: bool = True
    tags: list[str] = Field(default_factory=list)
    badge: MenuBadge | None = None
    availableHours: MenuAvailableHours | None = None
    translations: dict[str, LocalizedContent] = Field(default_factory=dict)
    variants: list[ExtractedVariant] = Field(default_factory=list)


class ExtractedSection(StrictModel):
    heading: str | None = None
    description: str | None = None
    continuedFromPreviousPage: bool = False
    continuesToNextPage: bool = False
    isHidden: bool = False
    availableHours: MenuAvailableHours | None = None
    translations: dict[str, LocalizedContent] = Field(default_factory=dict)
    items: list[ExtractedItem] = Field(default_factory=list)


class ExtractedPage(StrictModel):
    pageNumber: int
    menuName: str | None = None
    menuDescription: str | None = None
    venueName: str | None = None
    venueDescription: str | None = None
    languages: list[str] = Field(default_factory=list)
    sections: list[ExtractedSection] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
