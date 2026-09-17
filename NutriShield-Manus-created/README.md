# NutriShield v2 Sandbox

NutriShield v2 adalah prototipe full-stack terisolasi untuk pencatatan keluarga, normalisasi data pangan bertahap, agent workflow yang dapat diaudit, dan integrasi Telegram resmi melalui identity linking. Proyek ini tidak terhubung ke domain atau VPS utama.

## Struktur

- `backend/`: FastAPI, SQLite, worker agent, Telegram adapter, pipeline pangan, dan test.
- `frontend/`: React/TypeScript/Vite, landing, login, registrasi, dashboard, panduan, arsitektur, dan footer.
- `docs/ARCHITECTURE.md`: rancangan teknis dan skema domain.
- `IMPLEMENTATION_SPEC.md`: kontrak implementasi.

## Menjalankan

```bash
cd /home/ubuntu/nutrishield-v2/frontend
npm install
npm run build

cd /home/ubuntu/nutrishield-v2/backend
python3 -m pytest -q
PYTHONPATH=. python3 scripts/import_food_data.py \
  --db data/nutrishield.sqlite3 \
  --report data/food-import-report.json

cd /home/ubuntu/nutrishield-v2
./run-sandbox.sh
```

Server tersedia pada `http://127.0.0.1:8080`. Untuk sandbox publik, gunakan URL port 8080 yang disediakan lingkungan.

## Telegram

Jangan gunakan token yang pernah berada di folder Drive publik. Setelah token baru dibuat, jalankan server dengan `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_WEBHOOK_SECRET` dari secret environment. Pengguna membuat kode satu kali di dashboard lalu mengirim `/link KODE` ke bot. Tanpa token baru, UI dan API akan jujur menampilkan `Belum dikonfigurasi`.

## Batas data

Pipeline menyimpan seluruh record mentah. Dataset saat ini menghasilkan 7.809 raw record dan 7.026 canonical record. Record hanya boleh dipakai sesuai eligibility. Indeks pangan resmi yang belum memiliki nilai gizi eksplisit tidak dianggap planner-ready.

## Keselamatan

Sistem bukan alat diagnosis, terapi, atau pemberi dosis obat/suplemen. Agent tidak memiliki shell atau arbitrary code execution. Tanda bahaya dan permintaan dosis dihentikan sebelum LLM. Pengiriman eksternal memerlukan identitas tertaut dan persetujuan.
