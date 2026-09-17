"""
Growth Sentinel Agent
Service for deterministic anthropometric evaluation (WHO 2006 / Permenkes No. 2/2020)
Strict rule: Box-Cox LMS math is strictly deterministic.
Outputs both clinical evidence (for cadres/supervisors) and warm, jargon-free explanations (for mothers/families).
"""

import math
import json
import sqlite3
import time
from datetime import datetime
from typing import Dict, Any, Optional

def calculate_box_cox(val: float, l: float, m: float, s: float) -> float:
    if val <= 0 or m <= 0 or s <= 0:
        return 0.0
    if abs(l) < 0.0001:
        return math.log(val / m) / s
    return ((val / m) ** l - 1.0) / (l * s)

def get_lms_params(conn: sqlite3.Connection, indicator: str, gender: str, age_months: float):
    cursor = conn.cursor()
    cursor.execute("""
        SELECT age_months, l_param, m_param, s_param
        FROM who_anthro_lms
        WHERE indicator = ? AND gender = ?
        ORDER BY age_months ASC
    """, (indicator, gender))
    rows = cursor.fetchall()
    if not rows:
        return 0.0, 10.0, 0.1

    exact = [r for r in rows if float(r["age_months"]) == age_months]
    if exact:
        return float(exact[0]["l_param"]), float(exact[0]["m_param"]), float(exact[0]["s_param"])

    lower = [r for r in rows if float(r["age_months"]) <= age_months]
    upper = [r for r in rows if float(r["age_months"]) > age_months]

    if not lower:
        return float(upper[0]["l_param"]), float(upper[0]["m_param"]), float(upper[0]["s_param"])
    if not upper:
        return float(lower[-1]["l_param"]), float(lower[-1]["m_param"]), float(lower[-1]["s_param"])

    r1, r2 = lower[-1], upper[0]
    t = (age_months - float(r1["age_months"])) / (float(r2["age_months"]) - float(r1["age_months"]))
    l = float(r1["l_param"]) + t * (float(r2["l_param"]) - float(r1["l_param"]))
    m = float(r1["m_param"]) + t * (float(r2["m_param"]) - float(r1["m_param"]))
    s = float(r1["s_param"]) + t * (float(r2["s_param"]) - float(r1["s_param"]))
    return l, m, s

class GrowthSentinel:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def assess_measurement(self, measurement_id: str) -> Dict[str, Any]:
        start_time = time.time()
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Fetch measurement & child info
        cursor.execute("""
            SELECT m.*, c.gender, c.name as child_name, c.birth_date, c.allergens_csv
            FROM measurements m
            JOIN children c ON m.child_id = c.id
            WHERE m.id = ?
        """, (measurement_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Measurement {measurement_id} not found")

        child_id = row["child_id"]
        gender = row["gender"]
        age_months = float(row["age_months"])
        weight_kg = float(row["weight_kg"])
        height_cm = float(row["height_cm"])
        child_name = row["child_name"]

        # 2. Deterministic Box-Cox LMS Calculation
        w_l, w_m, w_s = get_lms_params(conn, "waz", gender, age_months)
        waz = round(calculate_box_cox(weight_kg, w_l, w_m, w_s), 2)

        h_l, h_m, h_s = get_lms_params(conn, "haz", gender, age_months)
        haz = round(calculate_box_cox(height_cm, h_l, h_m, h_s), 2)

        expected_w = w_m * ((height_cm / h_m) ** 2.5) if h_m > 0 else weight_kg
        whz = round((weight_kg - expected_w) / (expected_w * w_s), 2) if (expected_w * w_s) > 0 else 0.0

        # 3. Check 2T Alert (Weight velocity comparison with previous measurement)
        cursor.execute("""
            SELECT weight_kg, measure_date, age_months
            FROM measurements
            WHERE child_id = ? AND id != ? AND measure_date <= ?
            ORDER BY measure_date DESC LIMIT 1
        """, (child_id, measurement_id, row["measure_date"]))
        prev_m = cursor.fetchone()

        is_2t = False
        prev_weight = None
        if prev_m:
            prev_weight = float(prev_m["weight_kg"])
            # Flat or declining weight is flagged as 2T (Growth Faltering)
            if weight_kg <= prev_weight:
                is_2t = True

        # 4. Determine Standard Status Classifications (Permenkes No. 2/2020)
        if haz < -3.0:
            haz_status = "Sangat Pendek (Severely Stunted)"
        elif haz < -2.0:
            haz_status = "Pendek (Stunted)"
        elif haz > 3.0:
            haz_status = "Tinggi"
        else:
            haz_status = "Normal"

        if waz < -3.0:
            waz_status = "Sangat Kurang"
        elif waz < -2.0:
            waz_status = "Kurang"
        elif waz > 2.0:
            waz_status = "Risiko Berat Lebih"
        else:
            waz_status = "Normal"

        if whz < -3.0:
            whz_status = "Gizi Buruk"
        elif whz < -2.0:
            whz_status = "Gizi Kurang"
        elif whz > 2.0:
            whz_status = "Gizi Lebih"
        else:
            whz_status = "Gizi Baik"

        # Overall Risk Level & Clinical Categorization
        if haz < -2.0 and is_2t:
            risk_level = "NEEDS_HUMAN_REVIEW"
            growth_status = "Stunting + Alert 2T"
        elif haz < -2.0 or is_2t or waz < -2.0:
            risk_level = "MONITOR"
            growth_status = "Perlu Pemantauan Khusus" if not is_2t else "Alert 2T (Perlambatan Tumbuh)"
        else:
            risk_level = "STABLE"
            growth_status = "Pertumbuhan Optimal"

        # 5. Physiological targets
        stomach_capacity_ml = min(280, max(120, round(weight_kg * 25)))
        protein_needed_g = round(weight_kg * 1.3, 1)
        iron_needed_mg = 7 if age_months >= 12 else 11

        # 6. Dual Outputs: Clinical vs Warm Parent Explanation
        clinical_evidence = {
            "standards": ["Permenkes RI No. 2/2020", "WHO Anthro 2006 Standards"],
            "parameters": {
                "age_months": age_months,
                "weight_kg": weight_kg,
                "height_cm": height_cm,
                "waz": {"zscore": waz, "l": round(w_l, 4), "m": round(w_m, 2), "s": round(w_s, 4)},
                "haz": {"zscore": haz, "l": round(h_l, 4), "m": round(h_m, 2), "s": round(h_s, 4)},
                "whz": {"zscore": whz}
            },
            "growth_trajectory": {
                "previous_weight_kg": prev_weight,
                "weight_delta_kg": round(weight_kg - prev_weight, 2) if prev_weight else None,
                "is_2t_alert": is_2t
            },
            "clinical_flags": {
                "stunting": haz < -2.0,
                "underweight": waz < -2.0,
                "growth_faltering": is_2t
            }
        }

        # Warm parent explanation (no jargon, actionable, supportive)
        if risk_level == "NEEDS_HUMAN_REVIEW":
            human_explanation = (
                f"Pertumbuhan tinggi badan ananda {child_name} saat ini berada di bawah acuan baku, "
                f"dan kenaikan berat badannya bulan ini belum optimal. "
                f"Jangan berkecil hati, kondisi ini sangat bisa dikejar bersama! "
                f"Kader Posyandu dan Bidan Puskesmas akan mendampingi Ibu dengan evaluasi menu padat energi "
                f"dan pemeriksaan kesehatan lanjutan."
            )
        elif risk_level == "MONITOR":
            if is_2t:
                human_explanation = (
                    f"Kenaikan berat badan {child_name} bulan ini masih melambat dibanding bulan lalu. "
                    f"Mari kita periksa apakah ada batuk/pilek atau ananda sedang fase memilih makanan. "
                    f"Fokuskan asupan protein hewani yang disukai seperti telur atau hati ayam cincang."
                )
            else:
                human_explanation = (
                    f"Tinggi badan {child_name} memerlukan kejar tumbuh bertahap. "
                    f"Perbanyak sumber protein hewani padat kalori dan pastikan tidur malam cukup 10-12 jam."
                )
        else:
            human_explanation = (
                f"Alhamdulillah, pertumbuhan {child_name} berkembang sehat dan baik sesuai grafik baku anak sehat! "
                f"Terus lanjutkan pola makan bergizi seimbang, kebersihan makanan, dan stimulasi aktif."
            )

        # 7. Upsert Growth Assessment in Database
        assessment_id = f"ga-{measurement_id}"
        cursor.execute("""
            INSERT OR REPLACE INTO growth_assessments (
                id, measurement_id, child_id, waz_zscore, haz_zscore, whz_zscore,
                growth_status, haz_status, waz_status, whz_status, is_2t_alert,
                risk_level, stomach_capacity_ml, protein_needed_g, iron_needed_mg,
                clinical_evidence_json, human_explanation_mother, assessed_by_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            assessment_id, measurement_id, child_id, waz, haz, whz,
            growth_status, haz_status, waz_status, whz_status, 1 if is_2t else 0,
            risk_level, stomach_capacity_ml, protein_needed_g, iron_needed_mg,
            json.dumps(clinical_evidence), human_explanation, "Growth Sentinel"
        ))

        # 8. Record Agent Run in Audit Log
        latency_ms = int((time.time() - start_time) * 1000)
        run_id = f"run-gs-{int(time.time() * 1000)}"
        cursor.execute("""
            INSERT INTO agent_runs (
                id, correlation_id, agent_name, trigger_event, status,
                execution_summary, evidence_text, input_payload_json, output_payload_json,
                model_used, latency_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            run_id, f"corr-{measurement_id}", "Growth Sentinel", "MEASUREMENT_ASSESSED",
            "NEEDS_REVIEW" if risk_level == "NEEDS_HUMAN_REVIEW" else "COMPLETED",
            f"Menilai pertumbuhan {child_name}: HAZ {haz:+.2f} SD, WAZ {waz:+.2f} SD. Status: {growth_status}.",
            f"Box-Cox LMS WHO Anthro 2006. Standard Permenkes RI No. 2/2020. 2T: {'TERDETEKSI' if is_2t else 'NORMAL'}.",
            json.dumps({"child_id": child_id, "weight": weight_kg, "height": height_cm, "age": age_months}),
            json.dumps({"risk_level": risk_level, "haz": haz, "waz": waz, "is_2t": is_2t}),
            "Deterministic WHO Engine (Python Box-Cox)", latency_ms
        ))

        conn.commit()
        conn.close()

        return {
            "assessment_id": assessment_id,
            "child_id": child_id,
            "child_name": child_name,
            "waz": waz,
            "haz": haz,
            "whz": whz,
            "haz_status": haz_status,
            "waz_status": waz_status,
            "whz_status": whz_status,
            "growth_status": growth_status,
            "risk_level": risk_level,
            "is_2t_alert": is_2t,
            "stomach_capacity_ml": stomach_capacity_ml,
            "protein_needed_g": protein_needed_g,
            "iron_needed_mg": iron_needed_mg,
            "clinical_evidence": clinical_evidence,
            "human_explanation": human_explanation
        }
