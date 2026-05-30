from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models import User
from app.schemas.media import MediaUploadUrlRequest, MediaUploadUrlResponse
from app.services.object_storage import ObjectStorageClient


router = APIRouter(prefix="/api/media", tags=["media"])


@router.post("/menu-item-image/upload-url", response_model=MediaUploadUrlResponse)
def create_menu_item_image_upload_url(
    payload: MediaUploadUrlRequest,
    current_user: User = Depends(get_current_user),
) -> MediaUploadUrlResponse:
    storage = ObjectStorageClient()
    result = storage.generate_menu_item_upload(
        user_id=current_user.id,
        filename=payload.filename,
        content_type=payload.contentType,
    )
    return MediaUploadUrlResponse(
        uploadUrl=result.upload_url,
        publicUrl=result.public_url,
        objectKey=result.object_key,
        headers=result.headers,
    )
