from pydantic import Field

from app.schemas.menu import MenuPayload, StrictModel


class MenuNormalizationRequest(StrictModel):
    menu: MenuPayload


class MenuNormalizationResult(StrictModel):
    menu: MenuPayload
    usedFallback: bool = False
    warnings: list[str] = Field(default_factory=list)

