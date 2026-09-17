"""
NutriShield Complete Relational Database Schema & Seeder
Expanded to 13 core tables to support multi-persona operations, 6 AI agents, care tasks, and audit logs.
"""

import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "nutrishield.db"

def init_complete_database():
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    cursor = conn.cursor()

    print("Creating expanded relational schema in SQLite WAL mode...")

    # 1. ROLES
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        permissions_json TEXT DEFAULT '[]'
    );
    """)

    # 2. USERS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        role_id TEXT NOT NULL,
        phone_number TEXT,
        email TEXT,
        organization TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
    );
    """)

    # 3. COHORTS (Posyandu / Wilayah)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cohorts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        rt_rw TEXT,
        village TEXT,
        subdistrict TEXT,
        city TEXT,
        supervisor_name TEXT,
        contact_phone TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 4. CHILDREN (Profil Balita)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS children (
        id TEXT PRIMARY KEY,
        cohort_id TEXT,
        nik TEXT UNIQUE,
        name TEXT NOT NULL,
        gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
        birth_date TEXT NOT NULL,
        parent_name TEXT NOT NULL,
        parent_phone TEXT,
        address TEXT,
        allergens_csv TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cohort_id) REFERENCES cohorts(id)
    );
    """)

    # 5. MEASUREMENTS (Rekam Penimbangan)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS measurements (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL,
        measured_by_user_id TEXT,
        measure_date TEXT NOT NULL,
        age_months INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        height_cm REAL NOT NULL,
        head_circ_cm REAL,
        input_source TEXT DEFAULT 'web_kader',
        data_quality_flags TEXT DEFAULT '[]',
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id)
    );
    """)

    # 6. GROWTH ASSESSMENTS (Evaluasi Deterministik & Sentinel)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS growth_assessments (
        id TEXT PRIMARY KEY,
        measurement_id TEXT NOT NULL UNIQUE,
        child_id TEXT NOT NULL,
        waz_zscore REAL,
        haz_zscore REAL,
        whz_zscore REAL,
        growth_status TEXT NOT NULL,
        haz_status TEXT,
        waz_status TEXT,
        whz_status TEXT,
        is_2t_alert INTEGER DEFAULT 0,
        risk_level TEXT NOT NULL CHECK(risk_level IN ('STABLE', 'MONITOR', 'NEEDS_HUMAN_REVIEW')),
        stomach_capacity_ml INTEGER,
        protein_needed_g REAL,
        iron_needed_mg REAL,
        clinical_evidence_json TEXT,
        human_explanation_mother TEXT,
        assessed_by_agent TEXT DEFAULT 'Growth Sentinel',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (measurement_id) REFERENCES measurements(id),
        FOREIGN KEY (child_id) REFERENCES children(id)
    );
    """)

    # 7. CARE TASKS (Tindak Lanjut Nyata & Follow-up Coordinator)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS care_tasks (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL,
        assessment_id TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL CHECK(priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
        assigned_to TEXT NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('OPEN', 'IN_PROGRESS', 'DONE', 'ESCALATED')),
        resolution_notes TEXT,
        resolved_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id),
        FOREIGN KEY (assessment_id) REFERENCES growth_assessments(id)
    );
    """)

    # 8. AGENT RUNS (Activity Center & Audit AI Transparan)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agent_runs (
        id TEXT PRIMARY KEY,
        correlation_id TEXT,
        agent_name TEXT NOT NULL,
        trigger_event TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'NEEDS_REVIEW', 'FAILED')),
        execution_summary TEXT NOT NULL,
        evidence_text TEXT,
        input_payload_json TEXT,
        output_payload_json TEXT,
        model_used TEXT DEFAULT 'Deterministic Engine / ag/gemini-3.8-flash-high',
        latency_ms INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 9. FOOD CATALOG (Katalog Pangan Terverifikasi TKPI)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS food_catalog (
        id TEXT PRIMARY KEY,
        name_id TEXT NOT NULL,
        common_name TEXT NOT NULL,
        category TEXT NOT NULL,
        energy_kcal REAL NOT NULL,
        protein_g REAL NOT NULL,
        fat_g REAL NOT NULL,
        carbs_g REAL NOT NULL,
        calcium_mg REAL DEFAULT 0,
        iron_mg REAL DEFAULT 0,
        zinc_mg REAL DEFAULT 0,
        omega3_g REAL DEFAULT 0,
        avg_cost_per_100g REAL DEFAULT 0,
        allergen_tags_csv TEXT DEFAULT '',
        serving_suggestion TEXT,
        is_verified INTEGER DEFAULT 1,
        barcode TEXT,
        brand TEXT,
        bpom_number TEXT,
        ingredients_text TEXT,
        source_ref TEXT DEFAULT 'TKPI Kemenkes'
    );
    """)

    # 9B. FOOD BTP REGULATIONS (Regulasi Bahan Tambahan Pangan BPOM No. 11/2019)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS food_btp_regulations (
        id TEXT PRIMARY KEY,
        ins_number TEXT NOT NULL,
        btp_name TEXT NOT NULL,
        functional_category TEXT NOT NULL,
        bpom_regulation TEXT DEFAULT 'Peraturan BPOM Nomor 11 Tahun 2019',
        safety_notes_for_children TEXT,
        source_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_btp_ins ON food_btp_regulations(ins_number);
    CREATE INDEX IF NOT EXISTS idx_btp_cat ON food_btp_regulations(functional_category);
    """)

    # 10. NUTRITION PLANS (Rekomendasi Menu Pangan Lokal)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS nutrition_plans (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL,
        assessment_id TEXT,
        title TEXT NOT NULL,
        target_calories REAL,
        target_protein_g REAL,
        daily_menus_json TEXT NOT NULL,
        ingredients_budget_est INTEGER,
        allergen_free_tags TEXT DEFAULT '',
        generated_by_agent TEXT DEFAULT 'Nutrition Planner',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id),
        FOREIGN KEY (assessment_id) REFERENCES growth_assessments(id)
    );
    """)

    # 11. NOTIFICATIONS (Pengingat & Notifikasi Multi-Kanal)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        recipient_name TEXT NOT NULL,
        channel TEXT NOT NULL CHECK(channel IN ('in_app', 'telegram', 'discord')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        deep_link TEXT,
        status TEXT NOT NULL CHECK(status IN ('SENT', 'FAILED', 'READ')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 12. INTEGRATION ACCOUNTS (Pairing Telegram / Discord)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS integration_accounts (
        id TEXT PRIMARY KEY,
        child_id TEXT,
        platform TEXT NOT NULL CHECK(platform IN ('telegram', 'discord')),
        account_identifier TEXT,
        auth_token TEXT NOT NULL,
        is_verified INTEGER DEFAULT 0,
        linked_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id)
    );
    """)

    # 13. AUDIT EVENTS (Audit Trail Integritas Data Medis)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        actor_name TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    print("All 13 core tables created successfully!")

    # -------------------------------------------------------------------------
    # SEEDING INITIAL DATA
    # -------------------------------------------------------------------------
    # Roles
    roles = [
        ('role-kader', 'kader', 'Kader Posyandu — Pengukuran & Kunjungan Rumah', '["read", "write_measurement", "manage_tasks"]'),
        ('role-mother', 'mother', 'Ibu & Keluarga — Pemantauan Anak & Menu Gizi', '["read_own", "create_growth_check"]'),
        ('role-supervisor', 'supervisor', 'Supervisor & Tenaga Kesehatan Puskesmas', '["read_all", "audit", "escalate"]')
    ]
    cursor.executemany("INSERT OR IGNORE INTO roles (id, name, description, permissions_json) VALUES (?,?,?,?)", roles)

    # Cohort
    cursor.execute("""
    INSERT OR IGNORE INTO cohorts (id, name, rt_rw, village, subdistrict, city, supervisor_name, contact_phone)
    VALUES ('cohort-mawar-3', 'Posyandu Mawar III', 'RW 04', 'Kelurahan Beji', 'Kecamatan Beji', 'Kota Depok', 'dr. Budi Santoso, Sp.A', '081234567890')
    """)

    # Users
    users = [
        ('user-rahmawati', 'kader_rahma', 'Ibu Rahmawati, S.K.M.', 'role-kader', '081298765432', 'rahma@posyandu-beji.id', 'Posyandu Mawar III, Depok'),
        ('user-sarah', 'ibu_sarah', 'Ibu Sarah Kamila', 'role-mother', '081387654321', 'sarah@keluarga.id', 'Warga Beji RW 04'),
        ('user-dr-budi', 'dr_budi', 'dr. Budi Santoso, Sp.A', 'role-supervisor', '081122334455', 'budi.santoso@puskesmas-depok.go.id', 'Puskesmas Kecamatan Beji')
    ]
    cursor.executemany("INSERT OR IGNORE INTO users (id, username, full_name, role_id, phone_number, email, organization) VALUES (?,?,?,?,?,?,?)", users)

    # Sync children from legacy posyandu_children if exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='posyandu_children';")
    if cursor.fetchone():
        cursor.execute("SELECT * FROM posyandu_children")
        old_children = cursor.fetchall()
        for oc in old_children:
            cursor.execute("""
            INSERT OR IGNORE INTO children (id, cohort_id, nik, name, gender, birth_date, parent_name, parent_phone, address, allergens_csv)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                oc[0], 'cohort-mawar-3', oc[1], oc[2], oc[3], oc[4], oc[5],
                '0813' + oc[1][-8:], oc[7], oc[8] or ''
            ))
        print(f"Migrated {len(old_children)} children to new children table.")

    # Populate food catalog from tkpi_foods
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='tkpi_foods';")
    if cursor.fetchone():
        cursor.execute("SELECT * FROM tkpi_foods")
        old_foods = cursor.fetchall()
        for f in old_foods:
            cursor.execute("""
            INSERT OR IGNORE INTO food_catalog (
                id, name_id, common_name, category, energy_kcal, protein_g, fat_g, carbs_g,
                calcium_mg, iron_mg, zinc_mg, omega3_g, avg_cost_per_100g, allergen_tags_csv,
                serving_suggestion, is_verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7],
                f[8], f[9], f[10], f[13], f[14], f[15] or '',
                f"Sangat baik diolah kukus/tim atau kuah bening untuk MPASI anak usia di atas 6 bulan."
            ))
        print(f"Populated {len(old_foods)} foods into food_catalog.")

    # Populate measurements & growth_assessments
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='child_measurements';")
    if cursor.fetchone():
        cursor.execute("""
        SELECT cm.*, c.id as child_id FROM child_measurements cm
        JOIN children c ON cm.child_alias = c.name
        ORDER BY cm.measure_date ASC
        """)
        old_meas = cursor.fetchall()
        for m in old_meas:
            m_id = m[0]
            child_id = m[-1]
            cursor.execute("""
            INSERT OR IGNORE INTO measurements (
                id, child_id, measured_by_user_id, measure_date, age_months, weight_kg, height_cm, head_circ_cm, input_source, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                m_id, child_id, 'user-rahmawati', m[4], m[5], float(m[6]), float(m[7]), float(m[8]) if m[8] else None, 'web_kader', 'Penimbangan berkala Posyandu'
            ))

            haz = float(m[10] or 0)
            waz = float(m[9] or 0)
            whz = float(m[11] or 0)
            is_2t = bool(m[14])

            # Determine risk
            if haz < -2.0 and is_2t:
                risk = 'NEEDS_HUMAN_REVIEW'
                status = 'Stunting + Alert 2T'
                human_text = "Pertumbuhan tinggi badan ananda berada di bawah acuan baku dan kenaikan berat badan melambat. Perlu evaluasi bersama Bidan/Dokter Puskesmas."
            elif haz < -2.0:
                risk = 'MONITOR'
                status = 'Stunting Terkonfirmasi'
                human_text = "Tinggi badan ananda perlu kejar tumbuh dengan peningkatan asupan protein hewani padat energi seperti ikan kembung dan telur."
            elif is_2t:
                risk = 'MONITOR'
                status = 'Alert 2T (Perlambatan Tumbuh)'
                human_text = "Kenaikan berat badan ananda bulan ini belum optimal. Mohon evaluasi porsi makan dan pastikan tidak terganggu batuk/pilek."
            else:
                risk = 'STABLE'
                status = 'Pertumbuhan Optimal'
                human_text = "Alhamdulillah pertumbuhan ananda berkembang sehat sesuai grafik baku. Lanjutkan pola makan bergizi seimbang!"

            evidence = {
                "standard": "Permenkes RI No. 2/2020 & WHO Anthro 2006",
                "haz_interpretation": "Pendek (Stunted)" if haz < -2.0 else "Normal",
                "waz_interpretation": "Kurang" if waz < -2.0 else "Normal",
                "trajectory_2t": "Terdeteksi penurunan/perlambatan" if is_2t else "Kenaikan normal"
            }

            cursor.execute("""
            INSERT OR IGNORE INTO growth_assessments (
                id, measurement_id, child_id, waz_zscore, haz_zscore, whz_zscore,
                growth_status, haz_status, waz_status, whz_status, is_2t_alert,
                risk_level, stomach_capacity_ml, protein_needed_g, iron_needed_mg,
                clinical_evidence_json, human_explanation_mother, assessed_by_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f"ga-{m_id}", m_id, child_id, waz, haz, whz,
                status, "Pendek" if haz < -2.0 else "Normal", "Kurang" if waz < -2.0 else "Normal", "Gizi Baik",
                1 if is_2t else 0, risk,
                min(250, max(120, round(float(m[6]) * 25))),
                round(float(m[6]) * 1.3, 1),
                7 if m[5] >= 12 else 11,
                json.dumps(evidence), human_text, 'Growth Sentinel'
            ))

    # Seed Care Tasks (Tindak Lanjut Nyata)
    tasks = [
        ('task-001', 'child-06', 'ga-m-06-latest', 'Kunjungan Rumah & Edukasi Pangan (Bilqis Humaira)', 'Kunjungi keluarga Bilqis untuk evaluasi kenaikan berat badan yang tidak optimal (2T Alert). Ajarkan pembuatan MPASI padat energi dari ikan kembung cincang dan telur.', 'CRITICAL', 'Ibu Rahmawati (Kader)', (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d'), 'OPEN', None, None),
        ('task-002', 'child-02', 'ga-m-02-latest', 'Konsultasi Puskesmas & Cek Alergen (Siti Aisyah)', 'Rujuk Siti Aisyah ke Poli Gizi Puskesmas Beji untuk konfirmasi status kurva pertumbuhan TB/U -2.52 SD serta telaah alergen susu sapi.', 'HIGH', 'Ibu Rahmawati (Kader)', (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d'), 'IN_PROGRESS', 'Sudah menghubungi Ibu Sarah, janji temu hari Kamis.', None),
        ('task-003', 'child-04', 'ga-m-04-latest', 'Pemantauan Menu Bebas Telur (Kinara Putri)', 'Pastikan penggantian sumber protein hewani dengan hati ayam cincang dan kaldu ceker tanpa menggunakan telur ayam ras.', 'MEDIUM', 'Ibu Rahmawati (Kader)', (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d'), 'OPEN', None, None),
        ('task-004', 'child-01', 'ga-m-01-latest', 'Evaluasi Timbang Ulang 30 Hari (Muhammad Bintang)', 'Konfirmasi jadwal penimbangan rutin bulan depan di Posyandu Mawar III untuk menjaga tren pertumbuhan optimal.', 'LOW', 'Ibu Rahmawati (Kader)', (datetime.now() + timedelta(days=20)).strftime('%Y-%m-%d'), 'DONE', 'Orang tua berkomitmen hadir di Posyandu setiap tanggal 15.', datetime.now().strftime('%Y-%m-%d %H:%M'))
    ]
    cursor.executemany("""
    INSERT OR IGNORE INTO care_tasks (id, child_id, assessment_id, title, description, priority, assigned_to, due_date, status, resolution_notes, resolved_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
    """, tasks)

    # Seed Agent Runs (Audit Activity Center)
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    agent_runs = [
        ('run-001', 'corr-101', 'Growth Sentinel', 'EVENT_MEASUREMENT_RECORDED', 'COMPLETED', 'Menilai pertumbuhan Kenzo Al-Fatih: HAZ +0.10 SD, WAZ -0.02 SD. Status stabil, tidak ada alert 2T.', 'Box-Cox LMS WHO Anthro 2006: L=0.38, M=76.1, S=0.041', '{"child": "Kenzo", "weight": 9.6, "height": 76.0}', '{"risk_level": "STABLE", "next_action": "Routine posyandu check"}', 'Deterministic WHO Engine', 18, now_str),
        ('run-002', 'corr-102', 'Growth Sentinel', 'EVENT_MEASUREMENT_RECORDED', 'NEEDS_REVIEW', 'Mendeteksi indikator 2T (delta berat -0.1 kg) dan status stunting pada Bilqis Humaira Khansa.', 'Permenkes No. 2/2020 Pasal 5: Growth Faltering terkonfirmasi 2 bulan berturut-turut.', '{"child": "Bilqis", "weight": 7.4, "height": 71.0}', '{"risk_level": "NEEDS_HUMAN_REVIEW", "flag": "2T_ALERT"}', 'Deterministic WHO Engine', 22, now_str),
        ('run-003', 'corr-102', 'Follow-up Coordinator', 'GROWTH_ASSESSMENT_FLAGGED', 'COMPLETED', 'Otomatis membuat Care Task prioritas CRITICAL untuk Bilqis Humaira Khansa: Kunjungan rumah dalam 48 jam.', 'Aturan SOP Posyandu: Kasus 2T wajib kunjungan rumah maksimal H+3.', '{"assessment_id": "ga-m-002"}', '{"task_id": "task-001", "assigned_to": "Kader Rahmawati"}', 'Autonomous Coordinator', 45, now_str),
        ('run-004', 'corr-103', 'Nutrition Planner', 'DIETARY_INTERVENTION_REQUEST', 'COMPLETED', 'Merumuskan 3 opsi menu harian kaya protein hewani lokal (Ikan Kembung & Hati Ayam) sesuai batas anggaran Rp15.000/hari.', 'Tabel Komposisi Pangan Indonesia (TKPI 2020): Ikan Kembung mengandung 21.4g protein / 100g dengan bioavailabilitas zat besi tinggi.', '{"target_protein_g": 12.5, "budget_max": 20000}', '{"menu_count": 3, "estimated_cost": 14500}', 'ag/gemini-3.8-flash-high (9Router)', 680, now_str),
        ('run-005', 'corr-104', 'Data Quality Agent', 'PRE_MEASUREMENT_VALIDATION', 'COMPLETED', 'Memeriksa input kader: Berat 8.5 kg, Tinggi 73 cm pada usia 12 bulan. Data berada dalam rentang biologis valid (Z-Score -1.5 SD s/d +1.5 SD).', 'Threshold Guardrail WHO: Rentang biologis 0-60 bln, rasio BB/TB realistis.', '{"weight": 8.5, "height": 73.0, "age": 12}', '{"valid": true, "anomaly_detected": false}', 'Deterministic Guardrail', 8, now_str)
    ]
    cursor.executemany("""
    INSERT OR IGNORE INTO agent_runs (id, correlation_id, agent_name, trigger_event, status, execution_summary, evidence_text, input_payload_json, output_payload_json, model_used, latency_ms, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """, agent_runs)

    # Seed Integration Accounts (Pairing Code demo for Telegram)
    integrations = [
        ('int-001', 'child-01', 'telegram', '@sarah_kamila', 'NUTRI-7821', 1, now_str, now_str),
        ('int-002', 'child-06', 'telegram', None, 'NUTRI-4912', 0, None, now_str)
    ]
    cursor.executemany("""
    INSERT OR IGNORE INTO integration_accounts (id, child_id, platform, account_identifier, auth_token, is_verified, linked_at, created_at)
    VALUES (?,?,?,?,?,?,?,?)
    """, integrations)

    conn.commit()
    conn.close()
    print("Complete schema and seed data initialized successfully in nutrishield.db!")

if __name__ == '__main__':
    init_complete_database()
