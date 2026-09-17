# NutriShield v2 Backend

Backend ini adalah prototipe sandbox **FastAPI + SQLite standard library** untuk pencatatan keluarga, pencarian pangan dengan provenance, agent workflow yang dapat diaudit, dan penghubung Telegram. Sistem ini **bukan alat diagnosis, terapi, atau pemberi dosis obat/suplemen**.

## Prasyarat

Gunakan Python 3.12. Tidak ada file `.env` yang dibaca otomatis dan backend tidak membaca credential lama dari Drive.

```bash
cd /home/ubuntu/nutrishield-v2/backend
python3.12 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
```

## Inisialisasi dan import data nyata

```bash
cd /home/ubuntu/nutrishield-v2/backend
PYTHONPATH=. python3.12 scripts/init_db.py --db data/nutrishield.sqlite3
PYTHONPATH=. python3.12 scripts/import_food_data.py \
  --db data/nutrishield.sqlite3 \
  --report data/food-import-report.json
```

Pipeline membaca empat snapshot yang diminta:

1. `food-dataset-10.000+/processed_pipeline/food_records.csv`;
2. `food-dataset/processed/panganku_ifct_foods.csv`;
3. `food-dataset/processed/indonesia_packaged_foods.csv`;
4. `food-dataset-10.000+/processed_pipeline/btp_bpom_11_2019.csv`.

Payload raw pangan dipertahankan sebagai JSON. Canonical entity di-resolve secara konservatif. Nilai kosong tetap **unknown**, bukan nol. Eligibility discovery, comparison, dan planning adalah flag terpisah. Indeks nama pangan tanpa angka gizi eksplisit hanya dipakai untuk discovery dan **tidak** dianggap planner-ready. Kandidat tradisional ambigu dan record tanpa nama dicatat di `normalization_issues`; laporan run ditulis ke JSON.

## Menjalankan aplikasi

```bash
cd /home/ubuntu/nutrishield-v2/backend
export NUTRISHIELD_DB_PATH="$PWD/data/nutrishield.sqlite3"
python3.12 -m uvicorn app.main:app --host 0.0.0.0 --port 8080
```

FastAPI menyajikan `/api/*`. Jika `../frontend/dist` tersedia, route lain menyajikan React SPA. Dokumentasi OpenAPI tersedia di `/api/docs`; health check di `/api/health`.

Worker event-driven berjalan in-process bersama server. Alternatif satu proses worker terpisah:

```bash
PYTHONPATH=. python3.12 -m app.worker --db data/nutrishield.sqlite3
# atau proses antrean lalu keluar
PYTHONPATH=. python3.12 -m app.worker --db data/nutrishield.sqlite3 --once
```

Jangan menjalankan worker in-process dan worker terpisah bila tidak diperlukan. Claim job menggunakan transaksi `BEGIN IMMEDIATE`, sehingga satu job tidak diproses dua worker. Scheduler hanya aktif selama proses sandbox hidup.

## Environment opsional

| Variable | Kegunaan | Default |
|---|---|---|
| `NUTRISHIELD_DB_PATH` | Lokasi database SQLite | `backend/data/nutrishield.sqlite3` |
| `ALLOWED_ORIGINS` | Origin CORS dipisah koma | localhost/127.0.0.1 port 5173 dan 8080 |
| `COOKIE_SECURE` | Gunakan `1` pada HTTPS | `0` untuk localhost sandbox |
| `OPENAI_API_KEY` | Mengaktifkan explainer OpenAI-compatible | tidak aktif |
| `OPENAI_API_BASE` | Base URL API Chat Completions | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Model explainer | `gpt-5-mini` |
| `TELEGRAM_BOT_TOKEN` | Pengiriman pesan Telegram baru | tidak aktif |
| `TELEGRAM_WEBHOOK_SECRET` | Verifikasi header webhook Telegram | tidak aktif |
| `FRONTEND_DIST` | Direktori build React | `../frontend/dist` |

Credential hanya diambil dari environment proses; jangan menyalin atau memublikasikan `.env`. Bila OpenAI tidak tersedia, workflow menggunakan fallback deterministik. Aplikasi tidak memiliki tool shell atau arbitrary Python/code execution.

## Pengujian

```bash
cd /home/ubuntu/nutrishield-v2/backend
python3.12 -m pytest -q
python3.12 -m compileall -q app scripts tests
```

Test suite mencakup register/login/logout dan hash session opaque, job otomatis `child.created`, job `measurement.created`, trace chat delapan tahap dan policy block, link code sekali pakai, deduplikasi webhook/outbound persistence, serta pipeline raw/canonical/eligibility/issues.

## Catatan keamanan dan operasional

Password menggunakan PBKDF2-HMAC-SHA256 dengan salt acak dan 310.000 iterasi. Registrasi mewajibkan persetujuan pemrosesan data yang eksplisit. Cookie session bersifat opaque dan hanya SHA-256 hash token yang disimpan. Cookie `HttpOnly`, `SameSite=Strict`, dan dapat dipaksa `Secure` dengan `COOKIE_SECURE=1`. SQLite menggunakan WAL, foreign keys, busy timeout, transaksi atomik, constraint, dan ownership triggers. Public architecture endpoint hanya mengungkap metadata aman. Agent trace menyimpan metadata eksekusi yang telah direduksi/redaksi, bukan identitas keluarga atau isi pertanyaan mentah.

Telegram webhook adalah `POST /api/telegram/webhook` dan wajib membawa `X-Telegram-Bot-Api-Secret-Token`. Update ID dideduplikasi. `/link CODE` memakai kode acak sekali pakai selama 10 menit. Hasil outbound selalu dipersistenkan, termasuk status `skipped_unconfigured` bila token belum ada.
