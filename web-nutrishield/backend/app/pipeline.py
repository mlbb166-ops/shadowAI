from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from .config import REPO_DIR
from .db import initialize_database, transaction
from .security import new_id

POLICY_VERSION = "food-normalization-v2"
DATASET_LARGE = REPO_DIR / "food-dataset-10.000+"
DATASET_BASE = REPO_DIR / "food-dataset"
INPUTS = (
    ("mixed-v2", DATASET_LARGE / "processed_pipeline/food_records.csv", "Hybrid food data snapshot", "mixed", None, None),
    ("panganku-ifct", DATASET_BASE / "processed/panganku_ifct_foods.csv", "Panganku / IFCT index", "official-index", "https://www.panganku.org/en-EN/semua_nutrisi", None),
    ("open-food-facts-id", DATASET_BASE / "processed/indonesia_packaged_foods.csv", "Open Food Facts Indonesia", "community-label", "https://world.openfoodfacts.org/data", "ODbL / DbCL; verify terms before redistribution"),
    ("bpom-btp-11-2019", DATASET_LARGE / "processed_pipeline/btp_bpom_11_2019.csv", "BPOM BTP reference", "official-regulation", "https://jdih.pom.go.id", None),
)
NUTRIENTS = {
    "energy_kcal_100g": ("energy_kcal", "kcal"),
    "fat_100g": ("fat", "g"),
    "saturated_fat_100g": ("saturated_fat", "g"),
    "carbohydrates_100g": ("carbohydrate", "g"),
    "sugars_100g": ("sugars", "g"),
    "fiber_100g": ("fiber", "g"),
    "proteins_100g": ("protein", "g"),
    "salt_100g": ("salt", "g"),
    "sodium_100g": ("sodium", "g"),
}


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def normalize_text(value: Any) -> str:
    text = unicodedata.normalize("NFKC", str(value or ""))
    text = re.sub(r"[\u0000-\u001f\u007f]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_name(value: Any) -> str:
    text = normalize_text(value).casefold()
    text = re.sub(r"[^\w\s-]", " ", text, flags=re.UNICODE)
    return re.sub(r"[\s_-]+", " ", text).strip()


def digits(value: Any) -> str | None:
    out = re.sub(r"\D", "", str(value or ""))
    return out or None


def classify(row: dict[str, str], source_key: str) -> str:
    dataset = normalize_text(row.get("dataset")).casefold()
    if source_key == "panganku-ifct":
        return "whole_food_index"
    if source_key == "open-food-facts-id" or dataset == "packaged_food":
        return "packaged_product"
    if source_key == "bpom-btp-11-2019" or dataset == "btp_regulation":
        return "additive_rule"
    if dataset == "bpom_registered_food":
        return "bpom_listing"
    if dataset == "traditional_food_candidate":
        return "traditional_candidate"
    return "unknown"


def record_name(row: dict[str, str], record_type: str) -> str:
    if record_type == "whole_food_index":
        return normalize_text(row.get("Food Name"))
    if record_type == "additive_rule":
        return normalize_text(row.get("btp_name_raw"))
    return normalize_text(row.get("food_name") or row.get("food_name_id"))


def source_id_for(row: dict[str, str], index: int) -> str:
    return normalize_text(row.get("record_id") or row.get("Food Code") or row.get("barcode") or index)


def scores_and_eligibility(row: dict[str, str], record_type: str, name: str) -> tuple[float, float, bool, bool, bool, bool]:
    verification = normalize_text(row.get("verification_status")).casefold()
    confidence = normalize_text(row.get("confidence_level")).casefold()
    provenance = {"high": 0.95, "medium": 0.72, "low": 0.35}.get(confidence, 0.45)
    if "official" in verification:
        provenance = max(provenance, 0.92)
    possible = [name, row.get("brand"), row.get("barcode"), row.get("bpom_number"), row.get("source_url"), row.get("ingredients_as_label")]
    completeness = round(sum(bool(normalize_text(x)) for x in possible) / len(possible), 4)
    missing = not bool(name)
    quarantine = missing or record_type in {"traditional_candidate", "unknown"}
    discovery = not missing and record_type != "unknown"
    required_comparison = ("energy_kcal_100g", "proteins_100g", "fat_100g", "carbohydrates_100g")
    has_comparison_nutrients = all(normalize_text(row.get(k)) for k in required_comparison)
    has_any_nutrient = any(normalize_text(row.get(k)) for k in NUTRIENTS)
    comparison = record_type == "packaged_product" and bool(digits(row.get("barcode"))) and has_comparison_nutrients
    # An official name index is useful for discovery but is not planning evidence without explicit nutrients.
    planning = record_type == "whole_food_index" and provenance >= 0.9 and has_any_nutrient and not quarantine
    return provenance, completeness, discovery, comparison, planning, quarantine


def canonical_key(source_key: str, source_record_id: str, row: dict[str, str], record_type: str) -> str:
    barcode = digits(row.get("barcode"))
    bpom = normalize_name(row.get("bpom_number"))
    official_code = normalize_name(row.get("Food Code"))
    if record_type == "packaged_product" and barcode:
        return f"barcode:{barcode}"
    if record_type == "bpom_listing" and bpom:
        return f"bpom:{bpom}"
    if record_type == "whole_food_index" and official_code:
        return f"ifct:{official_code}"
    return f"{source_key}:{normalize_name(source_record_id)}"


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def import_food_data(db_path: Path | str, report_path: Path | str | None = None, inputs=INPUTS) -> dict[str, Any]:
    initialize_database(db_path)
    run_id = new_id("norm")
    started = now()
    manifests = []
    for source_key, path, *_ in inputs:
        if not Path(path).is_file():
            raise FileNotFoundError(f"Input dataset tidak ditemukan: {path}")
        manifests.append({"source_key": source_key, "file": Path(path).name, "sha256": _sha256_file(Path(path)), "bytes": Path(path).stat().st_size})

    with transaction(db_path, immediate=True) as conn:
        conn.execute(
            "INSERT INTO normalization_runs(id,started_at,policy_version,status,input_manifest_json) VALUES(?,?,?,?,?)",
            (run_id, started, POLICY_VERSION, "running", _json(manifests)),
        )
        # A rerun is a new audited normalization run and a clean current snapshot.
        conn.execute("DELETE FROM food_nutrients")
        conn.execute("DELETE FROM food_aliases")
        conn.execute("DELETE FROM food_source_links")
        conn.execute("DELETE FROM canonical_foods")
        conn.execute("DELETE FROM raw_food_records")
        conn.execute("DELETE FROM food_sources")

    metrics: dict[str, Any] = {"run_id": run_id, "policy_version": POLICY_VERSION, "started_at": started, "sources": {}, "counts": Counter(), "issues": Counter()}
    try:
        with transaction(db_path, immediate=True) as conn:
            for source_key, input_path, display_name, source_type, source_url, license_text in inputs:
                path = Path(input_path)
                source_cur = conn.execute(
                    "INSERT INTO food_sources(source_key,name,source_type,source_url,license,snapshot_path,snapshot_sha256,snapshot_bytes,imported_at,record_count) VALUES(?,?,?,?,?,?,?,?,?,0)",
                    (source_key, display_name, source_type, source_url, license_text, path.name, _sha256_file(path), path.stat().st_size, now()),
                )
                source_db_id = source_cur.lastrowid
                source_count = 0
                with path.open("r", encoding="utf-8-sig", newline="") as handle:
                    for index, row in enumerate(csv.DictReader(handle), start=1):
                        source_count += 1
                        metrics["counts"]["raw_records"] += 1
                        payload = _json(row)
                        rid = source_id_for(row, index)
                        rtype = classify(row, source_key)
                        name = record_name(row, rtype)
                        raw_cur = conn.execute(
                            "INSERT INTO raw_food_records(source_id,normalization_run_id,source_record_id,record_type,payload_json,payload_sha256,imported_at) VALUES(?,?,?,?,?,?,?)",
                            (source_db_id, run_id, rid, rtype, payload, hashlib.sha256(payload.encode()).hexdigest(), now()),
                        )
                        raw_id = raw_cur.lastrowid
                        provenance, completeness, discovery, comparison, planning, quarantine = scores_and_eligibility(row, rtype, name)
                        issue_rows: list[tuple[str, str, str | None, str, dict]] = []
                        if not name:
                            issue_rows.append(("missing_name", "error", "name", "Record quarantined because its name is missing.", {}))
                        if rtype == "traditional_candidate":
                            issue_rows.append(("ambiguous_traditional_candidate", "warning", "food_name", "Traditional candidate requires human identity and province review.", {}))
                        if rtype == "unknown":
                            issue_rows.append(("unknown_record_type", "error", "dataset", "Record type could not be classified.", {}))
                        if rtype == "whole_food_index" and not any(normalize_text(row.get(k)) for k in NUTRIENTS):
                            issue_rows.append(("missing_planner_nutrition", "warning", "nutrients", "Official food index has no explicit nutrients in this snapshot and is not planning eligible.", {}))
                        if rtype == "packaged_product" and not digits(row.get("barcode")):
                            issue_rows.append(("missing_barcode", "warning", "barcode", "Packaged product has no stable barcode and is not comparison eligible.", {}))
                        for code, severity, field, message, details in issue_rows:
                            conn.execute(
                                "INSERT INTO normalization_issues(normalization_run_id,raw_food_record_id,issue_code,severity,field_name,message,details_json,created_at) VALUES(?,?,?,?,?,?,?,?)",
                                (run_id, raw_id, code, severity, field, message, _json(details), now()),
                            )
                            metrics["issues"][code] += 1
                        if not name:
                            continue

                        key = canonical_key(source_key, rid, row, rtype)
                        normalized = normalize_name(name)
                        brand = normalize_text(row.get("brand")) or None
                        barcode = digits(row.get("barcode"))
                        bpom = normalize_text(row.get("bpom_number")) or None
                        verification = normalize_text(row.get("verification_status")) or "unknown"
                        existing = conn.execute("SELECT id FROM canonical_foods WHERE canonical_key=?", (key,)).fetchone()
                        if existing:
                            canonical_id = existing["id"]
                            match_method = "barcode" if barcode else "bpom_number" if bpom else "source_key"
                        else:
                            cur = conn.execute(
                                "INSERT INTO canonical_foods(canonical_key,name,normalized_name,brand,barcode,bpom_number,record_type,verification_status,provenance_score,completeness_score,discovery_eligible,comparison_eligible,planning_eligible,quarantined,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                                (key, name, normalized, brand, barcode, bpom, rtype, verification, provenance, completeness, int(discovery), int(comparison), int(planning), int(quarantine), now(), now()),
                            )
                            canonical_id = cur.lastrowid
                            metrics["counts"]["canonical_records"] += 1
                            metrics["counts"][f"type_{rtype}"] += 1
                            metrics["counts"]["discovery_eligible"] += int(discovery)
                            metrics["counts"]["comparison_eligible"] += int(comparison)
                            metrics["counts"]["planning_eligible"] += int(planning)
                            metrics["counts"]["quarantined"] += int(quarantine)
                        conn.execute(
                            "INSERT INTO food_source_links(canonical_food_id,raw_food_record_id,match_method,match_confidence) VALUES(?,?,?,?)",
                            (
                                canonical_id,
                                raw_id,
                                "official_code" if rtype == "whole_food_index" else "barcode" if barcode else "bpom_number" if bpom else "standalone",
                                1.0 if (rtype == "whole_food_index" and normalize_text(row.get("Food Code"))) or barcode or bpom else 0.7,
                            ),
                        )
                        aliases = {name, normalize_text(row.get("food_name_id"))}
                        for alias in aliases:
                            if alias:
                                conn.execute("INSERT OR IGNORE INTO food_aliases(canonical_food_id,alias,normalized_alias,language) VALUES(?,?,?,?)", (canonical_id, alias, normalize_name(alias), "id"))
                        for field, (nutrient_key, unit) in NUTRIENTS.items():
                            raw_value = normalize_text(row.get(field))
                            if not raw_value:
                                continue
                            try:
                                amount = float(raw_value.replace(",", "."))
                                if amount < 0:
                                    raise ValueError
                            except ValueError:
                                conn.execute("INSERT INTO normalization_issues(normalization_run_id,raw_food_record_id,issue_code,severity,field_name,message,details_json,created_at) VALUES(?,?,?,?,?,?,?,?)", (run_id, raw_id, "invalid_nutrient", "warning", field, "Explicit nutrient value is not a non-negative number.", _json({"value": raw_value}), now()))
                                metrics["issues"]["invalid_nutrient"] += 1
                                continue
                            conn.execute("INSERT OR IGNORE INTO food_nutrients(canonical_food_id,nutrient_key,amount,unit,basis,source_raw_id) VALUES(?,?,?,?,?,?)", (canonical_id, nutrient_key, amount, unit, "100g", raw_id))
                            metrics["counts"]["nutrient_values"] += 1
                conn.execute("UPDATE food_sources SET record_count=? WHERE id=?", (source_count, source_db_id))
                metrics["sources"][source_key] = {"file": path.name, "rows": source_count, "sha256": _sha256_file(path)}
            # External-content FTS needs a rebuild so aliases can be aggregated by the query layer.
            conn.execute("DELETE FROM food_search_fts")
            conn.execute("INSERT INTO food_search_fts(rowid,name,aliases,brand) SELECT c.id,c.name,coalesce((SELECT group_concat(a.alias, ' ') FROM food_aliases a WHERE a.canonical_food_id=c.id),''),coalesce(c.brand,'') FROM canonical_foods c")
            metrics["completed_at"] = now()
            for metric_key in (
                "raw_records", "canonical_records", "discovery_eligible",
                "comparison_eligible", "planning_eligible", "quarantined",
                "nutrient_values",
            ):
                metrics["counts"][metric_key] += 0
            metrics["counts"] = dict(metrics["counts"])
            metrics["issues"] = dict(metrics["issues"])
            conn.execute("UPDATE normalization_runs SET completed_at=?,status='completed',report_json=? WHERE id=?", (metrics["completed_at"], _json(metrics), run_id))
    except Exception as exc:
        with transaction(db_path, immediate=True) as conn:
            conn.execute("UPDATE normalization_runs SET completed_at=?,status='failed',error=? WHERE id=?", (now(), str(exc)[:2000], run_id))
        raise

    if report_path:
        out = Path(report_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(metrics, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Import and normalize NutriShield food datasets")
    parser.add_argument("--db", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()
    report = import_food_data(args.db, args.report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
