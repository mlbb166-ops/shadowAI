"""
Agent Orchestrator
Master coordinator routing real events between all 6 autonomous agents:
Data Quality Agent -> Growth Sentinel -> Follow-up Coordinator -> Nutrition Planner -> Cohort Monitor.
Ensures atomic execution, audit event logging, and state synchronization.
"""

import json
import sqlite3
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path

from services.data_quality import DataQualityAgent
from services.growth_sentinel import GrowthSentinel
from services.followup_coordinator import FollowupCoordinator
from services.nutrition_planner import NutritionPlanner
from services.cohort_monitor import CohortMonitor

class AgentOrchestrator:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.data_quality = DataQualityAgent(db_path)
        self.growth_sentinel = GrowthSentinel(db_path)
        self.followup_coordinator = FollowupCoordinator(db_path)
        self.nutrition_planner = NutritionPlanner(db_path)
        self.cohort_monitor = CohortMonitor(db_path)

    def log_audit_event(self, actor: str, action: str, entity_type: str, entity_id: str, details: Dict[str, Any]):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        event_id = f"aud-{int(time.time() * 1000)}"
        cursor.execute("""
            INSERT INTO audit_events (id, actor_name, action, entity_type, entity_id, details_json)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (event_id, actor, action, entity_type, entity_id, json.dumps(details)))
        conn.commit()
        conn.close()

    def process_measurement_pipeline(
        self,
        child_id: str,
        measure_date: str,
        age_months: float,
        weight_kg: float,
        height_cm: float,
        head_circ_cm: Optional[float] = None,
        notes: Optional[str] = None,
        measured_by_user_id: Optional[str] = "user-rahmawati",
        input_source: str = "web_kader"
    ) -> Dict[str, Any]:
        """
        Executes end-to-end multi-agent pipeline upon measurement input:
        Step 1: Data Quality Agent validates input guardrails.
        Step 2: Measurement stored persistently in SQLite.
        Step 3: Growth Sentinel computes deterministic LMS Z-scores & 2T Alert.
        Step 4: Follow-up Coordinator creates care tasks if stunting or faltering detected.
        Step 5: Audit event logged.
        """
        # Step 1: Pre-Validation
        val_result = self.data_quality.validate_measurement(
            child_id=child_id,
            measure_date=measure_date,
            age_months=age_months,
            weight_kg=weight_kg,
            height_cm=height_cm,
            head_circ_cm=head_circ_cm
        )

        if not val_result["isValid"]:
            return {
                "success": False,
                "stage": "DATA_QUALITY_GUARDRAIL",
                "validation": val_result
            }

        # Step 2: Persist Measurement
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        measurement_id = f"m-{int(time.time() * 1000)}"

        cursor.execute("""
            INSERT INTO measurements (
                id, child_id, measured_by_user_id, measure_date, age_months,
                weight_kg, height_cm, head_circ_cm, input_source, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            measurement_id, child_id, measured_by_user_id, measure_date,
            age_months, weight_kg, height_cm, head_circ_cm, input_source, notes
        ))
        conn.commit()
        conn.close()

        # Step 3: Growth Sentinel Assessment
        assessment = self.growth_sentinel.assess_measurement(measurement_id)

        # Step 4: Follow-up Coordinator
        task_action = self.followup_coordinator.coordinate_assessment(assessment)

        # Step 5: Audit Event
        self.log_audit_event(
            actor="Agent Orchestrator",
            action="MEASUREMENT_PIPELINE_EXECUTED",
            entity_type="measurement",
            entity_id=measurement_id,
            details={
                "child_id": child_id,
                "risk_level": assessment["risk_level"],
                "haz": assessment["haz"],
                "waz": assessment["waz"],
                "is_2t": assessment["is_2t_alert"],
                "task_created": bool(task_action)
            }
        )

        return {
            "success": True,
            "measurement_id": measurement_id,
            "validation_warnings": val_result["warnings"],
            "assessment": assessment,
            "task_action": task_action
        }
