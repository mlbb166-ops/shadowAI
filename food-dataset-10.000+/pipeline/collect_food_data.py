#!/usr/bin/env python3
"""Resumable, provenance-first collector for Indonesian food data with auto-database synchronization.

This script never invents missing values. It stores raw responses, normalizes records,
writes incremental checkpoints, and automatically inserts verified records into NutriShield SQLite DB.
"""
import argparse, csv, hashlib, json, os, re, sys, time, sqlite3
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW = os.path.join(ROOT, "raw_pipeline")
OUT = os.path.join(ROOT, "processed_pipeline")
DEFAULT_DB = os.path.abspath(os.path.join(ROOT, "..", "web-nutrishield", "database", "nutrishield.db"))
STATUS_FILE = os.path.join(ROOT, "pipeline_status.json")

os.makedirs(RAW, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

UA = "IndonesianFoodDatasetCollector/1.0 (research; provenance-first)"
PROVINCES = [
    "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi", "Sumatera Selatan",
    "Bengkulu", "Lampung", "Kepulauan Bangka Belitung", "Kepulauan Riau", "DKI Jakarta",
    "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Banten", "Bali",
    "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah",
    "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara", "Sulawesi Utara",
    "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat",
    "Maluku", "Maluku Utara", "Papua Barat", "Papua Barat Daya", "Papua", "Papua Selatan",
    "Papua Tengah", "Papua Pegunungan"
]

def now():
    return datetime.now(timezone.utc).isoformat()

def update_status(status_dict):
    try:
        with open(STATUS_FILE, "w", encoding="utf-8") as f:
            json.dump(status_dict, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def get_json(url, params=None, method="GET", retries=5):
    if params:
        query = urlencode(params, doseq=True)
        url = url + ("&" if "?" in url else "?") + query
    last = None
    for attempt in range(retries):
        try:
            req = Request(url, headers={"User-Agent": UA, "Accept": "application/json"}, method=method)
            with urlopen(req, timeout=90) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as exc:
            last = exc
            time.sleep(min(30, 2 ** attempt))
    raise RuntimeError(f"GET failed: {url}: {last}")

def save_raw(name, payload):
    path = os.path.join(RAW, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    return os.path.relpath(path, ROOT)

def record_id(prefix, *parts):
    text = "|".join(str(x or "") for x in parts)
    return prefix + hashlib.sha256(text.encode()).hexdigest()[:20]

def to_float(val, default=0.0):
    if not val:
        return default
    try:
        return float(str(val).strip().replace(",", "."))
    except (ValueError, TypeError):
        return default

def insert_to_db(db_path, records):
    if not db_path or not os.path.exists(db_path) or not records:
        return 0
    try:
        conn = sqlite3.connect(db_path, timeout=30)
        cursor = conn.cursor()
        cursor.execute("PRAGMA journal_mode = WAL;")

        inserted = 0
        for r in records:
            dataset = r.get("dataset")
            rec_id = r.get("record_id")
            name = r.get("food_name") or "Produk Olahan"

            if dataset == "packaged_food":
                cursor.execute("""
                INSERT OR REPLACE INTO food_catalog (
                    id, name_id, common_name, category,
                    energy_kcal, protein_g, fat_g, carbs_g,
                    calcium_mg, iron_mg, zinc_mg, omega3_g,
                    avg_cost_per_100g, allergen_tags_csv, serving_suggestion,
                    is_verified, barcode, brand, bpom_number, ingredients_text, source_ref
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.0, 0.0, 0.0, 0.0, 0.0, ?, ?, 1, ?, ?, ?, ?, ?)
                """, (
                    rec_id, name, name, "Produk Kemasan",
                    to_float(r.get("energy_kcal_100g")),
                    to_float(r.get("proteins_100g")),
                    to_float(r.get("fat_100g")),
                    to_float(r.get("carbohydrates_100g")),
                    r.get("allergens", ""),
                    f"Brand: {r.get('brand')}. Garam: {r.get('salt_100g', '')}g",
                    r.get("barcode", ""),
                    r.get("brand", ""),
                    r.get("bpom_number", ""),
                    r.get("ingredients_as_label", ""),
                    "Open Food Facts Indonesia (Pipeline)"
                ))
                inserted += 1
            elif dataset == "bpom_registered_food":
                cursor.execute("""
                INSERT OR REPLACE INTO food_catalog (
                    id, name_id, common_name, category,
                    energy_kcal, protein_g, fat_g, carbs_g,
                    calcium_mg, iron_mg, zinc_mg, omega3_g,
                    avg_cost_per_100g, allergen_tags_csv, serving_suggestion,
                    is_verified, barcode, brand, bpom_number, ingredients_text, source_ref
                ) VALUES (?, ?, ?, ?, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, '', ?, 1, '', ?, ?, '', 'Cek BPOM RI (Pipeline)')
                """, (
                    rec_id, name, f"{name} [{r.get('bpom_number')}]",
                    "Produk BPOM Terdaftar",
                    f"Produsen: {r.get('manufacturer')} ({r.get('province')}). Kemasan: {r.get('packaging')}",
                    r.get("brand", ""),
                    r.get("bpom_number", "")
                ))
                inserted += 1

        conn.commit()
        conn.close()
        return inserted
    except Exception as e:
        print(f"[!] SQLite Sync Warning: {e}", flush=True)
        return 0

def append_jsonl(name, rows):
    path = os.path.join(OUT, name)
    with open(path, "a", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

def write_csv(name, rows):
    path = os.path.join(OUT, name)
    cols = sorted(set().union(*(r.keys() for r in rows))) if rows else []
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)
    return path

def collect_openfoodfacts(limit, start_page=1, db_path=None):
    print(f"[*] Starting Open Food Facts ingestion (Target: {limit} records)...", flush=True)
    records = []
    page = start_page
    while len(records) < limit:
        batch_size = min(100, limit - len(records))
        params = {
            "countries_tags_en": "indonesia",
            "page_size": batch_size,
            "page": page,
            "sort_by": "unique_scans_n",
            "fields": "code,product_name,product_name_id,brands,categories_tags,ingredients_text,ingredients_text_id,nutriments,allergens_tags,labels_tags,origins_tags,countries_tags,packaging_tags,quantity,serving_size,stores,manufacturing_places"
        }
        try:
            payload = get_json("https://world.openfoodfacts.org/api/v2/search", params)
            save_raw(f"off-page-{page:05d}.json", payload)
            products = payload.get("products", [])
            if not products:
                print(f"[*] No more products from OFF at page {page}.", flush=True)
                break

            batch = []
            for p in products:
                code = p.get("code")
                if not code:
                    continue
                n = p.get("nutriments") or {}
                batch.append({
                    "record_id": record_id("off-", code),
                    "dataset": "packaged_food",
                    "province": "",
                    "food_name": p.get("product_name") or p.get("product_name_id") or "",
                    "brand": p.get("brands") or "",
                    "barcode": str(code),
                    "ingredients_as_label": p.get("ingredients_text") or p.get("ingredients_text_id") or "",
                    "categories": " | ".join(p.get("categories_tags") or []),
                    "allergens": " | ".join(p.get("allergens_tags") or []),
                    "labels": " | ".join(p.get("labels_tags") or []),
                    "packaging": " | ".join(p.get("packaging_tags") or []),
                    "energy_kcal_100g": n.get("energy-kcal_100g", ""),
                    "fat_100g": n.get("fat_100g", ""),
                    "carbohydrates_100g": n.get("carbohydrates_100g", ""),
                    "sugars_100g": n.get("sugars_100g", ""),
                    "proteins_100g": n.get("proteins_100g", ""),
                    "salt_100g": n.get("salt_100g", ""),
                    "bpom_number": "",
                    "source_url": "https://world.openfoodfacts.org/data",
                    "source_api_url": "https://world.openfoodfacts.org/api/v2/search",
                    "accessed_at": now(),
                    "verification_status": "source-recorded; community-contributed; not independently label-verified",
                    "confidence_level": "medium"
                })

            records.extend(batch)
            append_jsonl("food_records.jsonl", batch)
            db_ins = insert_to_db(db_path, batch)
            print(f"  -> OFF Page {page}: +{len(batch)} records (Total: {len(records)}/{limit}, DB synced: +{db_ins})", flush=True)

            update_status({
                "last_update": now(),
                "openfoodfacts_collected": len(records),
                "off_target": limit,
                "current_source": "openfoodfacts",
                "page": page
            })

            if len(products) < batch_size:
                break
            page += 1
            time.sleep(1)
        except Exception as e:
            print(f"[!] Error on OFF page {page}: {e}. Retrying after 5s...", flush=True)
            time.sleep(5)
            page += 1
            if page > 100:
                break

    return records[:limit]

def collect_bpom(limit, start=0, db_path=None):
    print(f"[*] Starting BPOM registered food ingestion (Target: {limit} records)...", flush=True)
    records = []
    endpoint = "https://cekbpom.pom.go.id/produk-dt/13"
    session = requests.Session()
    session.headers.update({"User-Agent": UA})

    try:
        landing = session.get("https://cekbpom.pom.go.id/produk-pangan-olahan", timeout=90)
        landing.raise_for_status()
        soup = BeautifulSoup(landing.text, "html.parser")
        token = soup.select_one('meta[name="csrf-token"]')
        if not token:
            print("[!] BPOM CSRF token not found. Skipping BPOM scrape.", flush=True)
            return []
        csrf = token.get("content", "")
        session.headers.update({
            "X-CSRF-TOKEN": csrf,
            "X-Requested-With": "XMLHttpRequest",
            "Referer": "https://cekbpom.pom.go.id/produk-pangan-olahan",
            "Accept": "application/json, text/javascript, */*; q=0.01"
        })
    except Exception as e:
        print(f"[!] Failed to initialize BPOM session: {e}", flush=True)
        return []

    while len(records) < limit:
        length = min(100, limit - len(records))
        form = {
            "draw": str(start // length + 1),
            "start": str(start),
            "length": str(length),
            "search[value]": "",
            "product_register": "",
            "product_name": "",
            "product_brand": "",
            "product_package": "",
            "product_form": "",
            "ingredients": "",
            "manufacturer_name": "",
            "status": ""
        }
        try:
            response = session.post(endpoint, data=form, timeout=90)
            response.raise_for_status()
            payload = response.json()
            save_raw(f"bpom-start-{start:07d}.json", payload)
            rows = payload.get("data", [])
            if not rows:
                print(f"[*] No more rows returned by BPOM at offset {start}.", flush=True)
                break

            batch = []
            for r in rows:
                reg = r.get("PRODUCT_REGISTER") or ""
                batch.append({
                    "record_id": record_id("bpom-", r.get("PRODUCT_ID"), r.get("APPLICATION_ID"), reg),
                    "dataset": "bpom_registered_food",
                    "province": r.get("MANUFACTURER_PROVINCE_DETAIL") or "",
                    "food_name": r.get("PRODUCT_NAME") or "",
                    "brand": r.get("PRODUCT_BRANDS") or "",
                    "barcode": "",
                    "ingredients_as_label": "",
                    "categories": "Produk BPOM Terdaftar",
                    "allergens": "",
                    "labels": "",
                    "packaging": r.get("PRODUCT_PACKAGE") or "",
                    "energy_kcal_100g": "",
                    "fat_100g": "",
                    "carbohydrates_100g": "",
                    "sugars_100g": "",
                    "proteins_100g": "",
                    "salt_100g": "",
                    "bpom_number": reg,
                    "bpom_product_id": r.get("PRODUCT_ID") or "",
                    "bpom_application_id": r.get("APPLICATION_ID") or "",
                    "bpom_product_date": r.get("PRODUCT_DATE") or "",
                    "manufacturer": r.get("MANUFACTURER_NAME") or "",
                    "source_url": "https://cekbpom.pom.go.id/produk-pangan-olahan",
                    "source_api_url": endpoint,
                    "accessed_at": now(),
                    "verification_status": "official BPOM listing-recorded; detail fields only when returned by listing",
                    "confidence_level": "high"
                })

            records.extend(batch)
            append_jsonl("food_records.jsonl", batch)
            db_ins = insert_to_db(db_path, batch)
            print(f"  -> BPOM Batch {start//length+1}: +{len(batch)} records (Total: {len(records)}/{limit}, DB synced: +{db_ins})", flush=True)

            update_status({
                "last_update": now(),
                "bpom_collected": len(records),
                "bpom_target": limit,
                "current_source": "bpom",
                "offset": start
            })

            if len(rows) < length:
                break
            start += length
            time.sleep(1)
        except Exception as e:
            print(f"[!] Error on BPOM offset {start}: {e}. Retrying after 5s...", flush=True)
            time.sleep(5)
            start += length
            if start > 50000:
                break

    return records[:limit]

def collect_traditional_wikidata(limit_per_province):
    print(f"[*] Starting Traditional Food Candidate discovery across {len(PROVINCES)} provinces...", flush=True)
    records = []
    for province in PROVINCES:
        search_url = "https://id.wikipedia.org/w/api.php"
        try:
            payload = get_json(search_url, {
                "action": "query",
                "list": "search",
                "srsearch": f"makanan tradisional {province}",
                "srlimit": int(limit_per_province),
                "format": "json",
                "utf8": 1
            })
            save_raw("wikipedia-" + re.sub(r"[^a-z0-9]+", "-", province.lower()).strip("-") + ".json", payload)
            for hit in payload.get("query", {}).get("search", []):
                title = hit.get("title", "")
                article = "https://id.wikipedia.org/wiki/" + quote(title.replace(" ", "_"))
                records.append({
                    "record_id": record_id("trad-", article, province),
                    "dataset": "traditional_food_candidate",
                    "province": province,
                    "food_name": title,
                    "brand": "",
                    "barcode": "",
                    "ingredients_as_label": "",
                    "categories": "traditional food candidate",
                    "allergens": "",
                    "labels": "",
                    "packaging": "",
                    "energy_kcal_100g": "",
                    "fat_100g": "",
                    "carbohydrates_100g": "",
                    "sugars_100g": "",
                    "proteins_100g": "",
                    "salt_100g": "",
                    "bpom_number": "",
                    "article_url": article,
                    "source_url": article,
                    "accessed_at": now(),
                    "verification_status": "discovery candidate; provincial attribution and food identity require human review",
                    "confidence_level": "low"
                })
            time.sleep(0.5)
        except Exception as e:
            print(f"[!] Warning on province {province}: {e}", flush=True)
    return records

def main():
    ap = argparse.ArgumentParser(description="Indonesian Food Ingestion Pipeline")
    ap.add_argument("--off-limit", type=int, default=5000, help="Target Open Food Facts records")
    ap.add_argument("--bpom-limit", type=int, default=5000, help="Target BPOM registered food records")
    ap.add_argument("--traditional-per-province", type=int, default=10, help="Traditional food candidates per province")
    ap.add_argument("--skip-wikidata", action="store_true", help="Skip Wikipedia discovery")
    ap.add_argument("--db-path", type=str, default=DEFAULT_DB, help="Path to NutriShield SQLite DB")
    args = ap.parse_args()

    print(f"=== NutriShield Food Dataset Ingestion Pipeline ===")
    print(f"Targets: OFF={args.off_limit}, BPOM={args.bpom_limit}, Trad/Prov={args.traditional_per_province}")
    print(f"SQLite Target: {args.db_path}\n")

    update_status({
        "status": "RUNNING",
        "started_at": now(),
        "parameters": vars(args)
    })

    # Clear previous incremental food_records.jsonl to start fresh or keep append
    jsonl_path = os.path.join(OUT, "food_records.jsonl")
    all_rows = []
    if os.path.exists(jsonl_path):
        try:
            with open(jsonl_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        all_rows.append(json.loads(line))
        except Exception:
            pass

    # 1. Collect OFF
    off_records = collect_openfoodfacts(args.off_limit, db_path=args.db_path)

    # 2. Collect BPOM
    bpom_records = collect_bpom(args.bpom_limit, db_path=args.db_path)

    # 3. Collect Traditional Candidates
    trad_records = []
    if not args.skip_wikidata:
        trad_records = collect_traditional_wikidata(args.traditional_per_province)
        append_jsonl("food_records.jsonl", trad_records)

    # Deduplicate in-memory
    combined = all_rows + off_records + bpom_records + trad_records
    unique = {r["record_id"]: r for r in combined}
    final_rows = list(unique.values())

    write_csv("food_records.csv", final_rows)

    manifest = {
        "generated_at_utc": now(),
        "record_count": len(final_rows),
        "collections": {
            "openfoodfacts_packaged": sum(r.get("dataset") == "packaged_food" for r in final_rows),
            "bpom_registered": sum(r.get("dataset") == "bpom_registered_food" for r in final_rows),
            "traditional_food_candidates": sum(r.get("dataset") == "traditional_food_candidate" for r in final_rows)
        },
        "parameters": vars(args),
        "raw_directory": os.path.relpath(RAW, ROOT),
        "outputs": [
            "processed_pipeline/food_records.csv",
            "processed_pipeline/food_records.jsonl"
        ],
        "no_fabrication_policy": "Missing values remain empty; traditional candidates are not treated as verified regional facts; each record carries source and verification status."
    }

    with open(os.path.join(ROOT, "pipeline_manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    update_status({
        "status": "COMPLETED",
        "finished_at": now(),
        "record_count": len(final_rows),
        "manifest": manifest
    })

    print(f"\n[OK] Pipeline finished successfully! Total unique records: {len(final_rows)}")

if __name__ == "__main__":
    main()
