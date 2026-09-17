# NutriShield — Manus-created export

Exported at: 2026-09-16T13:48:31+00:00

This ZIP contains the isolated NutriShield v2 sandbox work-in-progress:

- `frontend/`: React + TypeScript + Vite source and production `dist/` build.
- `backend/`: FastAPI, SQLite schema, agent coordinator, worker, Telegram adapter, tests, and food pipeline.
- `backend/data/`: sanitized SQLite snapshot and food import report. The database is intended for local sandbox review.
- `docs/`: architecture documentation.
- `IMPLEMENTATION_SPEC.md`: implementation contract.
- `README.md`: setup and operational notes.
- `run-sandbox.sh`: local startup script.

Excluded intentionally:

- `node_modules`, Python caches, build caches, and virtual environments.
- `.env` files, API keys, Telegram tokens, OAuth credentials, and private key files.
- Temporary smoke-test accounts and browser verification accounts.

The project is a sandbox prototype. It is not connected to the NutriShield production domain. The AI integration is server-side and optional through environment variables; without credentials the deterministic safety-bounded fallback remains available.
