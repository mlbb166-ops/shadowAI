from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent.parent
WEB_DIR = BACKEND_DIR.parent
REPO_DIR = WEB_DIR.parent


def _csv_env(name: str, default: str) -> tuple[str, ...]:
    return tuple(x.strip().rstrip("/") for x in os.getenv(name, default).split(",") if x.strip())


def _llm_base_url() -> str:
    explicit = os.getenv("OPENAI_API_BASE")
    if explicit:
        return explicit.rstrip("/")
    router = os.getenv("ROUTER_BASE_URL", "")
    if router:
        clean = router.rstrip("/")
        for suffix in ("/chat/completions", "/api/v1", "/v1"):
            if clean.endswith(suffix):
                clean = clean[: -len(suffix)]
                break
        return clean.rstrip("/") + "/v1"
    return "https://api.openai.com/v1"


@dataclass(frozen=True)
class Settings:
    db_path: Path = Path(os.getenv("NUTRISHIELD_DB_PATH", str(WEB_DIR / "database" / "runtime" / "nutrishield.sqlite3")))
    session_cookie: str = os.getenv("SESSION_COOKIE_NAME", "nutrishield_session")
    session_hours: int = int(os.getenv("SESSION_HOURS", "168"))
    secure_cookie: bool = os.getenv("COOKIE_SECURE", "0") == "1"
    allowed_origins: tuple[str, ...] = _csv_env(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080,https://nutrishield.web.id",
    )
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY") or os.getenv("ROUTER_API_KEY") or None
    openai_api_base: str = _llm_base_url()
    openai_model: str = os.getenv("OPENAI_MODEL") or os.getenv("DEFAULT_MODEL") or "gpt-5-mini"
    telegram_bot_token: str | None = os.getenv("TELEGRAM_BOT_TOKEN") or None
    telegram_webhook_secret: str | None = os.getenv("TELEGRAM_WEBHOOK_SECRET") or None
    telegram_bot_username: str = os.getenv("TELEGRAM_BOT_USERNAME", "NutriShieldAIBot").lstrip("@")
    frontend_dist: Path = Path(os.getenv("FRONTEND_DIST", str(WEB_DIR / "frontend" / "dist")))
    worker_poll_seconds: float = float(os.getenv("WORKER_POLL_SECONDS", "0.5"))
    agent_worker_mode: str = os.getenv("AGENT_WORKER_MODE", "internal").lower()
    max_request_bytes: int = int(os.getenv("MAX_REQUEST_BYTES", "2097152"))
    policy_version: str = "nutrishield-safety-2026-09-v2"
    source_version: str = "food-normalization-v2"


settings = Settings()
