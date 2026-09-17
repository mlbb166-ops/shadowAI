# VPS deployment

Deployment production memakai **Nginx → FastAPI** pada `127.0.0.1:8080` dan **worker agent** sebagai unit systemd terpisah. Database runtime berada di `/var/lib/nutrishield`; source release berada di `/opt/nutrishield/releases`; secret berada di `/etc/nutrishield/nutrishield.env` dengan mode `0640` atau lebih ketat.

## Cutover

Sebelum deploy, rotasi token Telegram, API key LLM/router, dan credential SSH yang pernah tercatat di repository lama. Salin `.env.example` ke `/etc/nutrishield/nutrishield.env`, isi hanya secret baru, ubah `NUTRISHIELD_DB_PATH=/var/lib/nutrishield/nutrishield.sqlite3`, dan pastikan `COOKIE_SECURE=1`. Jangan menaruh `.env` di checkout Git.

Jalankan backup konsisten atas database aktif, lalu jalankan installer dari checkout baru:

```bash
sudo bash web-nutrishield/deploy/backup_database.sh
sudo bash web-nutrishield/deploy/install_vps.sh /path/to/checkout/web-nutrishield
```

Pasang `nginx-nutrishield.conf` setelah lokasi sertifikat TLS diisi, validasi dengan `nginx -t`, lalu reload Nginx. Setelah HTTPS dan API sehat, muat environment dan daftarkan webhook:

```bash
set -a
. /etc/nutrishield/nutrishield.env
set +a
/opt/nutrishield/venv/bin/python /opt/nutrishield/current/web-nutrishield/deploy/configure_telegram_webhook.py
```

Verifikasi `GET /api/health`, registrasi akun uji, pembuatan profil, pengukuran, agent chat delapan tahap, pencarian pangan, kode Telegram, serta `getWebhookInfo`. Installer mempertahankan symlink release sebelumnya dan mengembalikannya otomatis bila health check lokal gagal.

> Script ini tidak mengimpor database v1 yang memiliki schema dan autentikasi tidak kompatibel. File lama harus dibackup dan dipertahankan read-only. Migrasi data keluarga memerlukan pemetaan pemilik dan persetujuan eksplisit; jangan menyalinnya otomatis ke schema v2.
