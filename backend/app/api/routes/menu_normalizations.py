from fastapi import APIRouter

from app.schemas.menu_normalization import MenuNormalizationRequest, MenuNormalizationResult
from app.services.menu_normalization_service import MenuNormalizationService


router = APIRouter(prefix="/api/menu-normalizations", tags=["menu-normalizations"])
service = MenuNormalizationService()


@router.post("", response_model=MenuNormalizationResult)
def normalize_menu(payload: MenuNormalizationRequest) -> MenuNormalizationResult:
    return service.run(payload.menu)
