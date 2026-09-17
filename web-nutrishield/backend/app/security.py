from __future__ import annotations

import base64
import hashlib
import hmac
import re
import secrets
from datetime import datetime, timezone

PBKDF2_ITERATIONS = 310_000
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
LINK_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utcnow().isoformat(timespec="milliseconds")


def normalize_email(value: str) -> str:
    email = value.strip().casefold()
    if len(email) > 254 or not EMAIL_RE.fullmatch(email):
        raise ValueError("Alamat email tidak valid")
    return email


def validate_password(password: str) -> None:
    if len(password) < 10 or len(password) > 256:
        raise ValueError("Kata sandi harus 10–256 karakter")
    if not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
        raise ValueError("Kata sandi harus memuat huruf dan angka")


def hash_password(password: str, salt: bytes | None = None, iterations: int = PBKDF2_ITERATIONS) -> tuple[bytes, bytes, int]:
    validate_password(password)
    actual_salt = salt or secrets.token_bytes(24)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), actual_salt, iterations, dklen=32)
    return actual_salt, digest, iterations


def verify_password(password: str, salt: bytes, expected: bytes, iterations: int) -> bool:
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations, dklen=32)
    return hmac.compare_digest(actual, expected)


def new_session_token() -> tuple[str, bytes]:
    token = secrets.token_urlsafe(32)
    return token, token_digest(token)


def token_digest(token: str) -> bytes:
    return hashlib.sha256(token.encode("ascii", "strict")).digest()


def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_urlsafe(12)}"


def new_link_code() -> tuple[str, bytes]:
    raw = "".join(secrets.choice(LINK_ALPHABET) for _ in range(8))
    code = f"{raw[:4]}-{raw[4:]}"
    return code, hashlib.sha256(raw.encode("ascii")).digest()


def link_code_digest(code: str) -> bytes:
    normalized = re.sub(r"[^A-Za-z0-9]", "", code).upper()
    return hashlib.sha256(normalized.encode("ascii")).digest()


def safe_b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii")
