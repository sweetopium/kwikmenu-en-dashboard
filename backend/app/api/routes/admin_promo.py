from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.routes.admin import AdminAccess
from app.models.promo_page import PromoPage
from app.schemas.promo_page import PromoPageCreateRequest, PromoPageUpdateRequest

router = APIRouter(prefix="/api/admin/promo-pages", tags=["admin-promo"])


@router.get("")
def list_promo_pages(
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    pages = db.query(PromoPage).order_by(PromoPage.created_at.desc()).all()
    return {
        "items": [
            {
                "id": page.id,
                "slug": page.slug,
                "title": page.title,
                "content": page.content,
                "createdAt": page.created_at,
                "updatedAt": page.updated_at,
            }
            for page in pages
        ]
    }


@router.get("/{page_id}")
def get_promo_page(
    page_id: str,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    page = db.query(PromoPage).filter(PromoPage.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promo page not found.",
        )
    return {
        "id": page.id,
        "slug": page.slug,
        "title": page.title,
        "content": page.content,
        "createdAt": page.created_at,
        "updatedAt": page.updated_at,
    }


@router.post("")
def create_promo_page(
    payload: PromoPageCreateRequest,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    existing = db.query(PromoPage).filter(PromoPage.slug == payload.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A page with this slug already exists.",
        )

    page = PromoPage(
        slug=payload.slug,
        title=payload.title,
        content=payload.content,
    )
    db.add(page)
    db.commit()
    db.refresh(page)

    return {
        "id": page.id,
        "slug": page.slug,
        "title": page.title,
        "content": page.content,
        "createdAt": page.created_at,
        "updatedAt": page.updated_at,
    }


@router.patch("/{page_id}")
def update_promo_page(
    page_id: str,
    payload: PromoPageUpdateRequest,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    page = db.query(PromoPage).filter(PromoPage.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promo page not found.",
        )

    if payload.slug is not None and payload.slug != page.slug:
        existing = db.query(PromoPage).filter(PromoPage.slug == payload.slug).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A page with this slug already exists.",
            )
        page.slug = payload.slug

    if payload.title is not None:
        page.title = payload.title

    if payload.content is not None:
        page.content = payload.content

    db.commit()
    db.refresh(page)

    return {
        "id": page.id,
        "slug": page.slug,
        "title": page.title,
        "content": page.content,
        "createdAt": page.created_at,
        "updatedAt": page.updated_at,
    }


@router.delete("/{page_id}")
def delete_promo_page(
    page_id: str,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    page = db.query(PromoPage).filter(PromoPage.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promo page not found.",
        )

    db.delete(page)
    db.commit()

    return {"status": "ok"}


from pydantic import BaseModel
class ConvertHtmlRequest(BaseModel):
    html: str

@router.post("/convert-html")
def convert_html_to_json(
    payload: ConvertHtmlRequest,
    _: None = AdminAccess,
) -> dict:
    from app.services.openrouter_client import OpenRouterClient
    openrouter = OpenRouterClient()

    if not openrouter.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OPENROUTER_API_KEY is not configured.",
        )

    prompt = (
        "Extract content from the following restaurant SEO landing page HTML and map it STRICTLY to the target JSON schema below.\n"
        "Return ONLY the valid JSON object fitting the schema. Do not output markdown code blocks or additional text.\n\n"
        "### TARGET SCHEMA STRUCTURE:\n"
        "{\n"
        "  \"registerUrl\": \"string\",\n"
        "  \"helpUrl\": \"string\",\n"
        "  \"videoUrl\": \"string (e.g. from iframe src if any, otherwise default)\",\n"
        "  \"footerTitle\": \"string (the title in footer, e.g. 'Онлайн-меню для ресторана')\",\n"
        "  \"meta\": {\n"
        "    \"title\": \"string\",\n"
        "    \"description\": \"string\"\n"
        "  },\n"
        "  \"hero\": {\n"
        "    \"title\": \"string (include <br /> tag if present in original title)\",\n"
        "    \"description\": \"string\",\n"
        "    \"primaryBtnText\": \"string (text on the primary registration button)\",\n"
        "    \"secondaryBtnText\": \"string (text on the secondary/help button)\",\n"
        "    \"image\": \"string (image path)\"\n"
        "  },\n"
        "  \"process\": {\n"
        "    \"title\": \"string (include html tags like <br /> and gradient spans if any)\",\n"
        "    \"steps\": [\n"
        "      { \"num\": 1, \"title\": \"string\", \"description\": \"string\" }\n"
        "    ]\n"
        "  },\n"
        "  \"formats\": {\n"
        "    \"title\": \"string\",\n"
        "    \"description\": \"string\",\n"
        "    \"items\": [\n"
        "      { \"title\": \"string\", \"tagline\": \"string\", \"description\": \"string\", \"image\": \"string\", \"type\": \"basic|extended\" }\n"
        "    ]\n"
        "  },\n"
        "  \"value\": {\n"
        "    \"title\": \"string\",\n"
        "    \"description\": \"string\",\n"
        "    \"items\": [\n"
        "      { \"icon\": \"launch|savings|fresh|control|format|questions (select nearest matching)\", \"title\": \"string\", \"description\": \"string\" }\n"
        "    ]\n"
        "  },\n"
        "  \"guestValue\": {\n"
        "    \"title\": \"string\",\n"
        "    \"description\": \"string\",\n"
        "    \"items\": [\n"
        "      { \"title\": \"string\", \"description\": \"string\", \"size\": \"large|medium|small|info\" }\n"
        "    ]\n"
        "  },\n"
        "  \"faq\": {\n"
        "    \"title\": \"string\",\n"
        "    \"items\": [\n"
        "      { \"question\": \"string\", \"answer\": \"string\" }\n"
        "    ]\n"
        "  },\n"
        "  \"venues\": {\n"
        "    \"title\": \"string\",\n"
        "    \"description\": \"string\",\n"
        "    \"chips\": [\"string\"]\n"
        "  },\n"
        "  \"cta\": {\n"
        "    \"title\": \"string\",\n"
        "    \"description\": \"string\",\n"
        "    \"primaryBtnText\": \"string\",\n"
        "    \"secondaryBtnText\": \"string\"\n"
        "  }\n"
        "}\n\n"
        f"### INPUT HTML:\n{payload.html}"
    )

    api_payload = {
        "model": openrouter.settings.menu_import_model,
        "temperature": 0.1,
        "messages": [
            {
                "role": "system",
                "content": "You are a precise data extractor. Extract the page content and format it into the requested JSON schema. Do not explain, return ONLY valid JSON.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "response_format": {"type": "json_object"},
        "stream": False,
    }

    try:
        response_payload = openrouter._post_json(api_payload)
        raw_content = response_payload["choices"][0]["message"]["content"]
        structured = json.loads(raw_content)
        return {"content": structured}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"HTML to JSON conversion failed: {exc}",
        )

