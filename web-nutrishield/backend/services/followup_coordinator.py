"""
Follow-up Coordinator Agent
Automatically turns growth flags and 2T alerts into concrete, trackable care tasks.
Dispatches notifications and ensures high-priority cases (2T / stunting) receive immediate home visits or Puskesmas referral.
"""

import json
import sqlite3
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

class FollowupCoordinator:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def coordinate_assessment(self, assessment_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Triggered when Growth Sentinel completes an assessment.
        If risk level is MONITOR or NEEDS_HUMAN_REVIEW, auto-generates a Care Task.
        """
        start_time = time.time()
        risk_level = assessment_data.get("risk_level", "STABLE")
        if risk_level == "STABLE":
            return None

        child_id = assessment_data["child_id"]
        child_name = assessment_data["child_name"]
        assessment_id = assessment_data["assessment_id"]
        is_2t = assessment_data.get("is_2t_alert", False)
        haz = assessment_data.get("haz", 0.0)

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Check existing open tasks for this child to avoid spamming
        cursor.execute("""
            SELECT id, title, priority, status FROM care_tasks
            WHERE child_id = ? AND status IN ('OPEN', 'IN_PROGRESS')
        """, (child_id,))
        open_tasks = cursor.fetchall()

        if open_tasks:
            # Task already exists, log coordinator review
            conn.close()
            return {
                "action": "EXISTING_TASK_MAINTAINED",
                "task_id": open_tasks[0]["id"],
                "status": open_tasks[0]["status"]
            }

        # Determine task parameters
        today = datetime.now()
        task_id = f"task-{int(today.timestamp() * 1000)}"

        if risk_level == "NEEDS_HUMAN_REVIEW":
            priority = "CRITICAL"
            due_date = (today + timedelta(days=2)).strftime("%Y-%m-%d")
            title = f"Kunjungan Rumah Segera: {child_name} (2T Alert & Stunting)"
            description = (
                f"Lakukan kunjungan rumah maksimal 48 jam untuk evaluasi asupan MPASI, "
                f"riwayat sakit batuk/diare, serta ajarkan resep padat energi berbasis pangan lokal. "
                f"Jika diperlukan, fasilitasi rujukan ke Poli Gizi Puskesmas."
            )
        elif is_2t:
            priority = "HIGH"
            due_date = (today + timedelta(days=3)).strftime("%Y-%m-%d")
            title = f"Konseling Perlambatan Tumbuh (2T): {child_name}"
            description = (
                f"Hubungi orang tua ananda untuk verifikasi porsi makan dan frekuensi camilan. "
                f"Pantau kenaikan berat badan kembali dalam 14 hari."
            )
        else:
            priority = "MEDIUM"
            due_date = (today + timedelta(days=7)).strftime("%Y-%m-%d")
            title = f"Pemantauan Gizi Terarah: {child_name}"
            description = f"Berikan resep MPASI kaya protein hewani dan pastikan kehadiran di Posyandu bulan depan."

        assigned_to = "Kader Posyandu (Wilayah Mawar III)"

        # Insert care task
        cursor.execute("""
            INSERT INTO care_tasks (
                id, child_id, assessment_id, title, description,
                priority, assigned_to, due_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
        """, (task_id, child_id, assessment_id, title, description, priority, assigned_to, due_date))

        # Insert notification
        notif_id = f"notif-{int(today.timestamp() * 1000)}"
        cursor.execute("""
            INSERT INTO notifications (
                id, recipient_name, channel, title, message, deep_link, status
            ) VALUES (?, ?, ?, ?, ?, ?, 'SENT')
        """, (
            notif_id, "Kader Rahmawati", "in_app",
            f"Tindak Lanjut Baru: {title}",
            description, f"/tasks/{task_id}"
        ))

        # Log agent run
        latency_ms = int((time.time() - start_time) * 1000)
        run_id = f"run-fc-{int(today.timestamp() * 1000)}"
        cursor.execute("""
            INSERT INTO agent_runs (
                id, correlation_id, agent_name, trigger_event, status,
                execution_summary, evidence_text, input_payload_json, output_payload_json,
                model_used, latency_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            run_id, f"corr-{assessment_id}", "Follow-up Coordinator", "CARE_TASK_DISPATCHED",
            "COMPLETED",
            f"Otomatis membuat Care Task [{priority}] untuk {child_name}: {title}.",
            f"SOP Posyandu: Kasus {risk_level} wajib memiliki rencana aksi terukur sebelum batas {due_date}.",
            json.dumps({"assessment_id": assessment_id, "child_id": child_id, "risk_level": risk_level}),
            json.dumps({"task_id": task_id, "priority": priority, "due_date": due_date}),
            "Autonomous Coordinator Engine", latency_ms
        ))

        conn.commit()
        conn.close()

        return {
            "action": "TASK_CREATED",
            "task_id": task_id,
            "title": title,
            "priority": priority,
            "due_date": due_date,
            "assigned_to": assigned_to
        }

    def update_task_status(self, task_id: str, new_status: str, notes: Optional[str] = None) -> Dict[str, Any]:
        """
        Updates task status (OPEN, IN_PROGRESS, DONE, ESCALATED) with resolution notes.
        """
        if new_status not in ('OPEN', 'IN_PROGRESS', 'DONE', 'ESCALATED'):
            raise ValueError(f"Invalid status: {new_status}")

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        resolved_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S") if new_status in ('DONE', 'ESCALATED') else None

        cursor.execute("""
            UPDATE care_tasks
            SET status = ?, resolution_notes = COALESCE(?, resolution_notes), resolved_at = ?
            WHERE id = ?
        """, (new_status, notes, resolved_at, task_id))

        conn.commit()
        conn.close()
        return {"success": True, "task_id": task_id, "status": new_status, "notes": notes}
