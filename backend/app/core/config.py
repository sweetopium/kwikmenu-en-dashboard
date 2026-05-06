from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "KwikMenu Import API"
    app_env: str = "development"
    menu_import_model: str = "google/gemini-3-flash-preview"
    menu_import_max_completion_tokens: int = 8000
    menu_import_request_timeout_seconds: int = 180
    menu_import_max_items_per_single_category: int = 25
    menu_import_api_url: str = "http://localhost:8000"
    menu_import_frontend_origin: str = "http://localhost:5173"
    menu_import_frontend_origin_regex: str = r"https?://(localhost|127\.0\.0\.1)(:\d+)?"
    openrouter_api_key: str | None = None
    openrouter_referer: str = "http://localhost:5173"
    openrouter_app_name: str = "KwikMenu Dashboard"
    openrouter_pdf_engine: str | None = None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
