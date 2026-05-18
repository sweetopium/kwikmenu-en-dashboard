from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.admin import router as admin_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.help_requests import router as help_requests_router
from app.api.routes.menus import router as menus_router
from app.api.routes.menu_imports import router as menu_imports_router
from app.api.routes.menu_normalizations import router as menu_normalizations_router
from app.api.routes.public import router as public_router
from app.api.routes.venues import router as venues_router
from app.core.config import get_settings
from app.core.paths import DATA_ROOT, UPLOADS_ROOT


def create_app() -> FastAPI:
    settings = get_settings()
    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    UPLOADS_ROOT.mkdir(parents=True, exist_ok=True)

    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.menu_import_frontend_origin,
            settings.admin_frontend_origin,
            "http://127.0.0.1:5173",
            "http://localhost:5173",
            "http://127.0.0.1:5174",
            "http://localhost:5174",
        ],
        allow_origin_regex=settings.menu_import_frontend_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(admin_router)
    app.include_router(auth_router)
    app.include_router(analytics_router)
    app.include_router(health_router)
    app.include_router(help_requests_router)
    app.include_router(menus_router)
    app.include_router(menu_imports_router)
    app.include_router(menu_normalizations_router)
    app.include_router(public_router)
    app.include_router(venues_router)
    return app


app = create_app()
