"""
Cohort Monitor Agent
Performs cross-sectional and longitudinal cohort health audits for posyandus and health centers.
Identifies children who missed monthly weigh-ins, tracks stunting rates, and audits open care tasks.
"""

import json
import sqlite3
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

class CohortMonitor:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def audit_cohort(self, cohort_id: Optional[str] = None) -> Dict[str, Any]:
        start_time = time.time()
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Total registered children in cohort
        cohort_filter = "WHERE cohort_id = ?" if cohort_id else ""
        params = (cohort_id,) if cohort_id else ()

        cursor.execute(f"SELECT * FROM children {cohort_filter}", params)
        children = cursor.fetchall()
        total_children = len(children)

        # 2. Latest measurement per child
        stunted_children = []
        alert_2t_children = []
        normal_children = []
        missed_weighin_children = []

        now = datetime.now()
        thirty_five_days_ago = (now - timedelta(days=35)).strftime("%Y-%m-%d")

        for c in children:
            cid = c["id"]
            cursor.execute("""
                SELECT m.*, ga.risk_level, ga.growth_status, ga.haz_status, ga.haz_zscore, ga.waz_zscore, ga.whz_zscore, ga.is_2t_alert
                FROM measurements m
                LEFT JOIN growth_assessments ga ON ga.measurement_id = m.id
                WHERE m.child_id = ?
                ORDER BY m.measure_date DESC LIMIT 1
            """, (cid,))
            latest = cursor.fetchone()

            if not latest:
                missed_weighin_children.append({
                    "child_id": cid,
                    "name": c["name"],
                    "parent_name": c["parent_name"],
                    "last_measured": "Belum pernah",
                    "days_overdue": 60
                })
            else:
                m_date = latest["measure_date"]
                if m_date < thirty_five_days_ago:
                    try:
                        d_obj = datetime.strptime(m_date, "%Y-%m-%d")
                        days_diff = (now - d_obj).days
                    except Exception:
                        days_diff = 40
                    missed_weighin_children.append({
                        "child_id": cid,
                        "name": c["name"],
                        "parent_name": c["parent_name"],
                        "last_measured": m_date,
                        "days_overdue": days_diff - 30
                    })

                is_stunted = float(latest["haz_zscore"] or 0) < -2.0
                is_2t = bool(latest["is_2t_alert"])

                child_info = {
                    "child_id": cid,
                    "name": c["name"],
                    "age_months": latest["age_months"],
                    "weight_kg": float(latest["weight_kg"]),
                    "height_cm": float(latest["height_cm"]),
                    "haz": float(latest["haz_zscore"] or 0),
                    "waz": float(latest["waz_zscore"] or 0),
                    "is_2t": is_2t
                }

                if is_stunted:
                    stunted_children.append(child_info)
                if is_2t:
                    alert_2t_children.append(child_info)
                if not is_stunted and not is_2t:
                    normal_children.append(child_info)

        # 3. Care Task status counts
        cursor.execute("SELECT priority, status, COUNT(*) as count FROM care_tasks GROUP BY priority, status")
        task_rows = cursor.fetchall()

        task_summary = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "OPEN": 0, "IN_PROGRESS": 0, "DONE": 0}
        for r in task_rows:
            p = r["priority"]
            s = r["status"]
            cnt = r["count"]
            if p in task_summary:
                task_summary[p] += cnt
            if s in task_summary:
                task_summary[s] += cnt

        stunting_rate_pct = round((len(stunted_children) / total_children * 100), 1) if total_children > 0 else 0.0
        alert_2t_rate_pct = round((len(alert_2t_children) / total_children * 100), 1) if total_children > 0 else 0.0

        # 4. Log agent run
        latency_ms = int((time.time() - start_time) * 1000)
        run_id = f"run-cm-{int(time.time() * 1000)}"
        cursor.execute("""
            INSERT INTO agent_runs (
                id, correlation_id, agent_name, trigger_event, status,
                execution_summary, evidence_text, input_payload_json, output_payload_json,
                model_used, latency_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            run_id, f"corr-audit-{cohort_id or 'all'}", "Cohort Monitor", "COHORT_AUDIT_COMPLETED",
            "COMPLETED",
            f"Audit kohort selesai: {total_children} balita terdaftar, {len(stunted_children)} stunting ({stunting_rate_pct}%), "
            f"{len(alert_2t_children)} alert 2T, {len(missed_weighin_children)} balita absen timbang.",
            f"Berdasarkan standar kohort terintegrasi Kemenkes RI. Task open: {task_summary['OPEN']}.",
            json.dumps({"cohort_id": cohort_id, "total_children": total_children}),
            json.dumps({"stunting_rate": stunting_rate_pct, "alert_2t_count": len(alert_2t_children)}),
            "Autonomous Cohort Monitor", latency_ms
        ))

        conn.commit()
        conn.close()

        return {
            "total_children": total_children,
            "stunted_count": len(stunted_children),
            "stunted_rate_pct": stunting_rate_pct,
            "alert_2t_count": len(alert_2t_children),
            "alert_2t_rate_pct": alert_2t_rate_pct,
            "normal_count": len(normal_children),
            "missed_weighin_count": len(missed_weighin_children),
            "missed_weighin_list": missed_weighin_children,
            "stunted_list": stunted_children,
            "alert_2t_list": alert_2t_children,
            "tasks_summary": task_summary
        }
