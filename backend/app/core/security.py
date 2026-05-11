from __future__ import annotations

import base64
import hashlib
import secrets
from hmac import compare_digest

from app.core.config import get_settings


def hash_password(password: str) -> str:
    settings = get_settings()
    salt = secrets.token_bytes(16)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        settings.auth_password_hash_iterations,
    )
    return "pbkdf2_sha256${iterations}${salt}${hash}".format(
        iterations=settings.auth_password_hash_iterations,
        salt=base64.b64encode(salt).decode("utf-8"),
        hash=base64.b64encode(derived_key).decode("utf-8"),
    )


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations, encoded_salt, encoded_hash = password_hash.split("$", 3)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    salt = base64.b64decode(encoded_salt.encode("utf-8"))
    expected_hash = base64.b64decode(encoded_hash.encode("utf-8"))
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        int(iterations),
    )
    return compare_digest(expected_hash, derived_key)


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)
