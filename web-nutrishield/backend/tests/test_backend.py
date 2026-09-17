from __future__ import annotations

import csv
import sqlite3
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from agents.orchestrator import claim_next_job, run_until_idle
from backend.app.db import connect, initialize_database, transaction
from backend.app.main import create_app
from backend.app.pipeline import import_food_data
from backend.app.security import iso_now, new_id
from backend.app.telegram import consume_link_code, handle_update


@pytest.fixture()
def db_path(tmp_path: Path) -> Path:
    path = tmp_path / "test.sqlite3"
    initialize_database(path)
    return path


@pytest.fixture()
def client(db_path: Path):
    with TestClient(create_app(db_path, start_worker=False)) as test_client:
        yield test_client


def register(client: TestClient, email: str = "family@example.test") -> dict:
    response = client.post("/api/auth/register", json={"email": email, "password": "KeluargaAman123", "display_name": "Keluarga Uji", "accept_data_processing": True})
    assert response.status_code == 201, response.text
    return response.json()["user"]


def create_child(client: TestClient) -> dict:
    response = client.post("/api/children", json={"name": "Alya", "birth_date": "2021-05-12", "sex": "female", "allergies": "kacang"})
    assert response.status_code == 201, response.text
    return response.json()


def test_auth_register_login_logout_and_opaque_hash(client: TestClient, db_path: Path):
    user = register(client)
    cookie = client.cookies.get("nutrishield_session")
    assert cookie and len(cookie) >= 32
    assert client.get("/api/auth/me").json()["user"]["id"] == user["id"]
    conn = connect(db_path)
    try:
        session = conn.execute("SELECT token_hash FROM sessions").fetchone()
        assert isinstance(session["token_hash"], bytes)
        assert cookie.encode() not in session["token_hash"]
        stored = conn.execute("SELECT password_hash,password_salt,password_iterations FROM users").fetchone()
        assert stored["password_hash"] != b"KeluargaAman123"
        assert stored["password_iterations"] >= 210_000
    finally:
        conn.close()
    assert client.post("/api/auth/logout").status_code == 200
    assert client.get("/api/auth/me").status_code == 401
    assert client.post("/api/auth/login", json={"email": "family@example.test", "password": "KeluargaAman123"}).status_code == 200


def test_register_requires_explicit_data_consent(client: TestClient):
    response = client.post("/api/auth/register", json={"email": "no-consent@example.test", "password": "KeluargaAman123", "display_name": "Tanpa Persetujuan", "accept_data_processing": False})
    assert response.status_code == 422


def test_cross_origin_mutation_and_oversized_payload_are_blocked(client: TestClient):
    blocked = client.post(
        "/api/auth/register",
        headers={"Origin": "https://evil.example"},
        json={"email": "blocked@example.test", "password": "KeluargaAman123", "display_name": "Blocked", "accept_data_processing": True},
    )
    assert blocked.status_code == 403
    oversized = client.post("/api/auth/login", content=b"x" * 2_097_153, headers={"Content-Type": "application/json"})
    assert oversized.status_code == 413


def test_child_event_job_completes_with_real_steps(client: TestClient, db_path: Path):
    register(client)
    result = create_child(client)
    assert run_until_idle(db_path) == 1
    job = client.get(f"/api/agents/jobs/{result['job_id']}").json()["job"]
    assert job["status"] == "completed"
    assert job["trigger"] == "child.created"
    assert len(job["run"]["steps"]) == 8
    assert all(step["started_at"] and step["completed_at"] for step in job["run"]["steps"])
    assert job["run"]["steps"][0]["tool_name"] == "load_family_context"


def test_worker_recovers_expired_job_lease(client: TestClient, db_path: Path):
    register(client)
    queued = create_child(client)
    with transaction(db_path, immediate=True) as conn:
        conn.execute("UPDATE agent_jobs SET status='running',attempts=1,claimed_at='2000-01-01T00:00:00.000+00:00' WHERE id=?", (queued["job_id"],))
    claimed = claim_next_job(db_path)
    assert claimed and claimed["id"] == queued["job_id"]
    conn = connect(db_path)
    try:
        row = conn.execute("SELECT status,attempts,error FROM agent_jobs WHERE id=?", (queued["job_id"],)).fetchone()
        assert row["status"] == "running"
        assert row["attempts"] == 2
        assert "Recovered" in row["error"]
    finally:
        conn.close()


def test_measurement_event_job(client: TestClient, db_path: Path):
    register(client)
    child = create_child(client)["child"]
    run_until_idle(db_path)
    response = client.post("/api/measurements", json={"child_id": child["id"], "weight_kg": 15.2, "height_cm": 98.4})
    assert response.status_code == 201
    job_id = response.json()["job_id"]
    assert run_until_idle(db_path) == 1
    job = client.get(f"/api/agents/jobs/{job_id}").json()["job"]
    assert job["status"] == "completed"
    assert job["run"]["structured_output"]["action"]["reason"] == "measurement_recorded"


def test_chat_trace_and_safety_block(client: TestClient):
    register(client)
    child = create_child(client)["child"]
    response = client.post("/api/agents/chat", json={"child_id": child["id"], "message": "Berapa dosis ibuprofen untuk anak?", "channel": "web"})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["policy"]["blocked"] is True
    assert body["policy"]["reason"] == "medication_or_dosage_request"
    assert "tidak memberikan dosis" in body["answer"]
    assert len(body["steps"]) == 8
    assert body["steps"][2]["stage"] == "safety_policy"
    assert body["run"]["model"] == "deterministic"
    assert body["steps"][2]["input"]["message"]["redacted"] is True


def test_emergency_message_is_not_replaced_by_output_guard(client: TestClient):
    register(client)
    response = client.post("/api/agents/chat", json={"message": "Anak kejang dan sulit bernapas", "channel": "web"})
    assert response.status_code == 200
    body = response.json()
    assert body["policy"]["reason"] == "emergency_language"
    assert "bantuan segera" in body["answer"]
    assert "fasilitas kesehatan terdekat" in body["answer"]


def test_link_code_single_use_and_telegram_dedup(client: TestClient, db_path: Path):
    user = register(client)
    child = create_child(client)["child"]
    code_response = client.post("/api/telegram/link-code", json={"child_id": child["id"]})
    assert code_response.status_code == 201, code_response.text
    code = code_response.json()["code"]
    with transaction(db_path, immediate=True) as conn:
        ok, _, identity_id = consume_link_code(conn, code, "tg-user-1", "tg-chat-1", "Tester")
        assert ok and identity_id
        identity = conn.execute("SELECT active_child_id FROM channel_identities WHERE id=?", (identity_id,)).fetchone()
        assert identity["active_child_id"] == child["id"]
    with transaction(db_path, immediate=True) as conn:
        ok, message, _ = consume_link_code(conn, code, "tg-user-2", "tg-chat-2", "Other")
        assert not ok and "sudah" in message
    update = {"update_id": 99, "message": {"text": "/start", "chat": {"id": "tg-chat-1"}, "from": {"id": "tg-user-1", "first_name": "Tester"}}}
    assert handle_update(update, db_path)["status"] == "processed"
    assert handle_update(update, db_path)["status"] == "duplicate"
    conn = connect(db_path)
    try:
        assert conn.execute("SELECT count(*) FROM inbound_events WHERE provider_event_id='99'").fetchone()[0] == 1
        inbound_payload = conn.execute("SELECT payload_json FROM inbound_events WHERE provider_event_id='99'").fetchone()[0]
        assert "/start" not in inbound_payload
        outbound = conn.execute("SELECT status FROM outbound_messages ORDER BY created_at DESC LIMIT 1").fetchone()
        assert outbound["status"] == "skipped_unconfigured"
    finally:
        conn.close()


def _write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def test_pipeline_raw_canonical_eligibility_and_issues(tmp_path: Path):
    mixed = tmp_path / "food_records.csv"
    ifct = tmp_path / "ifct.csv"
    off = tmp_path / "off.csv"
    btp = tmp_path / "btp.csv"
    _write_csv(mixed, [
        {"record_id": "trad-1", "dataset": "traditional_food_candidate", "food_name": "Jajanan Uji", "confidence_level": "low", "verification_status": "requires review", "barcode": "", "bpom_number": "", "source_url": "https://example.test/trad", "brand": "", "ingredients_as_label": ""},
        {"record_id": "bpom-1", "dataset": "bpom_registered_food", "food_name": "Produk BPOM Uji", "confidence_level": "high", "verification_status": "official BPOM listing-recorded", "barcode": "", "bpom_number": "MD123", "source_url": "https://example.test/bpom", "brand": "", "ingredients_as_label": ""},
    ])
    _write_csv(ifct, [{"Food Code": "T001", "Food Name": "Tempe Uji", "Group": "Protein", "record_id": "ifct-1", "confidence_level": "high", "verification_status": "official-source-recorded", "source_url": "https://example.test/ifct"}])
    _write_csv(off, [{"record_id": "off-1", "barcode": "12345678", "food_name": "Sereal Uji", "brand": "Uji", "energy_kcal_100g": "123", "proteins_100g": "4.5", "fat_100g": "2", "carbohydrates_100g": "20", "confidence_level": "medium", "verification_status": "community", "source_url": "https://example.test/off"}])
    _write_csv(btp, [{"record_id": "btp-1", "dataset": "btp_regulation", "btp_name_raw": "Bahan Uji", "confidence_level": "high", "verification_status": "official regulation", "source_url": "https://example.test/btp"}])
    inputs = (
        ("mixed-v2", mixed, "mixed", "mixed", None, None),
        ("panganku-ifct", ifct, "ifct", "official-index", None, None),
        ("open-food-facts-id", off, "off", "community-label", None, None),
        ("bpom-btp-11-2019", btp, "btp", "official-regulation", None, None),
    )
    db = tmp_path / "pipeline.sqlite3"
    report_path = tmp_path / "report.json"
    report = import_food_data(db, report_path, inputs=inputs)
    assert report["counts"]["raw_records"] == 5
    assert report["counts"].get("planning_eligible", 0) == 0
    assert report["counts"]["comparison_eligible"] == 1
    assert report["counts"]["quarantined"] == 1
    assert report["issues"]["ambiguous_traditional_candidate"] == 1
    assert report["issues"]["missing_planner_nutrition"] == 1
    conn = connect(db)
    try:
        raw = conn.execute("SELECT payload_json FROM raw_food_records WHERE source_record_id='trad-1'").fetchone()[0]
        assert '"food_name":"Jajanan Uji"' in raw
        nutrient = conn.execute("SELECT amount FROM food_nutrients WHERE nutrient_key='protein'").fetchone()[0]
        assert nutrient == 4.5
        assert not conn.execute("PRAGMA foreign_key_check").fetchall()
    finally:
        conn.close()
