#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

cleanup() {
  trap - EXIT INT TERM
  kill "${API_PID:-}" "${WEB_PID:-}" 2>/dev/null || true
  wait "${API_PID:-}" "${WEB_PID:-}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8080 --reload &
API_PID=$!
npm run dev --workspace=frontend -- --host 0.0.0.0 --port 3000 &
WEB_PID=$!

wait -n "$API_PID" "$WEB_PID"
