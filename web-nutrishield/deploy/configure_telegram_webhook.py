from __future__ import annotations

import json
import os
import secrets
import sys
import urllib.request


def main() -> int:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    secret = os.getenv("TELEGRAM_WEBHOOK_SECRET", "")
    base_url = os.getenv("PUBLIC_BASE_URL", "https://nutrishield.web.id").rstrip("/")
    if not token or not secret:
        print("TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET are required", file=sys.stderr)
        return 2
    if len(secret) < 32:
        print("TELEGRAM_WEBHOOK_SECRET must contain at least 32 characters", file=sys.stderr)
        return 2
    payload = json.dumps({
        "url": f"{base_url}/api/telegram/webhook",
        "secret_token": secret,
        "allowed_updates": ["message", "edited_message"],
        "drop_pending_updates": False,
    }).encode()
    request = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/setWebhook",
        data=payload,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        result = json.loads(response.read().decode("utf-8"))
    if not result.get("ok"):
        print("Telegram rejected the webhook configuration", file=sys.stderr)
        return 1
    print("Telegram webhook configured successfully")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
