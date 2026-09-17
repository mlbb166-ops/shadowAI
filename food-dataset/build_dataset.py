import csv
import json
import os
import subprocess
import time
from datetime import datetime, timezone

ROOT = "/home/ubuntu/food-dataset"
RAW = os.path.join(ROOT, "raw")
OUT = os.path.join(ROOT, "processed")
os.makedirs(RAW, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
FIELDS = "code,product_name,product_name_id,brands,categories_tags,ingredients_text,ingredients_text_id,nutriments,allergens_tags,labels_tags,origins_tags,countries_tags,packaging_tags,quantity,serving_size,stores,manufacturing_places,traceability_code,packaging_text"
base = "https://world.openfoodfacts.org/api/v2/search?countries_tags_en=indonesia&page_size=100&sort_by=unique_scans_n&fields=" + FIELDS
all_products, seen = [], set()

for page in range(1, 21):
    path = os.path.join(RAW, f"openfoodfacts-indonesia-page-{page:03d}.json")
    url = base + "&page=" + str(page)
    success = False
    for attempt in range(5):
        result = subprocess.run(["curl", "-A", "food-dataset-research/1.0", "-L", "--max-time", "90", "-sS", "-o", path, "-w", "%{http_code}", url], capture_output=True, text=True)
        if result.returncode == 0 and result.stdout.strip() == "200":
            success = True
            break
        time.sleep(2 + attempt * 2)
    if not success:
        print(f"stopping at page={page}; source temporarily unavailable after {len(all_products)} unique products", flush=True)
        break
    with open(path, encoding="utf-8") as handle:
        parsed = json.load(handle)
    products = parsed.get("products", [])
    if not products:
        break
    for product in products:
        code = str(product.get("code") or "").strip()
        if code and code not in seen:
            seen.add(code)
            all_products.append(product)
    print(f"page={page} products={len(products)} unique={len(all_products)}", flush=True)
    if len(products) < 100:
        break
    time.sleep(1)

source_url = "https://world.openfoodfacts.org/data"
api_url = "https://world.openfoodfacts.org/api/v2/search"
accessed = datetime.now(timezone.utc).isoformat()
rows = []
for product in all_products:
    nutriments = product.get("nutriments") or {}
    name = product.get("product_name") or product.get("product_name_id") or ""
    ingredients = product.get("ingredients_text") or product.get("ingredients_text_id") or ""
    row = {
        "record_id": "off-id-" + str(product.get("code") or "unknown"), "barcode": product.get("code") or "", "food_name": name, "food_name_id": product.get("product_name_id") or "", "brand": product.get("brands") or "", "categories": " | ".join(product.get("categories_tags") or []), "ingredients_as_label": ingredients, "allergens": " | ".join(product.get("allergens_tags") or []), "labels": " | ".join(product.get("labels_tags") or []), "origins": " | ".join(product.get("origins_tags") or []), "countries": " | ".join(product.get("countries_tags") or []), "packaging": " | ".join(product.get("packaging_tags") or []), "quantity": product.get("quantity") or "", "serving_size": product.get("serving_size") or "", "stores": product.get("stores") or "", "manufacturing_places": product.get("manufacturing_places") or "", "energy_kj_100g": nutriments.get("energy-kj_100g", ""), "energy_kcal_100g": nutriments.get("energy-kcal_100g", ""), "fat_100g": nutriments.get("fat_100g", ""), "saturated_fat_100g": nutriments.get("saturated-fat_100g", ""), "carbohydrates_100g": nutriments.get("carbohydrates_100g", ""), "sugars_100g": nutriments.get("sugars_100g", ""), "fiber_100g": nutriments.get("fiber_100g", ""), "proteins_100g": nutriments.get("proteins_100g", ""), "salt_100g": nutriments.get("salt_100g", ""), "sodium_100g": nutriments.get("sodium_100g", ""), "source_url": source_url, "source_api_url": api_url, "accessed_at": accessed, "source_type": "community-contributed product label database", "license": "Open Database License (ODbL); individual contents under Database Contents License (DbCL)", "verification_status": "source-recorded; not independently label-verified", "confidence_level": "medium"
    }
    missing = []
    if not name: missing.append("missing_product_name")
    if not ingredients: missing.append("missing_ingredients")
    if not row["brand"]: missing.append("missing_brand")
    if not any(str(row[key]).strip() for key in ("energy_kcal_100g", "fat_100g", "carbohydrates_100g", "proteins_100g")): missing.append("missing_core_nutrition")
    if not row["labels"]: missing.append("missing_labels")
    row["quality_flags"] = " | ".join(missing)
    rows.append(row)

columns = list(rows[0].keys()) if rows else []
with open(os.path.join(OUT, "indonesia_packaged_foods.csv"), "w", encoding="utf-8", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=columns); writer.writeheader(); writer.writerows(rows)
with open(os.path.join(OUT, "indonesia_packaged_foods.jsonl"), "w", encoding="utf-8") as handle:
    for row in rows: handle.write(json.dumps(row, ensure_ascii=False) + "\n")
with open(os.path.join(OUT, "indonesia_packaged_foods.json"), "w", encoding="utf-8") as handle: json.dump(rows, handle, ensure_ascii=False, indent=2)
manifest = {"dataset_name": "Indonesia packaged food labels and nutrition snapshot", "record_count": len(rows), "unique_barcodes": len(seen), "scope": "Products returned by the Open Food Facts API with countries_tags_en=indonesia, first 20 pages at page_size=100, sorted by unique_scans_n.", "retrieved_at_utc": accessed, "raw_files": sorted(os.path.relpath(os.path.join(RAW, f), ROOT) for f in os.listdir(RAW)), "processed_files": ["processed/indonesia_packaged_foods.csv", "processed/indonesia_packaged_foods.jsonl", "processed/indonesia_packaged_foods.json"], "primary_source": source_url, "api_source": api_url, "license": "Open Database License (ODbL); individual contents under Database Contents License (DbCL); read the source terms before redistribution.", "limitations": ["This is not a complete census of Indonesian food products.", "Open Food Facts is community-contributed; records are not independently verified by this package.", "A missing value is preserved as empty and flagged; no values were invented or imputed.", "The API result is a snapshot and may change; raw API responses are included for auditability.", "Organic, halal, additive, and nutrition labels are recorded only when present in the source record."]}
with open(os.path.join(ROOT, "manifest.json"), "w", encoding="utf-8") as handle: json.dump(manifest, handle, ensure_ascii=False, indent=2)
print(json.dumps({"records": len(rows), "raw_pages": len(manifest["raw_files"]), "out": OUT}, ensure_ascii=False))
