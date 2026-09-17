#!/usr/bin/env python3
from __future__ import annotations

import json
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from http.cookiejar import CookieJar
from pathlib import Path

BASE = "http://127.0.0.1:8080/api"
EMAIL = "e2e-smoke@nutrishield.test"
DB = Path(__file__).resolve().parents[1] / "data" / "nutrishield.sqlite3"

jar = CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def call(path: str, method: str = "GET", body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(
        BASE + path,
        data=data,
        method=method,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    with opener.open(request, timeout=30) as response:
        assert 200 <= response.status < 300, (path, response.status)
        return json.loads(response.read().decode())


def cleanup() -> None:
    if not DB.exists():
        return
    with sqlite3.connect(DB) as conn:
        conn.execute("PRAGMA foreign_keys=ON")
        row = conn.execute("SELECT id FROM users WHERE email=?", (EMAIL,)).fetchone()
        if row:
            conn.execute("DELETE FROM users WHERE id=?", (row[0],))


def main() -> int:
    cleanup()
    try:
        health = call("/health")
        assert health["status"] == "ok"
        registered = call("/auth/register", "POST", {
            "display_name": "Pengguna E2E",
            "email": EMAIL,
            "password": "KeluargaAman123",
            "accept_data_processing": True,
        })
        assert registered["user"]["email"] == EMAIL
        child_result = call("/children", "POST", {
            "name": "Anak Uji",
            "birth_date": "2024-06-12",
            "sex": "female",
            "allergies": "kacang",
            "notes": "",
        })
        child_id = child_result["child"]["id"]
        call("/measurements", "POST", {
            "child_id": child_id,
            "measured_at": "2026-09-16T08:00:00Z",
            "weight_kg": 10.2,
            "height_cm": 82.1,
            "head_circumference_cm": None,
            "notes": "smoke test",
        })
        chat = call("/agents/chat", "POST", {
            "child_id": child_id,
            "message": "Apa data yang masih perlu saya lengkapi?",
            "channel": "web",
        })
        assert len(chat["steps"]) == 8
        assert chat["run"]["status"] in {"completed", "blocked"}
        assert chat["run"]["model"] in {"gpt-5-mini", "deterministic-fallback", "deterministic"}
        emergency = call("/agents/chat", "POST", {
            "child_id": child_id,
            "message": "Anak kejang dan sulit bernapas",
            "channel": "web",
        })
        assert emergency["policy"]["reason"] == "emergency_language"
        assert "bantuan segera" in emergency["answer"]
        search = call("/foods/search?q=tempe&limit=5")
        assert search["eligibility_scope"] == "discovery"
        stats = call("/public/food-stats")
        assert stats["raw_records"] == 7809
        assert stats["planning_eligible"] == 0
        code = call("/telegram/link-code", "POST")
        assert code["single_use"] is True
        dashboard = call("/dashboard")
        assert dashboard["children"]
        print(json.dumps({
            "ok": True,
            "chat_model": chat["run"]["model"],
            "chat_steps": len(chat["steps"]),
            "emergency_blocked": emergency["policy"]["blocked"],
            "raw_food_records": stats["raw_records"],
            "canonical_foods": stats["canonical_records"],
            "planning_eligible": stats["planning_eligible"],
            "telegram_configured": dashboard["telegram"]["configured"],
        }, indent=2))
        return 0
    finally:
        cleanup()


if __name__ == "__main__":
    raise SystemExit(main())
