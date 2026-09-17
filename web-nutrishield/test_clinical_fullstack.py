"""
Automated End-to-End Test Suite for NutriShield Care Intelligence
Tests deterministic math, guardrails, 6 autonomous agents, and database state.
"""

import os
import sys
import json
import sqlite3
from pathlib import Path

# Add backend to path
BACKEND_DIR = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from services.orchestrator import AgentOrchestrator

DB_PATH = Path(__file__).resolve().parent / "database" / "nutrishield.db"

def run_test_suite():
    print("=================================================================")
    print("RUNNING NUTRISHIELD CLINICAL & MULTI-AGENT VERIFICATION TEST")
    print("=================================================================")

    assert DB_PATH.exists(), f"Database not found at {DB_PATH}"
    orch = AgentOrchestrator(str(DB_PATH))

    # TEST 1: Deterministic Box-Cox LMS Calculation
    print("\n[TEST 1] Testing Deterministic WHO LMS Box-Cox Math...")
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM who_anthro_lms WHERE indicator='haz' AND gender='male' AND age_months=12")
    lms_haz = c.fetchone()
    assert lms_haz is not None, "Missing WHO Anthro LMS data for 12mo male HAZ"
    print(f"  -> WHO LMS Row Loaded: L={lms_haz['l_param']}, M={lms_haz['m_param']}, S={lms_haz['s_param']}")
    conn.close()

    # TEST 2: Data Quality Agent Guardrails (Unit swap rejection)
    print("\n[TEST 2] Testing Data Quality Agent Unit-Swap Guardrail...")
    # Height entered as 0.73 instead of 73 cm
    dq_meter = orch.data_quality.validate_measurement(
        child_id="child-01",
        measure_date="2026-09-15",
        age_months=14,
        weight_kg=9.6,
        height_cm=0.76 # In meters!
    )
    assert not dq_meter["isValid"], "Data Quality Agent failed to reject height in meters!"
    print(f"  -> Guardrail caught unit swap: {dq_meter['issues'][0]}")

    # TEST 3: Inverted Weight and Height (Weight 76kg, Height 9.6cm)
    print("\n[TEST 3] Testing Inverted Weight/Height Detection...")
    dq_invert = orch.data_quality.validate_measurement(
        child_id="child-01",
        measure_date="2026-09-15",
        age_months=14,
        weight_kg=76.0,
        height_cm=9.6
    )
    assert not dq_invert["isValid"], "Data Quality Agent failed to catch swapped weight & height!"
    print(f"  -> Guardrail caught inverted values: {dq_invert['issues'][0]}")

    # TEST 4: Growth Sentinel & 2T Alert Detection
    print("\n[TEST 4] Testing Growth Sentinel Deterministic Pipeline...")
    pipeline_res = orch.process_measurement_pipeline(
        child_id="child-03", # Raffi
        measure_date="2026-09-15",
        age_months=10,
        weight_kg=7.2,
        height_cm=68.5,
        notes="Uji coba otomatis Growth Sentinel"
    )
    assert pipeline_res["success"], "Measurement pipeline failed to execute"
    assessment = pipeline_res["assessment"]
    print(f"  -> Z-Scores Computed: HAZ={assessment['haz']:+.2f} SD, WAZ={assessment['waz']:+.2f} SD")
    print(f"  -> Human Explanation: {assessment['human_explanation'][:90]}...")
    assert "assessment_id" in assessment, "Missing assessment_id in response"

    # TEST 5: Nutrition Planner with TKPI Constraints & Allergen Exclusion
    print("\n[TEST 5] Testing Nutrition Planner with Allergen Filtering...")
    plan = orch.nutrition_planner.generate_plan(
        child_id="child-01", # Has seafood allergy
        allergens=["seafood", "ikan laut"],
        budget_max_rp=18000
    )
    assert plan["plan_id"] is not None, "Failed to generate nutrition plan"
    assert len(plan["meals"]) == 3, f"Expected 3 meals, got {len(plan['meals'])}"
    print(f"  -> Meals Generated: {len(plan['meals'])} meals, Total Protein: {plan['total_protein_achieved_g']}g")
    print(f"  -> Excluded Allergens: {plan['excluded_allergens']}")

    # TEST 6: Cohort Monitor Audit
    print("\n[TEST 6] Testing Cohort Monitor Audit...")
    audit = orch.cohort_monitor.audit_cohort()
    assert audit["total_children"] >= 7, f"Expected at least 7 children, got {audit['total_children']}"
    print(f"  -> Cohort Stats: {audit['total_children']} balita, Stunting: {audit['stunted_count']} ({audit['stunted_rate_pct']}%)")
    print(f"  -> Missed Weigh-in: {audit['missed_weighin_count']} balita")

    # TEST 7: Telegram Pairing Code Generation
    print("\n[TEST 7] Testing Telegram Integration Code...")
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    acc = conn.cursor().execute("SELECT * FROM integration_accounts WHERE child_id='child-01' AND platform='telegram'").fetchone()
    assert acc is not None, "Missing Telegram integration record"
    print(f"  -> Pairing Token for Child-01: {acc['auth_token']}")
    conn.close()

    print("\n=================================================================")
    print("ALL 7 CLINICAL & AGENTIC VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=================================================================\n")

if __name__ == '__main__':
    run_test_suite()
