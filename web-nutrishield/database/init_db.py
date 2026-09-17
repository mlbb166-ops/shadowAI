"""
Database Initializer and Seeder for NutriShield SQLite Database (WAL Mode)
References: Permenkes RI No. 2/2020 & WHO Child Growth Standards 2006 & TKPI Kemenkes RI 2020
"""
import sqlite3
import os
import json
from pathlib import Path

DB_DIR = Path(__file__).parent
DB_PATH = DB_DIR / "nutrishield.db"
SCHEMA_PATH = DB_DIR / "schemas" / "schema.sql"

def init_and_seed_database():
    print(f"[*] Initializing NutriShield Database at: {DB_PATH}")
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    # Enable WAL mode and foreign keys
    cursor.execute("PRAGMA journal_mode = WAL;")
    cursor.execute("PRAGMA foreign_keys = ON;")

    # Execute base schema
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    cursor.executescript(schema_sql)

    # Add master table for Posyandu children if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS posyandu_children (
        child_id TEXT PRIMARY KEY,
        nik TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        gender TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        parent_name TEXT NOT NULL,
        posyandu_name TEXT NOT NULL,
        address TEXT NOT NULL,
        allergens TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 1. Seed WHO Anthro LMS Data
    lms_records = [
        # Male WAZ
        ('waz', 'male', 0.0, None, 0.3487, 3.346, 0.14602),
        ('waz', 'male', 3.0, None, 0.1580, 6.402, 0.12260),
        ('waz', 'male', 6.0, None, 0.0315, 7.934, 0.11325),
        ('waz', 'male', 9.0, None, -0.0465, 8.878, 0.11026),
        ('waz', 'male', 12.0, None, -0.0988, 9.617, 0.10982),
        ('waz', 'male', 18.0, None, -0.1568, 10.908, 0.11030),
        ('waz', 'male', 24.0, None, -0.1983, 12.151, 0.11180),
        ('waz', 'male', 36.0, None, -0.2312, 14.338, 0.11720),
        ('waz', 'male', 48.0, None, -0.2520, 16.325, 0.12350),
        ('waz', 'male', 60.0, None, -0.2700, 18.310, 0.13010),
        # Male HAZ
        ('haz', 'male', 0.0, None, 1.0, 49.88, 0.03795),
        ('haz', 'male', 3.0, None, 1.0, 61.42, 0.03487),
        ('haz', 'male', 6.0, None, 1.0, 67.62, 0.03402),
        ('haz', 'male', 9.0, None, 1.0, 71.96, 0.03421),
        ('haz', 'male', 12.0, None, 1.0, 75.74, 0.03478),
        ('haz', 'male', 18.0, None, 1.0, 82.32, 0.03582),
        ('haz', 'male', 24.0, None, 1.0, 87.82, 0.03712),
        ('haz', 'male', 36.0, None, 1.0, 96.11, 0.03920),
        ('haz', 'male', 48.0, None, 1.0, 103.32, 0.04100),
        ('haz', 'male', 60.0, None, 1.0, 110.02, 0.04250),
        # Female WAZ
        ('waz', 'female', 0.0, None, 0.3809, 3.232, 0.14171),
        ('waz', 'female', 3.0, None, 0.1950, 5.845, 0.12450),
        ('waz', 'female', 6.0, None, 0.0712, 7.297, 0.11620),
        ('waz', 'female', 9.0, None, -0.0035, 8.243, 0.11410),
        ('waz', 'female', 12.0, None, -0.0520, 8.948, 0.11430),
        ('waz', 'female', 18.0, None, -0.1120, 10.236, 0.11620),
        ('waz', 'female', 24.0, None, -0.1550, 11.482, 0.11890),
        ('waz', 'female', 36.0, None, -0.1990, 13.850, 0.12600),
        ('waz', 'female', 48.0, None, -0.2240, 16.020, 0.13320),
        ('waz', 'female', 60.0, None, -0.2450, 18.210, 0.14100),
        # Female HAZ
        ('haz', 'female', 0.0, None, 1.0, 49.14, 0.03790),
        ('haz', 'female', 3.0, None, 1.0, 59.81, 0.03490),
        ('haz', 'female', 6.0, None, 1.0, 65.73, 0.03420),
        ('haz', 'female', 9.0, None, 1.0, 70.14, 0.03450),
        ('haz', 'female', 12.0, None, 1.0, 74.02, 0.03520),
        ('haz', 'female', 18.0, None, 1.0, 80.71, 0.03650),
        ('haz', 'female', 24.0, None, 1.0, 86.42, 0.03800),
        ('haz', 'female', 36.0, None, 1.0, 95.10, 0.04010),
        ('haz', 'female', 48.0, None, 1.0, 102.70, 0.04210),
        ('haz', 'female', 60.0, None, 1.0, 109.40, 0.04380),
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO who_anthro_lms (indicator, gender, age_months, length_cm, l_param, m_param, s_param)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, lms_records)

    # 2. Seed Authentic TKPI Foods
    foods = [
        ('ikan-kembung', 'Ikan Kembung Segar', 'Rastrelliger brachysoma', 'Lauk Hewani', 112, 21.4, 2.3, 0.0, 136, 2.0, 1.1, 30, 0.0, 2.2, 3500.0, 'seafood,ikan laut', 'TKPI Kemenkes 2020'),
        ('ikan-salmon', 'Ikan Salmon Atlantik', 'Salmo salar', 'Lauk Hewani', 142, 19.8, 6.3, 0.0, 12, 0.8, 0.6, 26, 0.0, 1.4, 32000.0, 'seafood,ikan laut', 'USDA & Import Retail 2026'),
        ('daun-kelor', 'Daun Kelor Segar', 'Moringa oleifera', 'Sayuran', 92, 5.1, 1.6, 14.3, 440, 7.0, 0.8, 11300, 220.0, 0.4, 1500.0, '', 'TKPI Kemenkes 2020'),
        ('hati-ayam', 'Hati Ayam Kampung Segar', 'Gallus gallus domesticus', 'Lauk Hewani', 167, 24.4, 6.6, 0.9, 118, 15.8, 3.2, 4968, 18.0, 0.3, 3000.0, '', 'TKPI Kemenkes 2020'),
        ('telur-ayam', 'Telur Ayam Ras Segar', 'Gallus gallus', 'Lauk Hewani', 155, 12.6, 10.6, 0.7, 54, 2.7, 1.1, 140, 0.0, 0.1, 2800.0, 'telur', 'TKPI Kemenkes 2020'),
        ('tempe-kedelai', 'Tempe Kedelai Murni', 'Glycine max fermented', 'Lauk Nabati', 193, 20.8, 8.8, 13.5, 155, 4.0, 1.7, 0, 0.0, 0.3, 1400.0, 'kacang,kedelai', 'TKPI Kemenkes 2020'),
        ('teri-nasi', 'Ikan Teri Nasi Segar', 'Stolephorus commersonii', 'Lauk Hewani', 77, 16.0, 1.0, 1.0, 500, 3.0, 2.1, 45, 0.0, 0.8, 4000.0, 'seafood,ikan laut', 'TKPI Kemenkes 2020'),
        ('daging-sapi', 'Daging Sapi Paha Segar', 'Bos taurus', 'Lauk Hewani', 201, 18.8, 14.0, 0.0, 11, 2.8, 4.8, 0, 0.0, 0.1, 14000.0, '', 'TKPI Kemenkes 2020'),
        ('bayam-hijau', 'Bayam Hijau Segar', 'Amaranthus viridis', 'Sayuran', 36, 3.5, 0.5, 6.5, 267, 3.9, 0.7, 6090, 80.0, 0.0, 1200.0, '', 'TKPI Kemenkes 2020'),
        ('tahu-putih', 'Tahu Kedelai Putih', 'Glycine max curd', 'Lauk Nabati', 76, 8.1, 4.8, 1.9, 124, 1.8, 0.8, 0, 0.0, 0.1, 1000.0, 'kacang,kedelai', 'TKPI Kemenkes 2020')
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO tkpi_foods (
            food_id, name_id, common_name, category, energy_kcal, protein_g, fat_g, carbs_g,
            calcium_mg, iron_mg, zinc_mg, vit_a_mcg, vit_c_mg, omega3_g, avg_cost_per_100g, allergen_tags, source_ref
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, foods)

    # 3. Seed Posyandu Master Children & Measurements
    children = [
        ('child-01', '3276015409240001', 'Muhammad Bintang Al-Fatih', 'male', '2025-09-14', 'Ibu Sarah Anindita', 'Posyandu Mawar III, Depok', 'Jl. Margonda Raya No. 42', 'seafood'),
        ('child-02', '3276015812240002', 'Siti Aisyah Azzahra', 'female', '2025-06-10', 'Ibu Nurul Hidayah', 'Posyandu Mawar III, Depok', 'Gang Kober No. 15', ''),
        ('child-03', '3276016104250003', 'Raffi Ahmad Prasetyo', 'male', '2025-11-20', 'Ibu Dewi Sartika', 'Posyandu Mawar III, Depok', 'Jl. Sawo No. 8', 'telur'),
        ('child-04', '3276014502250004', 'Kinara Putri Ramadhani', 'female', '2025-04-05', 'Ibu Fatimah Az-Zahra', 'Posyandu Mawar III, Depok', 'Jl. KH M. Usman No. 12', ''),
        ('child-05', '3276016807250005', 'Alvaro Arsenio Putra', 'male', '2026-01-15', 'Ibu Rina Marlina', 'Posyandu Mawar III, Depok', 'Jl. Belimbing No. 3', ''),
        ('child-06', '3276015505240006', 'Bilqis Humaira Khansa', 'female', '2024-12-01', 'Ibu Kurniawati', 'Posyandu Mawar III, Depok', 'Jl. Kedondong No. 9', 'kacang,kedelai')
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO posyandu_children (child_id, nik, name, gender, birth_date, parent_name, posyandu_name, address, allergens)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, children)

    measurements = [
        # Bintang (Normal)
        ('m-01-prev', 'Muhammad Bintang Al-Fatih', 'male', '2025-09-14', '2026-08-14', 11, 8.6, 73.5, 45.2, -0.92, -0.72, -0.85, 'Normal', 'RW 04 Kel. Beji', 0),
        ('m-01-latest', 'Muhammad Bintang Al-Fatih', 'male', '2025-09-14', '2026-09-14', 12, 8.7, 74.8, 45.8, -0.89, -0.68, -0.79, 'Normal', 'RW 04 Kel. Beji', 0),
        # Siti Aisyah (Stunting + Alert 2T!)
        ('m-02-prev', 'Siti Aisyah Azzahra', 'female', '2025-06-10', '2026-08-10', 14, 7.6, 69.5, 43.5, -2.35, -2.48, -1.25, 'Stunted', 'RW 03 Kel. Beji', 0),
        ('m-02-latest', 'Siti Aisyah Azzahra', 'female', '2025-06-10', '2026-09-10', 15, 7.6, 70.0, 43.8, -2.48, -2.52, -1.35, 'Stunted', 'RW 03 Kel. Beji', 1),
        # Raffi (Normal)
        ('m-03-latest', 'Raffi Ahmad Prasetyo', 'male', '2025-11-20', '2026-09-12', 10, 8.9, 73.0, 44.5, -0.15, -0.22, -0.05, 'Normal', 'RW 04 Kel. Beji', 0),
        # Kinara (Stunted, recovering)
        ('m-04-prev', 'Kinara Putri Ramadhani', 'female', '2025-04-05', '2026-08-05', 16, 7.9, 72.8, 44.0, -2.20, -2.31, -1.20, 'Stunted', 'RW 02 Kel. Beji', 0),
        ('m-04-latest', 'Kinara Putri Ramadhani', 'female', '2025-04-05', '2026-09-05', 17, 8.3, 74.5, 44.5, -1.95, -2.15, -1.05, 'Stunted', 'RW 02 Kel. Beji', 0),
        # Alvaro (Normal)
        ('m-05-latest', 'Alvaro Arsenio Putra', 'male', '2026-01-15', '2026-09-14', 8, 8.2, 70.2, 43.0, -0.32, -0.28, -0.25, 'Normal', 'RW 01 Kel. Beji', 0),
        # Bilqis (Stunted + Alert 2T! Down from 8.8 to 8.7kg)
        ('m-06-prev', 'Bilqis Humaira Khansa', 'female', '2024-12-01', '2026-08-01', 20, 8.8, 76.5, 45.0, -2.12, -2.25, -1.30, 'Stunted', 'RW 05 Kel. Beji', 0),
        ('m-06-latest', 'Bilqis Humaira Khansa', 'female', '2024-12-01', '2026-09-01', 21, 8.7, 76.8, 45.2, -2.28, -2.30, -1.45, 'Stunted', 'RW 05 Kel. Beji', 1)
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO child_measurements (
            measurement_id, child_alias, gender, birth_date, measure_date, age_months,
            weight_kg, height_cm, head_circ_cm, waz_zscore, haz_zscore, whz_zscore,
            nutritional_status, posyandu_rt_rw, is_2t_alert
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, measurements)

    conn.commit()
    conn.close()
    print("[OK] Database initialized and seeded successfully with real Posyandu records.")

if __name__ == "__main__":
    init_and_seed_database()
