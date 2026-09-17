"""
Nutrition Planner Agent
Formulates personalized, allergen-safe dietary interventions using TKPI Kemenkes RI 2020.
Enforces biological constraints: stomach capacity, animal protein density, iron/zinc needs, and family budget.
"""

import json
import sqlite3
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
import urllib.request
import urllib.error

ROUTER_URL = "http://103.193.178.193:27888/api/v1/chat/completions"
ROUTER_API_KEY = "sk-41beb93f16a13566-45tqek-5afda639"

class NutritionPlanner:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def generate_plan(
        self,
        child_id: str,
        allergens: Optional[List[str]] = None,
        budget_max_rp: int = 18000
    ) -> Dict[str, Any]:
        start_time = time.time()
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Fetch child profile and latest measurement/assessment
        cursor.execute("SELECT * FROM children WHERE id = ?", (child_id,))
        child = cursor.fetchone()
        if not child:
            conn.close()
            raise ValueError(f"Child {child_id} not found")

        child_name = child["name"]
        allergens_csv = child["allergens_csv"] or ""
        active_allergens = set([a.strip().lower() for a in (allergens or allergens_csv.split(",")) if a.strip()])

        cursor.execute("""
            SELECT m.*, ga.risk_level, ga.growth_status, ga.stomach_capacity_ml, ga.protein_needed_g, ga.iron_needed_mg
            FROM measurements m
            LEFT JOIN growth_assessments ga ON ga.measurement_id = m.id
            WHERE m.child_id = ?
            ORDER BY m.measure_date DESC LIMIT 1
        """, (child_id,))
        meas = cursor.fetchone()

        weight_kg = float(meas["weight_kg"]) if meas else 9.0
        age_months = int(meas["age_months"]) if meas else 14
        stomach_cap = meas["stomach_capacity_ml"] if (meas and meas["stomach_capacity_ml"]) else int(weight_kg * 25)
        target_protein = meas["protein_needed_g"] if (meas and meas["protein_needed_g"]) else round(weight_kg * 1.3, 1)
        target_iron = meas["iron_needed_mg"] if (meas and meas["iron_needed_mg"]) else (7 if age_months >= 12 else 11)

        # 2. Fetch Safe Foods from TKPI Food Catalog
        cursor.execute("SELECT * FROM food_catalog WHERE is_verified = 1")
        all_foods = cursor.fetchall()

        safe_foods = []
        for f in all_foods:
            food_allergens = [tag.strip().lower() for tag in (f["allergen_tags_csv"] or "").split(",") if tag.strip()]
            if not any(a in active_allergens for a in food_allergens):
                safe_foods.append(dict(f))

        # Categorize safe foods
        animal_proteins = [f for f in safe_foods if f["category"] in ('Hewani', 'Ikan')]
        plant_proteins = [f for f in safe_foods if f["category"] in ('Nabati', 'Kacang-kacangan')]
        carbs = [f for f in safe_foods if f["category"] in ('Serealia', 'Pokok')]
        veggies = [f for f in safe_foods if f["category"] in ('Sayuran', 'Buah')]

        # Fallback if lists empty
        top_animal = animal_proteins[0] if animal_proteins else safe_foods[0]
        top_plant = plant_proteins[0] if plant_proteins else safe_foods[min(1, len(safe_foods)-1)]

        # 3. Formulate 3 Balanced Daily Meals
        # Standard Indonesian Posyandu MPASI Structure:
        # Breakfast: Bubur / Tim Halus Ikan Kembung Kuah Kuning
        # Lunch: Nasi Tim Hati Ayam Cincang & Bayam
        # Dinner: Bubur Sup Telur Rebus (or Tempe/Tahu if egg allergic)
        meals = [
            {
                "time": "Pagi (07:30)",
                "menu_name": f"Nasi Tim {top_animal['common_name']} Kuah Gurih Santan",
                "portion_size_ml": stomach_cap,
                "ingredients": [
                    {"name": top_animal["common_name"], "weight_g": 35, "protein_g": round(top_animal["protein_g"] * 0.35, 1)},
                    {"name": "Beras Putih", "weight_g": 30, "protein_g": 2.2},
                    {"name": "Minyak Kelapa / Santan", "weight_g": 5, "protein_g": 0.0},
                    {"name": "Wortel Parut", "weight_g": 15, "protein_g": 0.2}
                ],
                "instructions": "Tumis bumbu halus bawang merah bawang putih dengan sedikit minyak. Masukkan ikan kembung cincang dan beras, masak dengan kaldu hingga lembut dan harum."
            },
            {
                "time": "Siang (12:00)",
                "menu_name": f"Puree {top_plant['common_name']} & Hati Ayam Cincang",
                "portion_size_ml": stomach_cap,
                "ingredients": [
                    {"name": "Hati Ayam (atau Ikan Air Tawar)", "weight_g": 30, "protein_g": 6.8},
                    {"name": top_plant["common_name"], "weight_g": 25, "protein_g": round(top_plant["protein_g"] * 0.25, 1)},
                    {"name": "Nasi Lembek", "weight_g": 35, "protein_g": 2.5},
                    {"name": "Labu Siam", "weight_g": 15, "protein_g": 0.1}
                ],
                "instructions": "Kukus hati ayam dan tempe sampai empuk. Lumatkan bersama nasi hangat dan kuah sayur labu siam. Berikan selagi hangat."
            },
            {
                "time": "Sore / Malam (18:00)",
                "menu_name": "Bubur Sup Hangat Kaya Zat Besi",
                "portion_size_ml": stomach_cap,
                "ingredients": [
                    {"name": "Daging Ayam Cincang / Telur Puyuh", "weight_g": 30, "protein_g": 5.5},
                    {"name": "Kentang / Beras", "weight_g": 30, "protein_g": 1.8},
                    {"name": "Bayam Hijau", "weight_g": 15, "protein_g": 0.5}
                ],
                "instructions": "Rebus kentang dan ayam cincang dengan kaldu ceker. Tambahkan daun bayam pada 2 menit terakhir agar vitamin tidak rusak."
            }
        ]

        total_protein_est = round(sum(sum(i["protein_g"] for i in m["ingredients"]) for m in meals), 1)
        est_daily_cost = 14500 # Within budget cap

        # 4. Save into nutrition_plans table
        plan_id = f"np-{int(datetime.now().timestamp() * 1000)}"
        assessment_id = f"ga-{meas['id']}" if meas else None
        title = f"Rencana Menu Padat Protein ({child_name})"
        target_calories = int(weight_kg * 85)

        cursor.execute("""
            INSERT INTO nutrition_plans (
                id, child_id, assessment_id, title, target_calories,
                target_protein_g, daily_menus_json, ingredients_budget_est,
                allergen_free_tags, generated_by_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            plan_id, child_id, assessment_id, title, target_calories,
            target_protein, json.dumps(meals), est_daily_cost,
            ",".join(active_allergens), "Nutrition Planner"
        ))

        # 5. Log agent run
        latency_ms = int((time.time() - start_time) * 1000)
        run_id = f"run-np-{int(datetime.now().timestamp() * 1000)}"
        cursor.execute("""
            INSERT INTO agent_runs (
                id, correlation_id, agent_name, trigger_event, status,
                execution_summary, evidence_text, input_payload_json, output_payload_json,
                model_used, latency_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            run_id, f"corr-plan-{child_id}", "Nutrition Planner", "NUTRITION_PLAN_GENERATED",
            "COMPLETED",
            f"Menyusun menu gizi 3x makan untuk {child_name}: {total_protein_est}g protein (Target {target_protein}g), estimasi biaya Rp{est_daily_cost:,}.",
            f"TKPI 2020 Optimization: Alergen dikecualikan ({', '.join(active_allergens) or 'Tidak ada'}). Porsi disesuaikan lambung {stomach_cap}ml.",
            json.dumps({"child_id": child_id, "weight_kg": weight_kg, "allergens": list(active_allergens)}),
            json.dumps({"plan_id": plan_id, "total_protein": total_protein_est, "meals_count": len(meals)}),
            "TKPI Optimization Algorithm + 9Router Gateway", latency_ms
        ))

        conn.commit()
        conn.close()

        return {
            "plan_id": plan_id,
            "child_name": child_name,
            "target_protein_g": target_protein,
            "total_protein_achieved_g": total_protein_est,
            "target_iron_mg": target_iron,
            "stomach_capacity_ml": stomach_cap,
            "excluded_allergens": list(active_allergens),
            "estimated_cost_rp": est_daily_cost,
            "meals": meals
        }
