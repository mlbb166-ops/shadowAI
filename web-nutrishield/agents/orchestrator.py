from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import sqlite3
import threading
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable

from backend.app.config import settings
from backend.app.db import connect, transaction
from backend.app.pipeline import normalize_name
from backend.app.security import iso_now, new_id

POLICY_VERSION = settings.policy_version
SOURCE_VERSION = settings.source_version
ALLOWED_TOOLS = frozenset({"load_family_context", "validate_data_quality", "evaluate_safety_policy", "search_canonical_foods", "select_allowed_action", "explain_result", "validate_output", "record_action"})
EMERGENCY_TERMS = ("sesak", "tidak sadar", "kejang", "bibir biru", "pendarahan hebat", "sulit bernapas")
MEDICATION_TERMS = ("dosis", "obat", "antibiotik", "parasetamol", "ibuprofen", "suplemen")
ALLERGY_TERMS = ("alergi", "gatal", "bengkak", "ruam", "anafilaksis")
LOGGER = logging.getLogger("nutrishield.agents")


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _loads(value: str | None, default: Any = None) -> Any:
    try:
        return json.loads(value) if value else default
    except json.JSONDecodeError:
        return default


SENSITIVE_TRACE_KEYS = frozenset({
    "user_id", "child_id", "email", "display_name", "name", "birth_date",
    "allergies", "notes", "message", "content", "weight_kg", "height_cm",
    "head_circumference_cm", "provider_user_id", "provider_chat_id", "chat_id",
})


def _trace_safe(value: Any, key: str | None = None) -> Any:
    """Keep execution metadata useful without copying family data into agent traces."""
    if key in SENSITIVE_TRACE_KEYS:
        if value in (None, "", [], {}):
            return value
        return {"redacted": True, "present": True}
    if key == "measurements" and isinstance(value, list):
        return {"redacted": True, "count": len(value)}
    if isinstance(value, dict):
        return {k: _trace_safe(v, k) for k, v in value.items()}
    if isinstance(value, list):
        return [_trace_safe(item) for item in value]
    return value


def queue_job(conn: sqlite3.Connection, user_id: str, child_id: str | None, job_type: str, trigger: str, payload: dict[str, Any]) -> str:
    job_id = new_id("job")
    correlation_id = new_id("corr")
    now = iso_now()
    conn.execute(
        "INSERT INTO agent_jobs(id,user_id,child_id,job_type,trigger,correlation_id,payload_json,status,attempts,available_at,created_at) VALUES(?,?,?,?,?,?,?,'queued',0,?,?)",
        (job_id, user_id, child_id, job_type, trigger, correlation_id, _json(payload), now, now),
    )
    conn.execute("INSERT INTO audit_events(user_id,actor_type,event_type,entity_type,entity_id,correlation_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)", (user_id, "system", "agent.job.queued", "agent_job", job_id, correlation_id, _json({"job_type": job_type, "trigger": trigger}), now))
    return job_id


def claim_next_job(db_path: Path | str | None = None) -> dict | None:
    with transaction(db_path, immediate=True) as conn:
        stale_before = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat(timespec="milliseconds")
        conn.execute("UPDATE agent_jobs SET status='queued',claimed_at=NULL,available_at=?,error='Recovered after expired worker lease' WHERE status='running' AND claimed_at<? AND attempts<3", (iso_now(), stale_before))
        conn.execute("UPDATE agent_jobs SET status='failed',completed_at=?,error='Retry limit reached after expired worker lease' WHERE status='running' AND claimed_at<? AND attempts>=3", (iso_now(), stale_before))
        claim_sql = "SELECT * FROM agent_jobs WHERE status='queued' AND available_at<=? ORDER BY created_at LIMIT 1"
        if os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL"):
            claim_sql = "SELECT * FROM agent_jobs WHERE status='queued' AND available_at<=? ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED"
        row = conn.execute(claim_sql, (iso_now(),)).fetchone()
        if not row:
            return None
        updated = conn.execute("UPDATE agent_jobs SET status='running',claimed_at=?,attempts=attempts+1 WHERE id=? AND status='queued'", (iso_now(), row["id"]))
        return dict(row) if updated.rowcount == 1 else None


def _step(conn: sqlite3.Connection, run_id: str, sequence: int, stage: str, tool_name: str, input_data: dict, operation: Callable[[], dict]) -> dict:
    if tool_name not in ALLOWED_TOOLS:
        raise RuntimeError("Tool is not allow-listed")
    started = iso_now()
    cur = conn.execute("INSERT INTO agent_steps(run_id,sequence_no,stage,tool_name,status,input_json,started_at) VALUES(?,?,?,?,?,?,?)", (run_id, sequence, stage, tool_name, "running", _json(_trace_safe(input_data)), started))
    try:
        output = operation()
        conn.execute("UPDATE agent_steps SET status='completed',output_json=?,completed_at=? WHERE id=?", (_json(_trace_safe(output)), iso_now(), cur.lastrowid))
        return output
    except Exception as exc:
        conn.execute("UPDATE agent_steps SET status='failed',error=?,completed_at=? WHERE id=?", (str(exc)[:2000], iso_now(), cur.lastrowid))
        raise


def _age_months(birth_date: str | None) -> int | None:
    if not birth_date:
        return None
    try:
        born = date.fromisoformat(birth_date)
    except ValueError:
        return None
    today = date.today()
    return max(0, (today.year - born.year) * 12 + today.month - born.month - (today.day < born.day))


def _observer(conn: sqlite3.Connection, job: dict) -> dict:
    child = dict(conn.execute("SELECT * FROM child_profiles WHERE id=? AND user_id=?", (job["child_id"], job["user_id"])).fetchone()) if job.get("child_id") else None
    measurements = [dict(x) for x in conn.execute("SELECT * FROM measurements WHERE child_id=? ORDER BY measured_at DESC LIMIT 5", (job["child_id"],))] if child else []
    consents = [dict(x) for x in conn.execute("SELECT consent_type,granted,granted_at,revoked_at FROM consents WHERE user_id=? AND (child_id IS NULL OR child_id=?)", (job["user_id"], job.get("child_id")))]
    return {"child": child, "age_months": _age_months(child.get("birth_date") if child else None), "measurements": measurements, "consents": consents, "payload": _loads(job["payload_json"], {})}


def _quality(context: dict) -> dict:
    issues: list[str] = []
    child = context.get("child")
    if child:
        if not child.get("birth_date"):
            issues.append("missing_birth_date")
        if not child.get("sex") or child.get("sex") == "unspecified":
            issues.append("missing_sex")
    measurements = context.get("measurements", [])
    if measurements:
        latest = measurements[0]
        if latest.get("weight_kg") is not None and not 0.5 <= latest["weight_kg"] <= 200:
            issues.append("implausible_weight")
        if latest.get("height_cm") is not None and not 20 <= latest["height_cm"] <= 230:
            issues.append("implausible_height")
        duplicate = sum(1 for x in measurements if x["measured_at"] == latest["measured_at"] and x["id"] != latest["id"])
        if duplicate:
            issues.append("possible_duplicate_measurement")
    return {"issues": issues, "complete": not issues}


def _safety(context: dict) -> dict:
    message = str(context.get("payload", {}).get("message", "")).casefold()
    emergency = [term for term in EMERGENCY_TERMS if term in message]
    medication = [term for term in MEDICATION_TERMS if term in message]
    allergy = [term for term in ALLERGY_TERMS if term in message]
    child_allergies = [x.strip() for x in re.split(r"[,;]", (context.get("child") or {}).get("allergies", "").casefold()) if x.strip()]
    matched_profile_allergies = [x for x in child_allergies if x in message]
    block = bool(emergency or medication)
    reason = "emergency_language" if emergency else "medication_or_dosage_request" if medication else None
    return {"blocked": block, "reason": reason, "emergency_terms": emergency, "medication_terms": medication, "allergy_terms": allergy, "profile_allergy_matches": matched_profile_allergies, "age_known": context.get("age_months") is not None}


def search_foods(conn: sqlite3.Connection, query: str, limit: int = 10, *, eligibility: str = "discovery") -> list[dict]:
    q = normalize_name(query)
    if not q:
        return []
    tokens = [t for t in q.split() if len(t) >= 2][:6]
    if not tokens:
        return []
    fts_query = " AND ".join(f'"{t}"*' for t in tokens)
    eligibility_columns = {
        "discovery": "discovery_eligible",
        "comparison": "comparison_eligible",
        "planning": "planning_eligible",
    }
    column = eligibility_columns.get(eligibility)
    if not column:
        raise ValueError("Unknown food eligibility scope")
    clause = f"AND c.{column}=1"
    try:
        rows = conn.execute(f"SELECT c.*, bm25(food_search_fts) rank FROM food_search_fts JOIN canonical_foods c ON c.id=food_search_fts.rowid WHERE food_search_fts MATCH ? {clause} ORDER BY rank LIMIT ?", (fts_query, limit)).fetchall()
    except sqlite3.OperationalError:
        rows = conn.execute(f"SELECT c.*, 0 rank FROM canonical_foods c WHERE c.normalized_name LIKE ? {clause} ORDER BY c.provenance_score DESC LIMIT ?", (f"%{q}%", limit)).fetchall()
    return [{k: v for k, v in dict(row).items() if k not in {"canonical_key", "normalized_name"}} for row in rows]


def _retrieve(conn: sqlite3.Connection, context: dict, safety: dict) -> dict:
    message = str(context.get("payload", {}).get("message", ""))
    if not message or safety.get("blocked"):
        return {"query": message, "foods": [], "count": 0}
    foods = search_foods(conn, message, 5, eligibility="comparison")
    if not foods:
        # A narrow fallback extracts the longest meaningful token and still queries canonical records only.
        candidates = sorted((x for x in normalize_name(message).split() if len(x) > 3), key=len, reverse=True)
        if candidates:
            foods = search_foods(conn, candidates[0], 5, eligibility="comparison")
    return {"query": message, "foods": foods, "count": len(foods), "eligibility_scope": "comparison"}


def _plan(job: dict, context: dict, quality: dict, safety: dict, evidence: dict) -> dict:
    if safety["blocked"]:
        return {"action": "blocked", "reason": safety["reason"]}
    if job["job_type"] == "onboarding_summary":
        return {"action": "record_summary", "reason": "profile_created"}
    if job["job_type"] == "measurement_followup":
        return {"action": "record_summary", "reason": "measurement_recorded"}
    return {"action": "answer", "reason": "safe_general_question", "evidence_count": evidence["count"]}


def _fallback_answer(job: dict, context: dict, quality: dict, safety: dict, evidence: dict) -> str:
    name = (context.get("child") or {}).get("name", "anak")
    if safety["reason"] == "emergency_language":
        return "Tanda yang Anda sebutkan dapat memerlukan bantuan segera. Hubungi layanan darurat setempat atau bawa anak ke fasilitas kesehatan terdekat sekarang. NutriShield tidak dapat menilai kegawatdaruratan atau membuat diagnosis."
    if safety["reason"] == "medication_or_dosage_request":
        return "NutriShield tidak memberikan dosis obat atau suplemen. Tanyakan kepada dokter atau apoteker yang mengetahui usia, berat badan, riwayat, dan kondisi anak. Bila ada tanda bahaya, segera cari pertolongan langsung."
    if job["job_type"] == "onboarding_summary":
        missing = ", ".join(quality["issues"]) if quality["issues"] else "tidak ada yang terdeteksi"
        return f"Profil {name} sudah tersimpan. Pemeriksaan kelengkapan awal: {missing}. Catatan ini membantu pencatatan keluarga dan bukan penilaian medis."
    if job["job_type"] == "measurement_followup":
        return f"Pengukuran {name} sudah dicatat. Pantau perubahan secara berkala dengan alat dan waktu pengukuran yang konsisten. NutriShield belum menilai status pertumbuhan atau membuat diagnosis."
    foods = evidence.get("foods", [])
    if foods:
        labels = ", ".join(x["name"] for x in foods[:3])
        return f"Beberapa entri pangan yang cocok di data terkurasi: {labels}. Kelayakan data, alergi, porsi, dan kebutuhan anak tetap perlu diperiksa. Ini adalah informasi umum, bukan diagnosis atau rencana terapi."
    return "Saya belum menemukan bukti pangan yang cukup di data terkurasi untuk pertanyaan itu. Anda dapat mencatat konteks lebih rinci atau berkonsultasi dengan tenaga kesehatan untuk kebutuhan khusus."


def _optional_llm(fallback: str, context: dict, evidence: dict, safety: dict) -> tuple[str, str]:
    if not settings.openai_api_key or safety.get("blocked"):
        return fallback, "deterministic-fallback"
    body = {
        "model": settings.openai_model,
        "messages": [
            {"role": "system", "content": "Tulis ulang hasil deterministik NutriShield dalam bahasa Indonesia sederhana. Pertahankan makna dan seluruh batasan. Jangan menghitung nutrisi, mendiagnosis, memberi dosis, menambah manfaat kesehatan, atau menambah fakta. Keluarkan JSON sesuai schema."},
            {"role": "user", "content": _json({"fallback": fallback, "evidence_names": [x["name"] for x in evidence.get("foods", [])]})},
        ],
    }
    if settings.openai_model.startswith(("gpt-5", "o1", "o3", "o4")):
        body["max_completion_tokens"] = 600
        body["reasoning"] = {"effort": "minimal"}
        body["response_format"] = {
            "type": "json_schema",
            "json_schema": {
                "name": "family_explanation",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {"answer": {"type": "string"}},
                    "required": ["answer"],
                    "additionalProperties": False,
                },
            },
        }
    else:
        body["max_tokens"] = 600
        body["response_format"] = {"type": "json_object"}
    request = urllib.request.Request(settings.openai_api_base + "/chat/completions", data=_json(body).encode(), headers={"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            payload = json.loads(response.read().decode("utf-8"))
        content = payload["choices"][0]["message"]["content"]
        answer = json.loads(content)["answer"].strip()
        return (answer[:4000] if answer else fallback), settings.openai_model
    except (urllib.error.URLError, TimeoutError, KeyError, ValueError, json.JSONDecodeError):
        return fallback, "deterministic-fallback"


def _guard(answer: str, safety: dict) -> dict:
    prohibited_patterns = (
        r"\bdiagnosis(?:nya)?\s+(?:adalah|ialah|yaitu)\b",
        r"\b(?:kami|saya|nutrishield)\s+(?:mendiagnosis|menetapkan diagnosis)\b",
        r"\b(?:mg|ml)\s*(?:per|/)\s*(?:kg|hari)\b",
    )
    violations = [pattern for pattern in prohibited_patterns if re.search(pattern, answer.casefold())]
    if violations:
        return {"valid": False, "violations": violations, "answer": "Jawaban ditahan karena tidak memenuhi kebijakan keselamatan. Silakan konsultasikan kebutuhan khusus kepada tenaga kesehatan."}
    return {"valid": True, "violations": [], "answer": answer}


def run_job(job: dict, db_path: Path | str | None = None) -> dict:
    # Autocommit makes every recorded step durable without holding SQLite's write lock
    # while an optional remote explainer is waiting on network I/O.
    conn = connect(db_path)
    try:
        run_id = new_id("run")
        conn.execute("INSERT INTO agent_runs(id,job_id,user_id,child_id,correlation_id,trigger,status,model,policy_version,source_version,started_at) VALUES(?,?,?,?,?,?,'running',?,?,?,?)", (run_id, job["id"], job["user_id"], job.get("child_id"), job["correlation_id"], job["trigger"], "pending", POLICY_VERSION, SOURCE_VERSION, iso_now()))
        try:
            context = _step(conn, run_id, 1, "observer", "load_family_context", {"user_id": job["user_id"], "child_id": job.get("child_id")}, lambda: _observer(conn, job))
            quality = _step(conn, run_id, 2, "data_quality", "validate_data_quality", {"child_id": job.get("child_id")}, lambda: _quality(context))
            safety = _step(conn, run_id, 3, "safety_policy", "evaluate_safety_policy", {"message": context.get("payload", {}).get("message", "")}, lambda: _safety(context))
            evidence = _step(conn, run_id, 4, "food_retriever", "search_canonical_foods", {"message": context.get("payload", {}).get("message", ""), "eligibility": "comparison"}, lambda: _retrieve(conn, context, safety))
            plan = _step(conn, run_id, 5, "planner", "select_allowed_action", {"job_type": job["job_type"], "safety": safety}, lambda: _plan(job, context, quality, safety, evidence))
            fallback = _fallback_answer(job, context, quality, safety, evidence)
            should_use_llm = job["job_type"] == "question_answer" and not safety.get("blocked")
            explanation = _step(
                conn,
                run_id,
                6,
                "family_explainer",
                "explain_result",
                {"fallback": fallback, "llm_configured": bool(settings.openai_api_key), "llm_allowed_for_job": should_use_llm},
                lambda: dict(zip(("answer", "model"), _optional_llm(fallback, context, evidence, safety) if should_use_llm else (fallback, "deterministic"))),
            )
            guarded = _step(conn, run_id, 7, "output_guard", "validate_output", {"answer": explanation["answer"]}, lambda: _guard(explanation["answer"], safety))
            output = {"answer": guarded["answer"], "policy": {"version": POLICY_VERSION, "blocked": safety["blocked"], "reason": safety["reason"], "quality_issues": quality["issues"]}, "evidence": evidence["foods"], "action": plan, "model": explanation["model"]}
            def record() -> dict:
                action_status = "blocked" if safety["blocked"] else "executed"
                conn.execute("INSERT INTO agent_actions(run_id,action_type,status,payload_json,policy_reason,created_at,executed_at) VALUES(?,?,?,?,?,?,?)", (run_id, plan["action"], action_status, _json(output), plan["reason"], iso_now(), iso_now()))
                conn.execute("INSERT INTO audit_events(user_id,actor_type,event_type,entity_type,entity_id,correlation_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)", (job["user_id"], "agent", "agent.run.completed", "agent_run", run_id, job["correlation_id"], _json({"status": action_status, "model": explanation["model"]}), iso_now()))
                return {"recorded": True, "action_status": action_status}
            _step(conn, run_id, 8, "action_recorder", "record_action", {"action": plan}, record)
            final_status = "blocked" if safety["blocked"] else "completed"
            conn.execute("UPDATE agent_runs SET status=?,model=?,completed_at=?,structured_output_json=? WHERE id=?", (final_status, explanation["model"], iso_now(), _json(output), run_id))
            conn.execute("UPDATE agent_jobs SET status=?,completed_at=? WHERE id=?", (final_status, iso_now(), job["id"]))
            output["run_id"] = run_id
            output["status"] = final_status
            return output
        except Exception as exc:
            conn.execute("UPDATE agent_runs SET status='failed',completed_at=?,error=? WHERE id=?", (iso_now(), str(exc)[:2000], run_id))
            conn.execute("UPDATE agent_jobs SET status='failed',completed_at=?,error=? WHERE id=?", (iso_now(), str(exc)[:2000], job["id"]))
            raise
    finally:
        conn.close()


def process_one_job(db_path: Path | str | None = None) -> dict | None:
    job = claim_next_job(db_path)
    if not job:
        return None
    result = run_job(job, db_path)
    payload = _loads(job.get("payload_json"), {})
    if payload.get("channel") == "telegram" and payload.get("chat_id"):
        from backend.app.telegram import persist_and_send
        with transaction(db_path, immediate=True) as conn:
            persist_and_send(conn, str(payload["chat_id"]), result["answer"], job.get("user_id"), payload.get("channel_identity_id"), result.get("run_id"))
    return result


def run_until_idle(db_path: Path | str | None = None, max_jobs: int = 100) -> int:
    count = 0
    while count < max_jobs and process_one_job(db_path):
        count += 1
    return count


class BackgroundWorker:
    def __init__(self, db_path: Path | str | None = None, poll_seconds: float | None = None):
        self.db_path = Path(db_path or settings.db_path)
        self.poll_seconds = poll_seconds or settings.worker_poll_seconds
        self.stop_event = threading.Event()
        self.thread: threading.Thread | None = None

    def start(self) -> None:
        if self.thread and self.thread.is_alive():
            return
        self.stop_event.clear()
        self.thread = threading.Thread(target=self._loop, name="nutrishield-agent-worker", daemon=True)
        self.thread.start()

    def stop(self) -> None:
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=3)

    def _loop(self) -> None:
        while not self.stop_event.is_set():
            try:
                processed = process_one_job(self.db_path)
            except Exception:
                LOGGER.exception("Agent worker failed while processing a job")
                processed = None
            if processed is None:
                self._schedule_due()
                self.stop_event.wait(self.poll_seconds)

    def _schedule_due(self) -> None:
        with transaction(self.db_path, immediate=True) as conn:
            due = conn.execute("SELECT * FROM schedules WHERE enabled=1 AND next_run_at<=? ORDER BY next_run_at LIMIT 20", (iso_now(),)).fetchall()
            for row in due:
                queue_job(conn, row["user_id"], row["child_id"], "daily_followup", "schedule.daily", {"schedule_id": row["id"]})
                next_at = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(timespec="milliseconds")
                conn.execute("UPDATE schedules SET last_run_at=?,next_run_at=? WHERE id=?", (iso_now(), next_at, row["id"]))


def run_payload(conn: sqlite3.Connection, run_id: str) -> dict | None:
    run = conn.execute("SELECT * FROM agent_runs WHERE id=?", (run_id,)).fetchone()
    if not run:
        return None
    result = dict(run)
    result["structured_output"] = _loads(result.pop("structured_output_json"), None)
    result["steps"] = []
    for row in conn.execute("SELECT * FROM agent_steps WHERE run_id=? ORDER BY sequence_no", (run_id,)):
        item = dict(row)
        item["input"] = _loads(item.pop("input_json"), {})
        item["output"] = _loads(item.pop("output_json"), None)
        result["steps"].append(item)
    return result
