from __future__ import annotations

import json
from urllib import error, request

from app.core.config import get_settings
from app.models import HelpRequest, MenuImportJob, User, UserSubscription, Venue


MESSENGER_LABELS = {
    "telegram": "Telegram",
    "max": "MAX",
    "whatsapp": "WhatsApp",
    "call": "Phone call",
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
        return "⏳ Will attach later"

    if help_request.menu_source == "link" and help_request.menu_link:
        return f"🔗 <a href=\"{_escape(help_request.menu_link)}\">Open menu link</a>"

    if help_request.menu_file_name:
        size_hint = ""
        if help_request.menu_file_size_bytes:
            size_kb = max(1, round(help_request.menu_file_size_bytes / 1024))
            size_hint = f" ({size_kb} KB)"
        return f"📎 File: <b>{_escape(help_request.menu_file_name)}</b>{size_hint}"

    return "—"


def build_help_request_telegram_message(help_request: HelpRequest) -> str:
    messenger = MESSENGER_LABELS.get(help_request.messenger, help_request.messenger)
    parts = [
        "🟣 <b>New KwikMenu request</b>",
        "",
        f"🏪 <b>Venue:</b> {_escape(help_request.restaurant_name)}",
        f"👤 <b>Name:</b> {_escape(help_request.name)}",
        f"📞 <b>Contact:</b> {_escape(help_request.phone)}",
        f"💬 <b>Contact channel:</b> {_escape(messenger)}",
        f"🌍 <b>Location:</b> {_escape(help_request.country_name)}, {_escape(help_request.city)}",
        f"📋 <b>Menu:</b> {_format_menu_source(help_request)}",
        "",
        f"🆔 <code>{_escape(help_request.id)}</code>",
    ]
    return "\n".join(parts)


def _send_telegram_html_message(text: str, *, disable_web_page_preview: bool = False) -> tuple[bool, int | None, str | None]:
    settings = get_settings()
    if not settings.help_requests_telegram_bot_token or not settings.help_requests_telegram_chat_id:
        return False, None, "Telegram bot token or chat id is not configured."

    telegram_api_base_url = settings.telegram_api_base_url.rstrip("/")
    endpoint = f"{telegram_api_base_url}/bot{settings.help_requests_telegram_bot_token}/sendMessage"
    payload = {
        "chat_id": settings.help_requests_telegram_chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": disable_web_page_preview,
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


def send_help_request_to_telegram(help_request: HelpRequest) -> tuple[bool, int | None, str | None]:
    return _send_telegram_html_message(
        build_help_request_telegram_message(help_request),
        disable_web_page_preview=False,
    )


def build_menu_import_success_telegram_message(
    *,
    job: MenuImportJob,
    user: User | None,
    venue: Venue | None,
) -> str:
    settings = get_settings()
    source_names = ", ".join(_escape(source.name) for source in job.sources[:4])
    if len(job.sources) > 4:
        source_names = f"{source_names} and {len(job.sources) - 4} more"
    flow = _escape((job.context or {}).get("flow") or "unknown")
    public_menu_url = None
    if venue and job.menu_id:
        public_menu_base_url = (settings.public_menu_base_url or settings.menu_import_frontend_origin).rstrip("/")
        public_menu_url = f"{public_menu_base_url}/{venue.id}?menu={job.menu_id}"
    parts = [
        "🟢 <b>Menu successfully recognized</b>",
        "",
        f"🏪 <b>Venue:</b> {_escape((venue.name if venue else None) or (job.context or {}).get('restaurant_name') or '—')}",
        f"👤 <b>User:</b> {_escape(user.email if user else None)}",
        f"🆔 <b>Job ID:</b> <code>{_escape(job.id)}</code>",
        f"📋 <b>Source:</b> {_escape(job.menu_source)}",
        f"📁 <b>Files:</b> <b>{job.document_count or len(job.sources)}</b>",
        f"🧩 <b>Categories:</b> <b>{job.category_count or 0}</b>",
        f"🍽 <b>Items:</b> <b>{job.item_count or 0}</b>",
        f"🧭 <b>Flow:</b> {_escape(flow)}",
    ]
    if source_names:
        parts.append(f"📎 <b>File names:</b> {_escape(source_names)}")
    if job.used_fallback:
        parts.append("⚠️ <b>Fallback template was used</b>")
    if job.warnings:
        parts.append(f"⚠️ <b>Warnings:</b> {_escape(' '.join(str(item) for item in job.warnings[:3]))}")
    if public_menu_url:
        parts.extend(["", f"🔗 <b>Public menu:</b> <a href=\"{_escape(public_menu_url)}\">Open menu</a>"])
    return "\n".join(parts)


def build_menu_import_failure_telegram_message(
    *,
    job: MenuImportJob,
    user: User | None,
    venue: Venue | None,
    error_message: str,
) -> str:
    flow = _escape((job.context or {}).get("flow") or "unknown")
    source_names = ", ".join(_escape(source.name) for source in job.sources[:4])
    if len(job.sources) > 4:
        source_names = f"{source_names} and {len(job.sources) - 4} more"
    parts = [
        "🔴 <b>Menu import failed</b>",
        "",
        f"🏪 <b>Venue:</b> {_escape((venue.name if venue else None) or (job.context or {}).get('restaurant_name') or '—')}",
        f"👤 <b>User:</b> {_escape(user.email if user else None)}",
        f"🆔 <b>Job ID:</b> <code>{_escape(job.id)}</code>",
        f"📋 <b>Source:</b> {_escape(job.menu_source)}",
        f"📁 <b>Files:</b> <b>{job.document_count or len(job.sources)}</b>",
        f"🧭 <b>Flow:</b> {_escape(flow)}",
        f"❌ <b>Error:</b> {_escape(error_message)}",
    ]
    if source_names:
        parts.append(f"📎 <b>File names:</b> {_escape(source_names)}")
    return "\n".join(parts)


def send_menu_import_success_to_telegram(
    *,
    job: MenuImportJob,
    user: User | None,
    venue: Venue | None,
) -> tuple[bool, int | None, str | None]:
    return _send_telegram_html_message(
        build_menu_import_success_telegram_message(job=job, user=user, venue=venue),
        disable_web_page_preview=True,
    )


def send_menu_import_failure_to_telegram(
    *,
    job: MenuImportJob,
    user: User | None,
    venue: Venue | None,
    error_message: str,
) -> tuple[bool, int | None, str | None]:
    return _send_telegram_html_message(
        build_menu_import_failure_telegram_message(job=job, user=user, venue=venue, error_message=error_message),
        disable_web_page_preview=True,
    )


def _format_datetime(value) -> str:
    if value is None:
        return "—"
    return value.strftime("%Y-%m-%d %H:%M UTC")


def build_stripe_invoice_payment_telegram_message(
    *,
    succeeded: bool,
    user: User | None,
    subscription: UserSubscription | None,
    amount: str,
    stripe_invoice_id: str | None,
    stripe_subscription_id: str | None,
) -> str:
    title = "🟢 <b>Stripe payment succeeded</b>" if succeeded else "🔴 <b>Stripe payment failed</b>"
    plan_name = subscription.plan.name if subscription and subscription.plan else "—"
    status = subscription.status if subscription else "—"
    next_renewal = _format_datetime(subscription.current_period_end if subscription else None)
    invoice_id = stripe_invoice_id or "—"
    subscription_id = stripe_subscription_id or (subscription.stripe_subscription_id if subscription else None) or "—"
    parts = [
        title,
        "",
        f"👤 <b>User:</b> {_escape(user.email if user else None)}",
        f"📦 <b>Plan:</b> {_escape(plan_name)}",
        f"💳 <b>Amount:</b> {_escape(amount)}",
        f"🧾 <b>Stripe invoice ID:</b> <code>{_escape(invoice_id)}</code>",
        f"🔁 <b>Stripe subscription ID:</b> <code>{_escape(subscription_id)}</code>",
        f"📌 <b>Status:</b> {_escape(status)}",
        f"📅 <b>Next renewal:</b> {_escape(next_renewal)}",
    ]
    return "\n".join(parts)


def send_stripe_invoice_payment_to_telegram(
    *,
    succeeded: bool,
    user: User | None,
    subscription: UserSubscription | None,
    amount: str,
    stripe_invoice_id: str | None,
    stripe_subscription_id: str | None,
) -> tuple[bool, int | None, str | None]:
    return _send_telegram_html_message(
        build_stripe_invoice_payment_telegram_message(
            succeeded=succeeded,
            user=user,
            subscription=subscription,
            amount=amount,
            stripe_invoice_id=stripe_invoice_id,
            stripe_subscription_id=stripe_subscription_id,
        ),
        disable_web_page_preview=True,
    )


def build_stripe_checkout_completed_telegram_message(
    *,
    user: User | None,
    subscription: UserSubscription | None,
    stripe_session_id: str | None,
    stripe_subscription_id: str | None,
) -> str:
    plan_name = subscription.plan.name if subscription and subscription.plan else "—"
    status = subscription.status if subscription else "—"
    trial_end = _format_datetime(subscription.trial_ends_at if subscription else None)
    next_renewal = _format_datetime(subscription.current_period_end if subscription else None)
    subscription_id = stripe_subscription_id or (subscription.stripe_subscription_id if subscription else None) or "—"
    session_id = stripe_session_id or "—"
    parts = [
        "🔵 <b>Stripe payment method added</b>",
        "",
        f"👤 <b>User:</b> {_escape(user.email if user else None)}",
        f"📦 <b>Plan:</b> {_escape(plan_name)}",
        "💳 <b>Amount now:</b> <b>0.00 USD</b>",
        f"🔁 <b>Stripe subscription ID:</b> <code>{_escape(subscription_id)}</code>",
        f"🧾 <b>Stripe session ID:</b> <code>{_escape(session_id)}</code>",
        f"📌 <b>Status:</b> {_escape(status)}",
        f"🎁 <b>Trial end:</b> {_escape(trial_end)}",
        f"📅 <b>First charge / next renewal:</b> {_escape(next_renewal)}",
    ]
    return "\n".join(parts)


def send_stripe_checkout_completed_to_telegram(
    *,
    user: User | None,
    subscription: UserSubscription | None,
    stripe_session_id: str | None,
    stripe_subscription_id: str | None,
) -> tuple[bool, int | None, str | None]:
    return _send_telegram_html_message(
        build_stripe_checkout_completed_telegram_message(
            user=user,
            subscription=subscription,
            stripe_session_id=stripe_session_id,
            stripe_subscription_id=stripe_subscription_id,
        ),
        disable_web_page_preview=True,
    )
