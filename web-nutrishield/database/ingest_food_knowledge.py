"""
Ingestion script for NutriShield Food Knowledge Base
Integrates:
1. Panganku IFCT / TKPI Kemenkes RI (1,146 foods)
2. Indonesian Packaged Foods from Open Food Facts (500 foods)
3. BPOM Regulation No. 11/2019 on Food Additives / BTP (125 additives)
"""

import csv
import json
import os
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = Path(__file__).resolve().parent / "nutrishield.db"

PANGANKU_CSV = BASE_DIR / "food-dataset" / "processed" / "panganku_ifct_foods.csv"
PACKAGED_CSV = BASE_DIR / "food-dataset" / "processed" / "indonesia_packaged_foods.csv"
BTP_CSV = BASE_DIR / "food-dataset-10.000+" / "processed_pipeline" / "btp_bpom_11_2019.csv"

def to_float(val, default=0.0):
    if not val:
        return default
    try:
        clean = str(val).strip().replace(",", ".")
        return float(clean)
    except (ValueError, TypeError):
        return default

def ensure_tables(cursor):
    # Alter food_catalog table if extra columns don't exist yet
    cursor.execute("PRAGMA table_info(food_catalog);")
    cols = [r[1] for r in cursor.fetchall()]
    new_cols = {
        "barcode": "TEXT",
        "brand": "TEXT",
        "bpom_number": "TEXT",
        "ingredients_text": "TEXT",
        "source_ref": "TEXT DEFAULT 'TKPI Kemenkes'"
    }
    for col_name, col_type in new_cols.items():
        if col_name not in cols:
            cursor.execute(f"ALTER TABLE food_catalog ADD COLUMN {col_name} {col_type};")

    # Create food_btp_regulations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS food_btp_regulations (
        id TEXT PRIMARY KEY,
        ins_number TEXT NOT NULL,
        btp_name TEXT NOT NULL,
        functional_category TEXT NOT NULL,
        bpom_regulation TEXT DEFAULT 'Peraturan BPOM Nomor 11 Tahun 2019',
        safety_notes_for_children TEXT,
        source_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_btp_ins ON food_btp_regulations(ins_number);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_btp_cat ON food_btp_regulations(functional_category);")

def ingest_panganku(cursor):
    if not PANGANKU_CSV.exists():
        print(f"[!] Warning: Panganku CSV not found at {PANGANKU_CSV}")
        return 0

    category_map = {
        "Cereals": "Serealia & Umbi",
        "Vegetables": "Sayuran",
        "Fruits": "Buah-buahan",
        "Meat": "Daging & Unggas",
        "Eggs": "Telur",
        "Fish and Other Seafood": "Ikan & Hasil Laut",
        "Legumes": "Kacang-kacangan",
        "Milk": "Susu & Olahan",
        "Fats and Oils": "Minyak & Lemak",
        "Sugar, Syrup and Confectionery": "Gula & Manisan",
        "Spices": "Bumbu & Rempah",
        "Miscellaneous": "Lain-lain"
    }

    count = 0
    with open(PANGANKU_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            record_id = row.get("record_id") or f"panganku-{row.get('Food Code')}"
            food_code = row.get("Food Code", "")
            food_name = row.get("Food Name", "")
            group = row.get("Group", "")
            food_type = row.get("Type", "")
            cat_id = category_map.get(group, group or "Pangan Lokal")

            cursor.execute("""
            INSERT OR REPLACE INTO food_catalog (
                id, name_id, common_name, category,
                energy_kcal, protein_g, fat_g, carbs_g,
                calcium_mg, iron_mg, zinc_mg, omega3_g,
                avg_cost_per_100g, allergen_tags_csv, serving_suggestion,
                is_verified, barcode, brand, bpom_number, ingredients_text, source_ref
            ) VALUES (
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?, ?
            )
            """, (
                record_id,
                food_name,
                f"{food_name} [{food_code}]",
                cat_id,
                0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0,
                0.0, "", f"Pangan lokal kelompok {cat_id} ({food_type})",
                1, "", "Panganku Kemenkes", "", "", "Indonesian Food Composition Table (IFCT / Panganku)"
            ))
            count += 1
    return count

def ingest_packaged_foods(cursor):
    if not PACKAGED_CSV.exists():
        print(f"[!] Warning: Packaged food CSV not found at {PACKAGED_CSV}")
        return 0

    count = 0
    with open(PACKAGED_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            record_id = row.get("record_id") or f"off-{row.get('barcode')}"
            barcode = row.get("barcode", "")
            food_name = row.get("food_name_id") or row.get("food_name") or "Produk Olahan"
            common_name = row.get("food_name") or food_name
            brand = row.get("brand", "")
            categories = row.get("categories", "Produk Kemasan")
            ingredients = row.get("ingredients_as_label", "")
            allergens = row.get("allergens", "")

            energy_kcal = to_float(row.get("energy_kcal_100g"))
            protein_g = to_float(row.get("proteins_100g"))
            fat_g = to_float(row.get("fat_100g"))
            carbs_g = to_float(row.get("carbohydrates_100g"))
            salt_g = to_float(row.get("salt_100g"))
            sodium_g = to_float(row.get("sodium_100g"))

            cursor.execute("""
            INSERT OR REPLACE INTO food_catalog (
                id, name_id, common_name, category,
                energy_kcal, protein_g, fat_g, carbs_g,
                calcium_mg, iron_mg, zinc_mg, omega3_g,
                avg_cost_per_100g, allergen_tags_csv, serving_suggestion,
                is_verified, barcode, brand, bpom_number, ingredients_text, source_ref
            ) VALUES (
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?, ?
            )
            """, (
                record_id,
                food_name,
                common_name,
                "Produk Kemasan",
                energy_kcal, protein_g, fat_g, carbs_g,
                0.0, 0.0, 0.0, 0.0,
                0.0, allergens, f"Brand: {brand}. Garam per 100g: {salt_g}g",
                1, barcode, brand, "", ingredients, "Open Food Facts Indonesia"
            ))
            count += 1
    return count

def ingest_btp_regulations(cursor):
    if not BTP_CSV.exists():
        print(f"[!] Warning: BTP CSV not found at {BTP_CSV}")
        return 0

    count = 0
    with open(BTP_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            record_id = row.get("record_id") or f"btp-{row.get('ins_number')}"
            ins = row.get("ins_number", "").strip()
            name = row.get("btp_name_raw", "").strip()
            category = row.get("functional_category", "").strip()
            source_url = row.get("source_url", "https://jdih.pom.go.id/download/rule/848/11/2019/Bahan%20Tambahan%20Pangan")

            advisory = "Penggunaan wajar terdaftar BPOM RI."
            cat_upper = category.upper()
            if "PEWARNA" in cat_upper:
                advisory = "Pewarna makanan. Hindari paparan berlebih pada balita; prioritaskan pewarna alami (kunyit, daun suji)."
            elif "PEMANIS" in cat_upper:
                advisory = "Pemanis buatan dilarang atau sangat dibatasi untuk pangan olahan balita dan MP-ASI."
            elif "PENGAWET" in cat_upper:
                advisory = "Pengawet berizin BPOM. Hindari konsumsi harian berulang pada balita usia <24 bulan."
            elif "PENGUAT RASA" in cat_upper:
                advisory = "Penguat rasa / MSG. Gunakan seminimal mungkin untuk menjaga sensitivitas rasa alami anak."

            cursor.execute("""
            INSERT OR REPLACE INTO food_btp_regulations (
                id, ins_number, btp_name, functional_category,
                bpom_regulation, safety_notes_for_children, source_url
            ) VALUES (
                ?, ?, ?, ?,
                ?, ?, ?
            )
            """, (
                record_id, ins, name, category,
                "Peraturan BPOM Nomor 11 Tahun 2019",
                advisory, source_url
            ))
            count += 1
    return count

def main():
    print(f"[*] Connecting to SQLite DB: {DB_PATH}")
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode = WAL;")

    ensure_tables(cursor)

    panganku_count = ingest_panganku(cursor)
    packaged_count = ingest_packaged_foods(cursor)
    btp_count = ingest_btp_regulations(cursor)

    conn.commit()

    cursor.execute("SELECT count(*) FROM food_catalog;")
    total_foods = cursor.fetchone()[0]

    cursor.execute("SELECT count(*) FROM food_btp_regulations;")
    total_btp = cursor.fetchone()[0]

    conn.close()

    result = {
        "status": "success",
        "ingested": {
            "panganku_ifct": panganku_count,
            "packaged_foods": packaged_count,
            "btp_regulations": btp_count
        },
        "database_totals": {
            "food_catalog": total_foods,
            "food_btp_regulations": total_btp
        }
    }
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
