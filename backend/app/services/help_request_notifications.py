from __future__ import annotations

import json
from urllib import error, request

from app.core.config import get_settings
from app.models import HelpRequest


MESSENGER_LABELS = {
    "telegram": "Telegram",
    "max": "MAX",
    "whatsapp": "WhatsApp",
    "call": "Телефонный звонок",
}


def _escape(text: str | None) -> str:
    value = (text or "").strip()
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _format_menu_source(help_request: HelpRequest) -> str:
    if help_request.upload_later:
        return "⏳ Прикрепит позже"

    if help_request.menu_source == "link" and help_request.menu_link:
        return f"🔗 <a href=\"{_escape(help_request.menu_link)}\">Открыть ссылку на меню</a>"

    if help_request.menu_file_name:
        size_hint = ""
        if help_request.menu_file_size_bytes:
            size_kb = max(1, round(help_request.menu_file_size_bytes / 1024))
            size_hint = f" ({size_kb} KB)"
        return f"📎 Файл: <b>{_escape(help_request.menu_file_name)}</b>{size_hint}"

    return "—"


def build_help_request_telegram_message(help_request: HelpRequest) -> str:
    messenger = MESSENGER_LABELS.get(help_request.messenger, help_request.messenger)
    parts = [
        "🟣 <b>Новая заявка в Kwikmenu</b>",
        "",
        f"🏪 <b>Заведение:</b> {_escape(help_request.restaurant_name)}",
        f"👤 <b>Имя:</b> {_escape(help_request.name)}",
        f"📞 <b>Контакт:</b> {_escape(help_request.phone)}",
        f"💬 <b>Канал связи:</b> {_escape(messenger)}",
        f"🌍 <b>Локация:</b> {_escape(help_request.country_name)}, {_escape(help_request.city)}",
        f"📋 <b>Меню:</b> {_format_menu_source(help_request)}",
        "",
        f"🆔 <code>{_escape(help_request.id)}</code>",
    ]
    return "\n".join(parts)


def send_help_request_to_telegram(help_request: HelpRequest) -> tuple[bool, int | None, str | None]:
    settings = get_settings()
    if not settings.help_requests_telegram_bot_token or not settings.help_requests_telegram_chat_id:
        return False, None, "Telegram bot token or chat id is not configured."

    endpoint = f"https://api.telegram.org/bot{settings.help_requests_telegram_bot_token}/sendMessage"
    payload = {
        "chat_id": settings.help_requests_telegram_chat_id,
        "text": build_help_request_telegram_message(help_request),
        "parse_mode": "HTML",
        "disable_web_page_preview": False,
    }
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(endpoint, data=data, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with request.urlopen(req, timeout=15) as response:
            parsed = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        return False, None, f"Telegram HTTP {exc.code}: {detail[:500]}"
    except Exception as exc:  # noqa: BLE001
        return False, None, str(exc)

    if not parsed.get("ok"):
        return False, None, parsed.get("description") or "Telegram API returned ok=false"

    message_id = parsed.get("result", {}).get("message_id")
    return True, message_id, None
