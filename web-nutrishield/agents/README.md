# Autonomous agent package

Folder ini adalah runtime agent otonom NutriShield yang terpisah dari HTTP API. `orchestrator.py` memproses antrean persisten SQLite melalui delapan tahap allow-listed: observer, pemeriksaan kualitas data, kebijakan keselamatan, retrieval pangan, pemilihan aksi, penjelasan keluarga, output guard, dan pencatatan aksi. Tidak ada shell tool atau eksekusi kode arbitrer.

`worker.py` menjalankan antrean dan jadwal secara persisten. Untuk VPS, gunakan unit `deploy/nutrishield-agent.service` dan set `AGENT_WORKER_MODE=external` pada API agar tidak ada dua worker. Job yang tertinggal dalam status `running` dipulihkan setelah lease lima menit, sampai batas tiga percobaan.

Model bahasa bersifat opsional dan hanya menulis ulang fallback deterministik. Konteks yang dikirim dibatasi pada teks fallback dan nama evidence; trace database meredaksi field sensitif. Jika provider gagal atau tidak dikonfigurasi, sistem memakai jawaban deterministik dan mencatat model `deterministic-fallback`.
