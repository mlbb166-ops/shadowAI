"""
Data Quality Agent
Guardrail and anomaly detection for anthropometric measurements before clinical processing.
Detects unit swap errors, biologically implausible outliers, and duplicate records.
"""

import json
import sqlite3
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

class DataQualityAgent:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def validate_measurement(
        self,
        child_id: str,
        measure_date: str,
        age_months: float,
        weight_kg: float,
        height_cm: float,
        head_circ_cm: Optional[float] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        issues: List[str] = []
        warnings: List[str] = []
        is_valid = True

        # 1. Unit Swap & Plausibility Checks
        # E.g. If height was entered as 0.75 (meters instead of cm)
        if 0.4 <= height_cm <= 1.5:
            issues.append(f"Tinggi badan {height_cm} kemungkinan dalam satuan meter. Harap masukkan dalam centimeter (contoh: {height_cm * 100:.1f} cm).")
            is_valid = False

        # E.g. Weight and Height swapped (Weight 75kg, Height 8.5cm)
        if weight_kg > 40.0 and height_cm < 40.0:
            issues.append("Kemungkinan nilai Berat Badan dan Tinggi Badan tertukar. Harap periksa kembali angka timbangan.")
            is_valid = False

        # Biological ranges for 0-60 months
        if age_months < 0 or age_months > 60:
            issues.append(f"Usia balita {age_months} bulan di luar rentang sasaran 0-60 bulan (1.000 HPK & Balita).")
            is_valid = False

        if weight_kg < 1.5 or weight_kg > 38.0:
            issues.append(f"Berat badan {weight_kg} kg di luar batas biologis realistis balita (1.5 kg - 38 kg).")
            is_valid = False

        if height_cm < 35.0 or height_cm > 135.0:
            issues.append(f"Tinggi badan {height_cm} cm di luar batas biologis realistis balita (35 cm - 135 cm).")
            is_valid = False

        if head_circ_cm is not None:
            if head_circ_cm < 25.0 or head_circ_cm > 60.0:
                warnings.append(f"Lingkar kepala {head_circ_cm} cm memerlukan verifikasi ulang alat ukur.")

        # 2. Database History Checks (Velocity & Duplicate Check)
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Check duplicate on same date
        cursor.execute("""
            SELECT id, measure_date, weight_kg, height_cm
            FROM measurements
            WHERE child_id = ? AND measure_date = ?
        """, (child_id, measure_date))
        dup = cursor.fetchone()
        if dup:
            warnings.append(f"Sudah terdapat penimbangan ananda pada tanggal {measure_date} ({dup['weight_kg']} kg, {dup['height_cm']} cm). Data baru akan memperbarui riwayat ini.")

        # Check sudden velocity jump compared to latest previous measurement
        cursor.execute("""
            SELECT weight_kg, height_cm, measure_date, age_months
            FROM measurements
            WHERE child_id = ? AND measure_date < ?
            ORDER BY measure_date DESC LIMIT 1
        """, (child_id, measure_date))
        prev = cursor.fetchone()
        if prev:
            prev_w = float(prev["weight_kg"])
            prev_h = float(prev["height_cm"])
            w_diff = weight_kg - prev_w
            h_diff = height_cm - prev_h

            if abs(w_diff) > 4.0:
                warnings.append(f"Perubahan berat badan drastis ({w_diff:+.1f} kg). Harap pastikan anak tidak memakai pakaian tebal atau terjadi salah ketik.")
            if h_diff < -1.5:
                warnings.append(f"Tinggi badan tercatat lebih pendek {abs(h_diff):.1f} cm dari bulan lalu. Periksa posisi anak saat pengukuran (berbaring vs berdiri).")

        # 3. Log agent run
        latency_ms = int((time.time() - start_time) * 1000)
        run_id = f"run-dq-{int(time.time() * 1000)}"
        status = "COMPLETED" if is_valid else "FAILED"
        summary = (
            f"Validasi input {child_id}: {'Lolos verifikasi klinis' if is_valid else 'Ditemukan anomali'}. "
            f"Issues: {len(issues)}, Warnings: {len(warnings)}."
        )

        cursor.execute("""
            INSERT INTO agent_runs (
                id, correlation_id, agent_name, trigger_event, status,
                execution_summary, evidence_text, input_payload_json, output_payload_json,
                model_used, latency_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            run_id, f"corr-val-{child_id}", "Data Quality Agent", "PRE_MEASUREMENT_VALIDATION",
            status, summary,
            "WHO Anthro Biological Plausibility Rules & Outlier Heuristics",
            json.dumps({"child_id": child_id, "weight": weight_kg, "height": height_cm, "age": age_months}),
            json.dumps({"is_valid": is_valid, "issues": issues, "warnings": warnings}),
            "Deterministic Clinical Guardrails", latency_ms
        ))

        conn.commit()
        conn.close()

        return {
            "isValid": is_valid,
            "issues": issues,
            "warnings": warnings,
            "checkedParameters": {
                "age_months": age_months,
                "weight_kg": weight_kg,
                "height_cm": height_cm
            }
        }
