from __future__ import annotations

import json
import sqlite3
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from .agent import queue_job, run_job
from .config import settings
from .db import transaction
from .security import iso_now, link_code_digest, new_id


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def telegram_status(conn: sqlite3.Connection, user_id: str) -> dict:
    identity = conn.execute("SELECT provider_user_id,provider_chat_id,display_name,linked_at FROM channel_identities WHERE user_id=? AND provider='telegram' AND unlinked_at IS NULL", (user_id,)).fetchone()
    public_identity = {"display_name": identity["display_name"], "linked_at": identity["linked_at"]} if identity else None
    return {"configured": bool(settings.telegram_bot_token and settings.telegram_webhook_secret), "linked": bool(identity), "identity": public_identity, "sandbox_note": "Webhook dan worker hanya aktif selama proses sandbox berjalan."}


def consume_link_code(conn: sqlite3.Connection, code: str, provider_user_id: str, chat_id: str, display_name: str | None) -> tuple[bool, str, int | None]:
    digest = link_code_digest(code)
    now = iso_now()
    row = conn.execute("SELECT * FROM channel_link_codes WHERE code_hash=?", (digest,)).fetchone()
    if not row:
        return False, "Kode taut tidak valid.", None
    conn.execute("UPDATE channel_link_codes SET attempt_count=attempt_count+1 WHERE id=?", (row["id"],))
    if row["consumed_at"]:
        return False, "Kode taut sudah pernah digunakan.", None
    if row["expires_at"] <= now:
        return False, "Kode taut sudah kedaluwarsa.", None
    existing = conn.execute("SELECT id,user_id FROM channel_identities WHERE provider='telegram' AND (provider_user_id=? OR provider_chat_id=?)", (provider_user_id, chat_id)).fetchone()
    if existing and existing["user_id"] != row["user_id"]:
        return False, "Akun Telegram ini sudah tertaut ke pengguna lain.", None
    if existing:
        identity_id = existing["id"]
        conn.execute("UPDATE channel_identities SET unlinked_at=NULL,display_name=?,linked_at=? WHERE id=?", (display_name, now, identity_id))
    else:
        cur = conn.execute("INSERT INTO channel_identities(user_id,provider,provider_user_id,provider_chat_id,display_name,linked_at) VALUES(?,'telegram',?,?,?,?)", (row["user_id"], provider_user_id, chat_id, display_name, now))
        identity_id = cur.lastrowid
    changed = conn.execute("UPDATE channel_link_codes SET consumed_at=?,consumed_by_identity_id=? WHERE id=? AND consumed_at IS NULL AND expires_at>?", (now, identity_id, row["id"], now))
    if changed.rowcount != 1:
        return False, "Kode taut tidak dapat digunakan.", None
    conn.execute("INSERT OR REPLACE INTO consents(user_id,child_id,consent_type,granted,granted_at,revoked_at,created_at) VALUES(?,NULL,'telegram_delivery',1,?,NULL,?)", (row["user_id"], now, now))
    conn.execute("INSERT INTO audit_events(user_id,actor_type,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)", (row["user_id"], "telegram", "telegram.identity.linked", "channel_identity", str(identity_id), "{}", now))
    return True, "Telegram berhasil ditautkan ke akun NutriShield.", identity_id


def persist_and_send(conn: sqlite3.Connection, chat_id: str, body: str, user_id: str | None = None, identity_id: int | None = None, run_id: str | None = None) -> dict:
    message_id = new_id("out")
    configured = bool(settings.telegram_bot_token)
    status = "queued" if configured else "skipped_unconfigured"
    conn.execute("INSERT INTO outbound_messages(id,provider,user_id,channel_identity_id,run_id,chat_id,body,status,created_at) VALUES(?,'telegram',?,?,?,?,?,?,?)", (message_id, user_id, identity_id, run_id, chat_id, body[:4096], status, iso_now()))
    if not configured:
        return {"id": message_id, "status": status}
    payload = _json({"chat_id": chat_id, "text": body[:4096]}).encode()
    request = urllib.request.Request(f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage", data=payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
        provider_id = str(result.get("result", {}).get("message_id", "")) or None
        conn.execute("UPDATE outbound_messages SET status='sent',provider_message_id=?,response_json=?,sent_at=? WHERE id=?", (provider_id, _json(result), iso_now(), message_id))
        return {"id": message_id, "status": "sent", "provider_message_id": provider_id}
    except Exception as exc:
        conn.execute("UPDATE outbound_messages SET status='failed',error=? WHERE id=?", (str(exc)[:1000], message_id))
        return {"id": message_id, "status": "failed"}


def handle_update(update: dict, db_path: Path | str | None = None) -> dict:
    event_id = str(update.get("update_id", ""))
    if not event_id:
        return {"status": "ignored", "reason": "missing_update_id"}
    with transaction(db_path, immediate=True) as conn:
        message_for_audit = update.get("message") or update.get("edited_message") or {}
        audit_payload = {
            "update_id": update.get("update_id"),
            "message": {
                "message_id": message_for_audit.get("message_id"),
                "date": message_for_audit.get("date"),
                "has_text": bool(message_for_audit.get("text")),
                "chat_type": (message_for_audit.get("chat") or {}).get("type"),
            },
        }
        try:
            event_cur = conn.execute("INSERT INTO inbound_events(provider,provider_event_id,payload_json,received_at,status) VALUES('telegram',?,?,?,'received')", (event_id, _json(audit_payload), iso_now()))
        except sqlite3.IntegrityError:
            return {"status": "duplicate"}
        message = update.get("message") or update.get("edited_message") or {}
        text = str(message.get("text") or "").strip()
        chat_id = str((message.get("chat") or {}).get("id") or "")
        from_user = message.get("from") or {}
        provider_user_id = str(from_user.get("id") or "")
        display_name = " ".join(filter(None, [from_user.get("first_name"), from_user.get("last_name")]))[:120] or from_user.get("username")
        if not text or not chat_id or not provider_user_id:
            conn.execute("UPDATE inbound_events SET status='ignored',processed_at=? WHERE id=?", (iso_now(), event_cur.lastrowid))
            return {"status": "ignored", "reason": "unsupported_update"}

        identity = conn.execute("SELECT * FROM channel_identities WHERE provider='telegram' AND provider_user_id=? AND unlinked_at IS NULL", (provider_user_id,)).fetchone()
        if text.startswith("/start"):
            response = "NutriShield membantu pencatatan keluarga dan informasi pangan terbatas. Bukan alat diagnosis atau pemberi dosis obat. Tautkan akun dengan /link KODE dari dashboard."
            delivery = persist_and_send(conn, chat_id, response, identity["user_id"] if identity else None, identity["id"] if identity else None)
        elif text.startswith("/link "):
            ok, response, identity_id = consume_link_code(conn, text.split(maxsplit=1)[1], provider_user_id, chat_id, display_name)
            identity = conn.execute("SELECT * FROM channel_identities WHERE id=?", (identity_id,)).fetchone() if identity_id else None
            delivery = persist_and_send(conn, chat_id, response, identity["user_id"] if identity else None, identity_id)
        elif not identity:
            response = "Akun Telegram belum tertaut. Masuk ke dashboard NutriShield, buat kode taut, lalu kirim /link KODE."
            delivery = persist_and_send(conn, chat_id, response)
        else:
            child = conn.execute("SELECT id FROM child_profiles WHERE user_id=? ORDER BY created_at LIMIT 1", (identity["user_id"],)).fetchone()
            child_id = child["id"] if child else None
            job_id = queue_job(conn, identity["user_id"], child_id, "question_answer", "telegram.message", {"message": text, "channel": "telegram"})
            job = dict(conn.execute("SELECT * FROM agent_jobs WHERE id=?", (job_id,)).fetchone())
            conn.execute("UPDATE agent_jobs SET status='running',claimed_at=?,attempts=attempts+1 WHERE id=?", (iso_now(), job_id))
            # Commit current inbound transaction before running the independently audited pipeline.
            conn.commit()
            result = run_job(job, db_path)
            conn.execute("BEGIN IMMEDIATE")
            response = result["answer"]
            delivery = persist_and_send(conn, chat_id, response, identity["user_id"], identity["id"], result["run_id"])
        conn.execute("UPDATE inbound_events SET status='processed',processed_at=? WHERE id=?", (iso_now(), event_cur.lastrowid))
        return {"status": "processed", "delivery": delivery}
