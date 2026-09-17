# NutriShield v2

NutriShield adalah aplikasi keluarga berbasis **React + Vite**, **FastAPI**, **SQLite**, dan worker agent otonom yang terpisah. Folder ini adalah satu-satunya implementasi runtime kanonis. `NutriShield-Manus-created` dan `nutrishield-export` di root repository adalah sumber referensi/arsip, bukan aplikasi yang dideploy.

> NutriShield membantu pencatatan keluarga dan penelusuran informasi pangan. Produk ini bukan alat diagnosis, tidak menentukan terapi, dan tidak memberikan dosis obat atau suplemen.

## Struktur

| Folder | Tanggung jawab | Framework/runtime |
| --- | --- | --- |
| `frontend/` | Landing, autentikasi, dashboard keluarga, planner template, pertumbuhan, jejak agent, kanal, dan sumber data | React 18, TypeScript, Vite, Tailwind |
| `backend/` | HTTP API, session cookie, ownership, webhook Telegram, akses database, dan static SPA serving | FastAPI, Pydantic, Uvicorn |
| `database/` | Schema tunggal, snapshot pangan tanpa PII, runtime data privat, dan arsip v1 | SQLite 3, WAL, FTS5 |
| `agents/` | Antrean persisten, orchestrator delapan tahap, worker, guardrail, adapter LLM, dan audit | Python worker terpisah |
| `deploy/` | Unit systemd, Nginx, backup, installer release, dan konfigurasi webhook | systemd, Nginx |

## Menjalankan lokal

Gunakan Python 3.11+ dan Node.js 20+. Dari folder ini:

```bash
python3 -m pip install -r backend/requirements.txt
npm ci
npm run dev
```

Frontend tersedia pada `http://localhost:3000` dan mem-proxy `/api` ke FastAPI pada `http://127.0.0.1:8080`. Pada startup pertama, snapshot publik `database/seed/nutrishield-seed.sqlite3` disalin ke database privat `database/runtime/nutrishield.sqlite3`. Database runtime diabaikan Git.

Untuk menjalankan build production melalui satu proses FastAPI:

```bash
npm run build
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8080
```

## Agent yang benar-benar berjalan

Setiap pertanyaan membuat `agent_job` dan `agent_run` dengan delapan langkah yang disimpan. Safety policy deterministik selalu berjalan sebelum model. Bahasa darurat dan permintaan dosis mem-bypass model dan menghasilkan eskalasi langsung. Jika model tidak tersedia, jawaban fallback tetap diberikan dengan label `deterministic-fallback`.

Model dikonfigurasi melalui `OPENAI_API_BASE`, `OPENAI_API_KEY`, dan `OPENAI_MODEL`. Instalasi 9Router lama dapat memakai alias `ROUTER_BASE_URL`, `ROUTER_API_KEY`, dan `DEFAULT_MODEL`. Tidak ada API key yang memiliki fallback hardcoded.

Pada development, worker dapat berjalan di proses API. Pada VPS, set `AGENT_WORKER_MODE=external`, jalankan `nutrishield-api.service` dan `nutrishield-agent.service`, lalu hanya worker eksternal yang mengambil job asinkron.

## Telegram

Telegram menggunakan webhook HTTPS dengan header secret, deduplikasi `update_id`, kode taut hashed sekali pakai yang kedaluwarsa, consent delivery, dan profil anak aktif yang eksplisit. Deep-link dashboard memakai `/start link_KODE`; perintah `/link KODE` juga didukung.

Token bot yang pernah muncul di repository atau percakapan harus dianggap bocor. Rotasi melalui BotFather, simpan token baru hanya di `/etc/nutrishield/nutrishield.env`, kemudian jalankan `deploy/configure_telegram_webhook.py`. Detail cutover ada di `deploy/README.md`.

## Verifikasi

```bash
npm test
# Dengan server production lokal sudah berjalan pada port 8080:
npm run smoke
```

Test backend mencakup auth/session hash, consent, ownership, event-triggered jobs, delapan tahap agent, blok dosis, eskalasi darurat, kode Telegram sekali pakai, deduplikasi webhook, dan pipeline raw/canonical/eligibility. Build frontend menjalankan TypeScript lalu Vite.

## Batas data pangan

Snapshot saat ini berisi 7.809 record mentah dan 7.026 entitas kanonis. Flag `discovery_eligible`, `comparison_eligible`, dan `planning_eligible` terpisah. Snapshot saat ini sengaja menghasilkan **0 record planning-eligible** karena indeks pangan resmi yang tersedia belum membawa nutrien eksplisit per record. UI tidak boleh mengubah fakta ini menjadi klaim rencana gizi tervalidasi.
