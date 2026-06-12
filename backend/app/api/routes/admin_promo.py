from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

import urllib.request
import urllib.parse
import logging

from app.api.deps import get_db
from app.api.routes.admin import AdminAccess
from app.models.promo_page import PromoPage
from app.schemas.promo_page import PromoPageCreateRequest, PromoPageUpdateRequest
from app.core.config import get_settings

router = APIRouter(prefix="/api/admin/promo-pages", tags=["admin-promo"])


def trigger_promo_revalidation(slug: str | None = None) -> None:
    settings = get_settings()
    token = settings.n8n_webhook_token
    if not token:
        print("[REVALIDATION] Skipped: N8N_WEBHOOK_TOKEN is not set in backend/.env", flush=True)
        logging.getLogger(__name__).info("Revalidation skipped: N8N_WEBHOOK_TOKEN is not set")
        return

    base_url = "https://kwikmenu.ru/api/revalidate-promo"
    params = {"secret": token}
    if slug:
        params["slug"] = slug

    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    print(f"[REVALIDATION] Sending GET request for slug: {slug}", flush=True)
    logging.getLogger(__name__).info("Sending revalidation request for slug: %s", slug)

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "KwikMenu-Backend-Revalidation"},
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            status_code = response.getcode()
            body = response.read().decode("utf-8")
            print(f"[REVALIDATION] Completed successfully code={status_code} body={body}", flush=True)
            logging.getLogger(__name__).info("Revalidation response code=%s body=%r", status_code, body)
    except Exception as exc:
        print(f"[REVALIDATION] Failed: {exc}", flush=True)
        logging.getLogger(__name__).warning("Promo page revalidation failed: %s", exc)



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
    background_tasks: BackgroundTasks,
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

    background_tasks.add_task(trigger_promo_revalidation, page.slug)

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
    background_tasks: BackgroundTasks,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    page = db.query(PromoPage).filter(PromoPage.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promo page not found.",
        )

    old_slug = page.slug

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

    background_tasks.add_task(trigger_promo_revalidation, page.slug)
    if old_slug != page.slug:
        background_tasks.add_task(trigger_promo_revalidation, old_slug)

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
    background_tasks: BackgroundTasks,
    _: None = AdminAccess,
    db: Session = Depends(get_db),
) -> dict:
    page = db.query(PromoPage).filter(PromoPage.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promo page not found.",
        )

    slug = page.slug
    db.delete(page)
    db.commit()

    background_tasks.add_task(trigger_promo_revalidation, slug)

    return {"status": "ok"}


from pydantic import BaseModel
class ConvertHtmlRequest(BaseModel):
    html: str

@router.post("/convert-html")
def convert_html_to_json(
    payload: ConvertHtmlRequest,
    _: None = AdminAccess,
) -> dict:
    import json
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
        "### EXTRACTION RULES:\n"
        "1. meta.title: Extract from <title> tag.\n"
        "2. meta.description: Extract from <meta name=\"description\" content=\"...\">.\n"
        "3. canonicalUrl and url: Extract the value of href from <link rel=\"canonical\" href=\"...\">.\n"
        "4. slug: Extract the last part of the canonical URL without domain (e.g. 'online-menu-dlya-kafe' from 'https://kwikmenu.ru/online-menu-dlya-kafe').\n"
        "5. intent: Extract the 'intent' query parameter value from primary CTA buttons in the page (e.g. 'online-menu-dlya-kafe' from 'https://app.kwikmenu.ru/register?source=seo&intent=online-menu-dlya-kafe').\n"
        "6. pageLabel: Extract clean text of the main <h1> tag without any HTML tags.\n"
        "7. hero.title: Clean text of the main <h1> tag.\n"
        "8. hero.titleHtml: Inner HTML content of the main <h1> tag, retaining tags like <br> or <span> if present.\n"
        "9. hero.description: Text of the paragraph representing hero description (e.g., .hero-text class).\n"
        "10. cta.registerUrl / helpUrl / loginUrl: Hrefs of registration (register), help (WhatsApp or support), and login (login) buttons, preserving all query parameters.\n"
        "11. process.titleHtml: Retain HTML tags and class names/styling in the process section title H2 if present.\n"
        "12. formats.items[].image / hero.image: Extract both 'src' and 'alt' text. Do not put a string directly into image, it must be an object with {src: \"...\", alt: \"...\"}.\n"
        "13. venues.chips: Extract chips as objects with {label: \"...\", href: \"...\"} from HoReCa links section (.venue-chips links). IMPORTANT: Do not include a chip pointing to the current page itself (the page represented by current slug/canonicalUrl).\n"
        "14. business / guest / finalCta: Map these blocks from value block, guestValue block, and cta block respectively.\n\n"
        "### TARGET SCHEMA STRUCTURE:\n"
        "{\n"
        "  \"pageType\": \"commercialLanding\",\n"
        "  \"cluster\": \"string (e.g. 'online-menu', 'electronic-menu', 'qr-menu')\",\n"
        "  \"slug\": \"string\",\n"
        "  \"url\": \"string (same as canonicalUrl)\",\n"
        "  \"canonicalUrl\": \"string\",\n"
        "  \"intent\": \"string\",\n"
        "  \"pageLabel\": \"string\",\n"
        "  \"meta\": {\n"
        "    \"title\": \"string\",\n"
        "    \"description\": \"string\",\n"
        "    \"robots\": \"index,follow\"\n"
        "  },\n"
        "  \"hero\": {\n"
        "    \"title\": \"string\",\n"
        "    \"titleHtml\": \"string\",\n"
        "    \"description\": \"string\",\n"
        "    \"primaryBtnText\": \"string\",\n"
        "    \"secondaryBtnText\": \"string\",\n"
        "    \"image\": {\n"
        "      \"src\": \"string\",\n"
        "      \"alt\": \"string\"\n"
        "    }\n"
        "  },\n"
        "  \"cta\": {\n"
        "    \"registerUrl\": \"string\",\n"
        "    \"helpUrl\": \"string\",\n"
        "    \"loginUrl\": \"string\"\n"
        "  },\n"
        "  \"process\": {\n"
        "    \"title\": \"string\",\n"
        "    \"titleHtml\": \"string\",\n"
        "    \"steps\": [\n"
        "      { \"num\": 1, \"title\": \"string\", \"description\": \"string\" }\n"
        "    ]\n"
        "  },\n"
        "  \"formats\": {\n"
        "    \"title\": \"string\",\n"
        "    \"description\": \"string\",\n"
        "    \"items\": [\n"
        "      {\n"
        "        \"type\": \"basic|extended\",\n"
        "        \"title\": \"string\",\n"
        "        \"tagline\": \"string\",\n"
        "        \"description\": \"string\",\n"
        "        \"image\": {\n"
        "          \"src\": \"string\",\n"
        "          \"alt\": \"string\"\n"
        "        }\n"
        "      }\n"
        "    ]\n"
        "  },\n"
        "  \"business\": {\n"
        "    \"title\": \"string\",\n"
        "    \"description\": \"string\",\n"
        "    \"items\": [\n"
        "      { \"icon\": \"launch|savings|fresh|control|format|questions (nearest matching)\", \"title\": \"string\", \"description\": \"string\" }\n"
        "    ]\n"
        "  },\n"
        "  \"guest\": {\n"
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
        "    \"chips\": [\n"
        "      { \"label\": \"string\", \"href\": \"string\" }\n"
        "    ]\n"
        "  },\n"
        "  \"finalCta\": {\n"
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

