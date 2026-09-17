from __future__ import annotations

import hashlib
import hmac
import json
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, Any

from fastapi import Cookie, Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .agent import BackgroundWorker, queue_job, run_job, run_payload, search_foods
from .config import settings
from .db import connect, initialize_database, transaction
from .models import ChatRequest, ChildCreate, LoginRequest, MeasurementCreate, RegisterRequest
from .security import hash_password, iso_now, new_id, new_link_code, new_session_token, normalize_email, token_digest, verify_password
from .telegram import handle_update, telegram_status

SESSION_MAX_AGE = settings.session_hours * 3600
PUBLIC_TABLES = (
    ("users", "Akun keluarga", False), ("sessions", "Sesi opaque; token mentah tidak disimpan", False),
    ("child_profiles", "Profil anak", False), ("consents", "Persetujuan eksplisit", False),
    ("measurements", "Riwayat pengukuran", False), ("daily_logs", "Catatan harian", False),
    ("food_sources", "Metadata snapshot sumber pangan", True), ("raw_food_records", "Payload sumber yang dipertahankan", True),
    ("canonical_foods", "Entitas pangan ternormalisasi", True), ("food_nutrients", "Nilai nutrien eksplisit saja", True),
    ("normalization_runs", "Eksekusi pipeline", True), ("normalization_issues", "Karantina dan isu kualitas", True),
    ("agent_jobs", "Antrean pemicu", False), ("agent_runs", "Eksekusi agen", False), ("agent_steps", "Jejak tool nyata", False),
    ("inbound_events", "Deduplikasi webhook", False), ("outbound_messages", "Hasil pengiriman", False),
)
AGENT_STAGES = [
    {"order": 1, "name": "Observer", "tool": "load_family_context"},
    {"order": 2, "name": "Data Quality", "tool": "validate_data_quality"},
    {"order": 3, "name": "Safety Policy", "tool": "evaluate_safety_policy"},
    {"order": 4, "name": "Food Retriever", "tool": "search_canonical_foods"},
    {"order": 5, "name": "Planner", "tool": "select_allowed_action"},
    {"order": 6, "name": "Family Explainer", "tool": "explain_result"},
    {"order": 7, "name": "Output Guard", "tool": "validate_output"},
    {"order": 8, "name": "Action Recorder", "tool": "record_action"},
]


def _json_load(value: str | None, default: Any = None) -> Any:
    try:
        return json.loads(value) if value else default
    except json.JSONDecodeError:
        return default


def _user(row: sqlite3.Row | dict) -> dict:
    return {"id": row["id"], "email": row["email"], "display_name": row["display_name"], "created_at": row["created_at"]}


def _cookie(response: Response, token: str) -> None:
    response.set_cookie(settings.session_cookie, token, max_age=SESSION_MAX_AGE, httponly=True, secure=settings.secure_cookie, samesite="strict", path="/")


def _clear_cookie(response: Response) -> None:
    response.delete_cookie(settings.session_cookie, httponly=True, secure=settings.secure_cookie, samesite="strict", path="/")


def _client_hint(request: Request) -> str | None:
    if not request.client:
        return None
    return hashlib.sha256(request.client.host.encode()).hexdigest()[:16]


def create_app(db_path: Path | str | None = None, *, start_worker: bool = True) -> FastAPI:
    actual_db = Path(db_path or settings.db_path)
    initialize_database(actual_db)
    worker = BackgroundWorker(actual_db)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        if start_worker:
            worker.start()
        yield
        worker.stop()

    app = FastAPI(title="NutriShield v2 API", version="2.0.0", docs_url="/api/docs", openapi_url="/api/openapi.json", lifespan=lifespan)
    app.state.db_path = actual_db
    app.state.worker = worker
    app.add_middleware(CORSMiddleware, allow_origins=list(settings.allowed_origins), allow_credentials=True, allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "X-Telegram-Bot-Api-Secret-Token"])

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'"
        response.headers["Cache-Control"] = "no-store" if request.url.path.startswith("/api/auth") else "no-cache"
        return response

    def current_user(request: Request, session_token: Annotated[str | None, Cookie(alias=settings.session_cookie)] = None) -> dict:
        if not session_token:
            raise HTTPException(401, "Autentikasi diperlukan")
        try:
            digest = token_digest(session_token)
        except (ValueError, UnicodeError):
            raise HTTPException(401, "Sesi tidak valid")
        conn = connect(request.app.state.db_path)
        try:
            row = conn.execute("SELECT u.*,s.expires_at,s.revoked_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?", (digest,)).fetchone()
            if not row or row["revoked_at"] or row["expires_at"] <= iso_now() or row["disabled_at"]:
                raise HTTPException(401, "Sesi kedaluwarsa atau tidak valid")
            conn.execute("UPDATE sessions SET last_seen_at=? WHERE token_hash=?", (iso_now(), digest))
            return _user(row)
        finally:
            conn.close()

    @app.get("/api/health")
    def health(request: Request):
        conn = connect(request.app.state.db_path)
        try:
            conn.execute("SELECT 1").fetchone()
            fk = conn.execute("PRAGMA foreign_key_check").fetchall()
            queued = conn.execute("SELECT count(*) FROM agent_jobs WHERE status='queued'").fetchone()[0]
            normalized = conn.execute("SELECT count(*) FROM normalization_runs WHERE status='completed'").fetchone()[0]
            return {"status": "ok" if not fk else "degraded", "database": "ok", "foreign_key_violations": len(fk), "queued_jobs": queued, "food_data_ready": normalized > 0, "worker": "in_process" if start_worker else "external_or_disabled", "version": "2.0.0"}
        finally:
            conn.close()

    @app.post("/api/auth/register", status_code=201)
    def register(payload: RegisterRequest, request: Request, response: Response):
        try:
            email = normalize_email(payload.email)
            salt, digest, iterations = hash_password(payload.password)
        except ValueError as exc:
            raise HTTPException(422, str(exc))
        user_id, now = new_id("usr"), iso_now()
        token, session_hash = new_session_token()
        expires = (datetime.now(timezone.utc) + timedelta(seconds=SESSION_MAX_AGE)).isoformat(timespec="milliseconds")
        try:
            with transaction(request.app.state.db_path, immediate=True) as conn:
                conn.execute("INSERT INTO users(id,email,display_name,password_salt,password_hash,password_iterations,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)", (user_id, email, payload.display_name, salt, digest, iterations, now, now))
                conn.execute("INSERT INTO sessions(token_hash,user_id,created_at,expires_at,last_seen_at,user_agent,ip_hint) VALUES(?,?,?,?,?,?,?)", (session_hash, user_id, now, expires, now, request.headers.get("user-agent", "")[:500], _client_hint(request)))
                conn.execute("INSERT INTO consents(user_id,child_id,consent_type,granted,granted_at,created_at) VALUES(?,NULL,'data_processing',1,?,?)", (user_id, now, now))
                conn.execute("INSERT INTO audit_events(user_id,actor_type,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)", (user_id, "user", "auth.register", "user", user_id, "{}", now))
        except sqlite3.IntegrityError:
            raise HTTPException(409, "Email sudah terdaftar")
        _cookie(response, token)
        return {"user": {"id": user_id, "email": email, "display_name": payload.display_name, "created_at": now}}

    @app.post("/api/auth/login")
    def login(payload: LoginRequest, request: Request, response: Response):
        try:
            email = normalize_email(payload.email)
        except ValueError:
            raise HTTPException(401, "Email atau kata sandi salah")
        with transaction(request.app.state.db_path, immediate=True) as conn:
            row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
            if not row or row["disabled_at"] or not verify_password(payload.password, row["password_salt"], row["password_hash"], row["password_iterations"]):
                raise HTTPException(401, "Email atau kata sandi salah")
            token, digest = new_session_token()
            now = iso_now()
            expires = (datetime.now(timezone.utc) + timedelta(seconds=SESSION_MAX_AGE)).isoformat(timespec="milliseconds")
            conn.execute("DELETE FROM sessions WHERE expires_at<=? OR revoked_at IS NOT NULL", (now,))
            conn.execute("INSERT INTO sessions(token_hash,user_id,created_at,expires_at,last_seen_at,user_agent,ip_hint) VALUES(?,?,?,?,?,?,?)", (digest, row["id"], now, expires, now, request.headers.get("user-agent", "")[:500], _client_hint(request)))
            conn.execute("INSERT INTO audit_events(user_id,actor_type,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)", (row["id"], "user", "auth.login", "user", row["id"], "{}", now))
        _cookie(response, token)
        return {"user": _user(row)}

    @app.post("/api/auth/logout")
    def logout(request: Request, response: Response, session_token: Annotated[str | None, Cookie(alias=settings.session_cookie)] = None):
        if session_token:
            try:
                with transaction(request.app.state.db_path, immediate=True) as conn:
                    conn.execute("UPDATE sessions SET revoked_at=? WHERE token_hash=?", (iso_now(), token_digest(session_token)))
            except (ValueError, UnicodeError):
                pass
        _clear_cookie(response)
        return {"ok": True}

    @app.get("/api/auth/me")
    def me(user: dict = Depends(current_user)):
        return {"user": user}

    @app.get("/api/children")
    def children(request: Request, user: dict = Depends(current_user)):
        conn = connect(request.app.state.db_path)
        try:
            return {"children": [dict(x) for x in conn.execute("SELECT * FROM child_profiles WHERE user_id=? ORDER BY created_at", (user["id"],))]}
        finally:
            conn.close()

    @app.post("/api/children", status_code=201)
    def create_child(payload: ChildCreate, request: Request, user: dict = Depends(current_user)):
        child_id, now = new_id("child"), iso_now()
        with transaction(request.app.state.db_path, immediate=True) as conn:
            conn.execute("INSERT INTO child_profiles(id,user_id,name,birth_date,sex,allergies,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)", (child_id, user["id"], payload.name, payload.birth_date.isoformat() if payload.birth_date else None, payload.sex, payload.allergies, payload.notes, now, now))
            conn.execute("INSERT INTO consents(user_id,child_id,consent_type,granted,granted_at,created_at) VALUES(?,?,'agent_assistance',1,?,?)", (user["id"], child_id, now, now))
            job_id = queue_job(conn, user["id"], child_id, "onboarding_summary", "child.created", {"child_id": child_id})
            row = conn.execute("SELECT * FROM child_profiles WHERE id=?", (child_id,)).fetchone()
        return {"child": dict(row), "job_id": job_id}

    @app.post("/api/measurements", status_code=201)
    def create_measurement(payload: MeasurementCreate, request: Request, user: dict = Depends(current_user)):
        measured = (payload.measured_at or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat(timespec="milliseconds")
        measurement_id, now = new_id("measure"), iso_now()
        with transaction(request.app.state.db_path, immediate=True) as conn:
            child = conn.execute("SELECT id FROM child_profiles WHERE id=? AND user_id=?", (payload.child_id, user["id"])).fetchone()
            if not child:
                raise HTTPException(404, "Profil anak tidak ditemukan")
            conn.execute("INSERT INTO measurements(id,child_id,measured_at,weight_kg,height_cm,head_circumference_cm,source,notes,created_at) VALUES(?,?,?,?,?,?,'manual',?,?)", (measurement_id, payload.child_id, measured, payload.weight_kg, payload.height_cm, payload.head_circumference_cm, payload.notes, now))
            job_id = queue_job(conn, user["id"], payload.child_id, "measurement_followup", "measurement.created", {"measurement_id": measurement_id})
            row = conn.execute("SELECT * FROM measurements WHERE id=?", (measurement_id,)).fetchone()
        return {"measurement": dict(row), "job_id": job_id}

    @app.get("/api/agents/jobs/{job_id}")
    def get_job(job_id: str, request: Request, user: dict = Depends(current_user)):
        conn = connect(request.app.state.db_path)
        try:
            row = conn.execute("SELECT * FROM agent_jobs WHERE id=? AND user_id=?", (job_id, user["id"])).fetchone()
            if not row:
                raise HTTPException(404, "Job tidak ditemukan")
            job = dict(row)
            job["payload"] = _json_load(job.pop("payload_json"), {})
            run = conn.execute("SELECT id FROM agent_runs WHERE job_id=?", (job_id,)).fetchone()
            job["run"] = run_payload(conn, run["id"]) if run else None
            return {"job": job}
        finally:
            conn.close()

    @app.get("/api/agents/runs")
    def runs(request: Request, user: dict = Depends(current_user), limit: int = Query(20, ge=1, le=100)):
        conn = connect(request.app.state.db_path)
        try:
            ids = [x["id"] for x in conn.execute("SELECT id FROM agent_runs WHERE user_id=? ORDER BY started_at DESC LIMIT ?", (user["id"], limit))]
            return {"runs": [run_payload(conn, run_id) for run_id in ids]}
        finally:
            conn.close()

    @app.post("/api/agents/chat")
    def chat(payload: ChatRequest, request: Request, user: dict = Depends(current_user)):
        with transaction(request.app.state.db_path, immediate=True) as conn:
            if payload.child_id and not conn.execute("SELECT 1 FROM child_profiles WHERE id=? AND user_id=?", (payload.child_id, user["id"])).fetchone():
                raise HTTPException(404, "Profil anak tidak ditemukan")
            job_id = queue_job(conn, user["id"], payload.child_id, "question_answer", "question.submitted", payload.model_dump())
            conn.execute("UPDATE agent_jobs SET status='running',claimed_at=?,attempts=attempts+1 WHERE id=?", (iso_now(), job_id))
            job = dict(conn.execute("SELECT * FROM agent_jobs WHERE id=?", (job_id,)).fetchone())
        result = run_job(job, request.app.state.db_path)
        conn = connect(request.app.state.db_path)
        try:
            full = run_payload(conn, result["run_id"])
            return {"answer": result["answer"], "run": {k: v for k, v in full.items() if k != "steps"}, "steps": full["steps"], "policy": result["policy"], "evidence": result["evidence"]}
        finally:
            conn.close()

    @app.get("/api/foods/search")
    def foods(request: Request, user: dict = Depends(current_user), q: str = Query(min_length=1, max_length=120), limit: int = Query(10, ge=1, le=50)):
        conn = connect(request.app.state.db_path)
        try:
            return {"query": q, "eligibility_scope": "discovery", "foods": search_foods(conn, q, limit, eligibility="discovery")}
        finally:
            conn.close()

    @app.post("/api/telegram/link-code", status_code=201)
    def link_code(request: Request, user: dict = Depends(current_user)):
        code, digest = new_link_code()
        now = datetime.now(timezone.utc)
        expires = now + timedelta(minutes=10)
        with transaction(request.app.state.db_path, immediate=True) as conn:
            conn.execute("UPDATE channel_link_codes SET consumed_at=? WHERE user_id=? AND consumed_at IS NULL", (now.isoformat(timespec="milliseconds"), user["id"]))
            conn.execute("INSERT INTO channel_link_codes(id,user_id,code_hash,created_at,expires_at) VALUES(?,?,?,?,?)", (new_id("link"), user["id"], digest, now.isoformat(timespec="milliseconds"), expires.isoformat(timespec="milliseconds")))
        return {"code": code, "expires_at": expires.isoformat(timespec="milliseconds"), "single_use": True}

    @app.get("/api/telegram/status")
    def tg_status(request: Request, user: dict = Depends(current_user)):
        conn = connect(request.app.state.db_path)
        try:
            return telegram_status(conn, user["id"])
        finally:
            conn.close()

    @app.post("/api/telegram/unlink")
    def tg_unlink(request: Request, user: dict = Depends(current_user)):
        now = iso_now()
        with transaction(request.app.state.db_path, immediate=True) as conn:
            changed = conn.execute("UPDATE channel_identities SET unlinked_at=? WHERE user_id=? AND provider='telegram' AND unlinked_at IS NULL", (now, user["id"]))
            conn.execute("UPDATE consents SET granted=0,revoked_at=? WHERE user_id=? AND consent_type='telegram_delivery'", (now, user["id"]))
            conn.execute("INSERT INTO audit_events(user_id,actor_type,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)", (user["id"], "user", "telegram.identity.unlinked", "channel_identity", None, json.dumps({"unlinked": changed.rowcount > 0}), now))
        return {"ok": True, "unlinked": changed.rowcount > 0}

    @app.post("/api/telegram/webhook")
    async def telegram_webhook(request: Request):
        if not settings.telegram_webhook_secret:
            raise HTTPException(503, "Telegram webhook belum dikonfigurasi")
        supplied = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
        if not hmac.compare_digest(supplied, settings.telegram_webhook_secret):
            raise HTTPException(401, "Secret webhook tidak valid")
        try:
            payload = await request.json()
        except Exception:
            raise HTTPException(400, "Payload JSON tidak valid")
        return handle_update(payload, request.app.state.db_path)

    def food_stats_payload(conn: sqlite3.Connection) -> dict:
        get = lambda sql: conn.execute(sql).fetchone()[0]
        issue_rows = conn.execute("SELECT issue_code,count(*) count FROM normalization_issues GROUP BY issue_code ORDER BY count DESC").fetchall()
        source_rows = conn.execute("SELECT source_key,name,source_type,source_url,license,record_count,imported_at FROM food_sources ORDER BY source_key").fetchall()
        latest = conn.execute("SELECT id,status,started_at,completed_at,policy_version FROM normalization_runs ORDER BY started_at DESC LIMIT 1").fetchone()
        return {"raw_records": get("SELECT count(*) FROM raw_food_records"), "canonical_records": get("SELECT count(*) FROM canonical_foods"), "discovery_eligible": get("SELECT count(*) FROM canonical_foods WHERE discovery_eligible=1"), "comparison_eligible": get("SELECT count(*) FROM canonical_foods WHERE comparison_eligible=1"), "planning_eligible": get("SELECT count(*) FROM canonical_foods WHERE planning_eligible=1"), "quarantined": get("SELECT count(*) FROM canonical_foods WHERE quarantined=1"), "nutrient_values": get("SELECT count(*) FROM food_nutrients"), "issues": {r["issue_code"]: r["count"] for r in issue_rows}, "sources": [dict(r) for r in source_rows], "latest_run": dict(latest) if latest else None}

    @app.get("/api/public/food-stats")
    def food_stats(request: Request):
        conn = connect(request.app.state.db_path)
        try:
            return food_stats_payload(conn)
        finally:
            conn.close()

    @app.get("/api/public/architecture")
    def architecture():
        return {"database": {"engine": "SQLite 3", "journal_mode": "WAL", "tables": [{"name": name, "purpose": purpose, "public_data_domain": public} for name, purpose, public in PUBLIC_TABLES], "raw_and_canonical_separated": True, "eligibility_explicit": True}, "agent": {"event_driven": True, "shell_execution": False, "arbitrary_code_execution": False, "stages": AGENT_STAGES, "external_delivery_requires_link_and_consent": True}, "runtime": {"sandbox": True, "scheduler_limit": "Only runs while this sandbox process is active."}, "safety": {"purpose": "family record assistance and limited food information", "not_for": ["diagnosis", "treatment", "medication or supplement doses"]}}

    @app.get("/api/dashboard")
    def dashboard(request: Request, user: dict = Depends(current_user)):
        conn = connect(request.app.state.db_path)
        try:
            children_rows = [dict(x) for x in conn.execute("SELECT * FROM child_profiles WHERE user_id=? ORDER BY created_at", (user["id"],))]
            latest_ids = [x["id"] for x in conn.execute("SELECT id FROM agent_runs WHERE user_id=? ORDER BY started_at DESC LIMIT 10", (user["id"],))]
            jobs = [dict(x) for x in conn.execute("SELECT id,child_id,job_type,trigger,status,created_at FROM agent_jobs WHERE user_id=? AND status IN ('queued','running') ORDER BY created_at", (user["id"],))]
            return {"user": user, "children": children_rows, "latest_runs": [run_payload(conn, x) for x in latest_ids], "pending_jobs": jobs, "food_stats": food_stats_payload(conn), "telegram": telegram_status(conn, user["id"])}
        finally:
            conn.close()

    frontend = settings.frontend_dist
    if frontend.is_dir():
        assets = frontend / "assets"
        if assets.is_dir():
            app.mount("/assets", StaticFiles(directory=assets), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        def spa(full_path: str):
            candidate = (frontend / full_path).resolve()
            if candidate.is_file() and frontend.resolve() in candidate.parents:
                return FileResponse(candidate)
            return FileResponse(frontend / "index.html")
    else:
        @app.get("/", include_in_schema=False)
        def root():
            return JSONResponse({"service": "NutriShield v2 API", "status": "frontend_not_built", "health": "/api/health"})

    return app


app = create_app()
