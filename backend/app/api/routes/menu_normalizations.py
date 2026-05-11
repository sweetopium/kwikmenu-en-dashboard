from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models import User
from app.schemas.menu_normalization import MenuNormalizationRequest, MenuNormalizationResult
from app.services.menu_normalization_service import MenuNormalizationService


router = APIRouter(prefix="/api/menu-normalizations", tags=["menu-normalizations"])
service = MenuNormalizationService()


@router.post("", response_model=MenuNormalizationResult)
def normalize_menu(
    payload: MenuNormalizationRequest,
    current_user: User = Depends(get_current_user),
) -> MenuNormalizationResult:
    return service.run(payload.menu)
