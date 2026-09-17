# NutriShield v2 — Implementation Specification

## Status and Boundary

This is an isolated sandbox prototype. It must not connect to `nutrishield.web.id`, any production VPS, or any previously exposed credential. The application must run locally with one FastAPI process serving the built React application.

The product promise is an everyday family assistant for recording child data, explaining available information, offering limited food ideas, and preparing traceable follow-up. It is not a diagnostic or treatment system.

## Canonical Stack

- Backend: Python 3.12, FastAPI, standard-library SQLite 3 in WAL mode.
- Frontend: React 18, TypeScript, Vite, CSS design tokens, lucide-react.
- Auth: email/password with PBKDF2-SHA256, opaque random session cookies stored only as SHA-256 hashes in SQLite.
- AI: server-side OpenAI-compatible Chat Completions using `OPENAI_API_KEY` and `OPENAI_API_BASE`, model `gpt-5-mini`. AI is optional and must have a deterministic fallback.
- Runtime: FastAPI serves `/api/*` and the built frontend `frontend/dist`.

## Database Domains

### Identity and privacy

`users`, `sessions`, `child_profiles`, `consents`, `channel_identities`, `channel_link_codes`.

### Family records

`measurements`, `daily_logs`.

### Hybrid food data lake

`food_sources`, `raw_food_records`, `canonical_foods`, `food_aliases`, `food_source_links`, `food_nutrients`, `food_prices`, `normalization_runs`, `normalization_issues`, and an FTS index.

The raw layer accepts broad records. The canonical layer contains normalized entities. Planner eligibility is an explicit flag and must never be inferred merely from record count.

### Agent runtime

`agent_jobs`, `agent_runs`, `agent_steps`, `agent_actions`, `schedules`, `audit_events`, `inbound_events`, `outbound_messages`.

Every real run stores a correlation ID, trigger, child ID, status, model, policy version, source version, timestamps, error, and structured output. Every step stores real start/end times, tool name, status, and JSON input/output. No synthetic latency or evidence count is permitted.

## Agent Architecture

The agent is an event-driven coordinator with allow-listed tools.

1. **Observer:** loads the authorized profile, latest measurements, consents, and prior activity.
2. **Data Quality:** checks missing values, age range, duplicate measurements, implausible values, and profile completeness.
3. **Safety Policy:** detects emergency language, allergy terms, age constraints, and unknown data. It can stop the workflow.
4. **Food Retriever:** searches only canonical records and exposes eligibility, provenance, completeness, and verification status.
5. **Planner:** selects from allow-listed actions. It cannot run shell or arbitrary Python.
6. **Family Explainer:** optionally calls `gpt-5-mini` to explain the deterministic result in simple Indonesian. It never calculates nutrition, diagnoses, or gives medication/supplement doses.
7. **Output Guard:** validates required fields and prohibited claims.
8. **Action Recorder:** writes approved internal results and audit events. External delivery requires a linked identity and consent.

### Autonomous triggers

- `child.created` automatically queues `onboarding_summary`.
- `measurement.created` automatically queues `measurement_followup`.
- `question.submitted` runs the same auditable agent pipeline.
- A background worker claims queued jobs transactionally and records every result.
- A scheduler table supports daily follow-up jobs while this sandbox server is running. The UI must state this sandbox limitation.

## Food Normalization Pipeline

Input files are read from the downloaded Drive assets. The pipeline must import:

- `processed_pipeline/food_records.csv` (6,039 mixed records),
- Panganku/IFCT index CSV (1,146 rows),
- Open Food Facts Indonesia CSV (500 rows),
- BPOM BTP reference CSV (124 rows).

Pipeline stages:

1. Register source and snapshot metadata.
2. Import raw rows unchanged with payload JSON and source record ID.
3. Normalize Unicode, whitespace, punctuation, brand, barcode, BPOM number, and name aliases.
4. Classify record type: whole-food index, packaged product, BPOM listing, traditional candidate, or additive rule.
5. Compute completeness and provenance scores.
6. Quarantine ambiguous traditional candidates and missing-name records.
7. Resolve canonical entities conservatively. Barcode and BPOM number are strong source-specific keys; normalized names are not enough to merge packaged products.
8. Populate nutrients only when explicit source values exist. Empty means unknown, never zero.
9. Mark eligibility separately for discovery, comparison, and planning.
10. Write normalization issues and summary metrics.

Expected result: all broad records remain searchable in the data lake; only a smaller quality-gated set becomes eligible for agent retrieval.

## API Contract

### Public

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/public/food-stats`
- `GET /api/public/architecture`
- `GET /api/telegram/webhook` for no operation is not required.
- `POST /api/telegram/webhook` validates `X-Telegram-Bot-Api-Secret-Token`.

### Authenticated

- `GET /api/dashboard`
- `GET /api/children`
- `POST /api/children`
- `POST /api/measurements`
- `GET /api/agents/runs`
- `GET /api/agents/jobs/{job_id}`
- `POST /api/agents/chat`
- `GET /api/foods/search?q=&limit=`
- `POST /api/telegram/link-code`
- `GET /api/telegram/status`

### Response shapes

`POST /api/auth/register` and login return `{ user }` and set an HttpOnly session cookie.

`GET /api/dashboard` returns `{ user, children, latest_runs, pending_jobs, food_stats, telegram }`.

`POST /api/agents/chat` accepts `{ child_id?, message, channel }` and returns `{ answer, run, steps, policy, evidence }`.

`GET /api/public/architecture` returns safe table metadata and the agent stages; it must never expose paths or secrets.

## Telegram

- No old token may be read from the public Drive `.env`.
- Use only `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` supplied to the new process.
- `/start` explains the service.
- `/link CODE` consumes a single-use, short-lived code generated by the authenticated website.
- Linked users use the same agent pipeline and child profile as web.
- Unlinked users receive only generic guidance and a link instruction.
- Inbound provider event IDs are deduplicated.
- Outbound delivery results are stored.

## Frontend Information Architecture

Public routes:

- `/` professional landing page.
- `/login` professional login page.
- `/register` guided registration page.
- `/panduan` visual guide for Telegram and Facebook Page/Messenger.
- `/architecture` database and agent architecture page.

Authenticated route:

- `/app` unified dashboard with onboarding, child profile form, measurement entry, auditable AI simulator, real agent timeline, Telegram linking, and food data quality summary.

The UI must be mobile-first, use plain Indonesian, visible focus states, at least 16 px body text for core tasks, and no claim of medical verification. Technical traces are hidden behind progressive disclosure.

## Professional Footer

Footer groups:

- Brand and concise product promise.
- Product links: Dashboard, Architecture, Data transparency, Bot guide.
- Support and trust: Help, privacy, terms, system status placeholders labeled as draft.
- Clear statement: prototype sandbox, not connected to the main domain, no diagnosis or medication dosage.
- Data source attribution: Panganku/TKPI index, BPOM listings, Open Food Facts with license reminder.

## Acceptance Criteria

1. Database initializes from schema and passes foreign-key checks.
2. Pipeline imports the provided datasets and emits a JSON report with counts, issues, and eligible records.
3. Register, login, logout, and protected dashboard work with real SQLite persistence.
4. Creating a child automatically queues and completes an agent job visible in the UI.
5. Adding a measurement automatically queues and completes a follow-up job.
6. The AI simulator uses the same recorded pipeline and returns deterministic fallback if the model is unavailable.
7. Telegram link code flow is implemented; live status remains unconfigured without a new token.
8. Frontend builds without TypeScript errors and is responsive.
9. Backend tests cover auth, pipeline, agent trace, and Telegram link-code behavior.
10. The app runs on `0.0.0.0:8080`, is checked locally and via the sandbox public URL.
