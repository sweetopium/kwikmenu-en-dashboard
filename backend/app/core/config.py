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

    database_url: str = "postgresql+psycopg://kwikmenu:kwikmenu@postgres:5432/kwikmenu"
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/1"

    openrouter_api_key: str | None = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_referer: str | None = None
    openrouter_app_name: str = "KwikMenu Dashboard"
    openrouter_title: str = "KwikMenu Import"
    openrouter_pdf_engine: str | None = None

    menu_import_model: str = "openai/gpt-4.1-mini"
    menu_import_max_completion_tokens: int = 12000
    menu_import_retry_max_completion_tokens: int = 24000
    menu_normalization_max_completion_tokens: int = 24000
    menu_import_request_timeout_seconds: int = 180
    menu_import_page_parse_attempts: int = 3
    menu_import_task_soft_time_limit_seconds: int = 60
    menu_import_task_hard_time_limit_seconds: int = 70
    menu_import_max_items_per_single_category: int = 40

    menu_import_frontend_origin: str = "http://localhost:5173"
    menu_import_frontend_origin_regex: str | None = None
    menu_import_api_url: str = "http://localhost:8000"
    public_menu_base_url: str | None = None
    admin_frontend_origin: str = "http://localhost:5174"
    admin_api_key: str | None = None
    admin_allowed_ips: str = "*"

    auth_session_cookie_name: str = "kwikmenu_session"
    auth_session_ttl_hours: int = 720
    auth_cookie_secure: bool = False
    auth_cookie_domain: str | None = None
    auth_password_hash_iterations: int = 600000

    oauth_google_client_id: str | None = None
    oauth_google_client_secret: str | None = None
    oauth_yandex_client_id: str | None = None
    oauth_yandex_client_secret: str | None = None
    oauth_mailru_client_id: str | None = None
    oauth_mailru_client_secret: str | None = None

    help_requests_telegram_bot_token: str | None = None
    help_requests_telegram_chat_id: str | None = None

    currency: str = "RUB"
    billing_trial_days: int = 14
    billing_grace_period_days: int = 3
    billing_default_plan_code: str = "starter"

    unitpay_base_url: str = "https://unitpay.ru"
    unitpay_api_url: str = "https://unitpay.ru/api"
    unitpay_public_key: str | None = None
    unitpay_project_id: int | None = None
    unitpay_secret_key: str | None = None
    unitpay_login: str | None = None
    unitpay_test_mode: bool = False
    unitpay_payment_type: str = "card"
    unitpay_hide_other_methods: bool = True
    unitpay_callback_url: str | None = None
    unitpay_success_url: str | None = None
    unitpay_fail_url: str | None = None
    unitpay_allowed_ips: str = ""


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
