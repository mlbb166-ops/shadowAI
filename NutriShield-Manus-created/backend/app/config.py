from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


def _csv_env(name: str, default: str) -> tuple[str, ...]:
    return tuple(x.strip().rstrip("/") for x in os.getenv(name, default).split(",") if x.strip())


@dataclass(frozen=True)
class Settings:
    db_path: Path = Path(os.getenv("NUTRISHIELD_DB_PATH", str(BASE_DIR / "data" / "nutrishield.sqlite3")))
    session_cookie: str = os.getenv("SESSION_COOKIE_NAME", "nutrishield_session")
    session_hours: int = int(os.getenv("SESSION_HOURS", "168"))
    secure_cookie: bool = os.getenv("COOKIE_SECURE", "0") == "1"
    allowed_origins: tuple[str, ...] = _csv_env(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080",
    )
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY") or None
    openai_api_base: str = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1").rstrip("/")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-5-mini")
    telegram_bot_token: str | None = os.getenv("TELEGRAM_BOT_TOKEN") or None
    telegram_webhook_secret: str | None = os.getenv("TELEGRAM_WEBHOOK_SECRET") or None
    frontend_dist: Path = Path(os.getenv("FRONTEND_DIST", str(BASE_DIR.parent / "frontend" / "dist")))
    worker_poll_seconds: float = float(os.getenv("WORKER_POLL_SECONDS", "0.25"))
    policy_version: str = "nutrishield-safety-2026-09-v1"
    source_version: str = "food-normalization-v2"


settings = Settings()
