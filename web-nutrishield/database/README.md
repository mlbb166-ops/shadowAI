# Database

`schema.sql` adalah sumber tunggal skema SQLite v2. `seed/nutrishield-seed.sqlite3` hanya berisi snapshot pangan yang dapat direproduksi: tidak ada pengguna, profil anak, pengukuran, atau agent run. Pada startup pertama backend menyalin seed ini secara atomik ke path runtime.

Database pengguna harus berada di `runtime/` atau `/var/lib/nutrishield/`; pola tersebut diabaikan Git. File `legacy/nutrishield-v1.db` dipertahankan hanya sebagai arsip migrasi lokal dan tidak dibuka oleh aplikasi v2. Backup produksi wajib mengenkripsi database runtime beserta file WAL/SHM secara konsisten.

Pipeline normalisasi dapat dijalankan dari root `web-nutrishield` dengan `npm run db:import`. Record mentah, entitas kanonis, nilai nutrien, isu kualitas, dan flag eligibility disimpan terpisah agar sistem tidak menyamakan keberadaan nama pangan dengan kelayakan perencanaan.
