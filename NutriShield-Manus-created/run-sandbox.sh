#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
export NUTRISHIELD_DB_PATH="${NUTRISHIELD_DB_PATH:-$ROOT/backend/data/nutrishield.sqlite3}"
export FRONTEND_DIST="${FRONTEND_DIST:-$ROOT/frontend/dist}"
export COOKIE_SECURE="${COOKIE_SECURE:-1}"
cd "$ROOT/backend"
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8080}"
