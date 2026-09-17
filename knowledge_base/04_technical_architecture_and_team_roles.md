# Knowledge Base 04: Arsitektur Teknis SHIELD & Pembagian Peran Tim Shadow AI

---

## 1. Pembagian Peran Tim Shadow AI
* **Muhammad Hisyam Alfaris (Tech & Security Lead / Fullstack Engineer):**
  - Portfolio: `aboutsyem.web.id`
  - Domain Keahlian: Cyber Security, SOC L1/L2 Engineering, DevSecOps, Linux VPS Hardening, Docker Isolation.
  - Tanggung Jawab di SHIELD: Arsitektur runtime, orkestrasi bot OpenClaw & 9Router, sistem redaksi PII, pipeline filter deterministik (Python), dan deployment VPS.
* **Salsabila Putri Halimi (Data & Impact Lead / Product Manager):**
  - Portfolio: `putrihalimi.github.io/salsabilaph_portfolioDA_landingpages/`
  - Domain Keahlian: Data Science, ETL Pipeline, SQL Analytics, Business Intelligence, Data Cleaning, Anomaly Analysis.
  - Tanggung Jawab di SHIELD: Perancangan skema data antropometri balita & ibu hamil, integrasi dataset pangan lokal TKPI Kemenkes, model evaluasi akurasi, dan perancangan Impact & Growth Ledger.

---

## 2. Arsitektur Isolasi di Lingkungan Server Cloud VPS

Server saat ini telah menjalankan stack `makarasoc` (Wazuh, MISP, Shuffle, DFIR Iris) dengan penggunaan RAM ~8.7GB dari total 11.7GB.

**Aturan Isolasi Mutlak:**
1. Agen Shadow AI diisolasi dalam direktori khusus: `~/shadow-agent/`.
2. Port terisolasi:
   - **9Router Gateway:** `127.0.0.1:20128` (Internal, tidak terekspos publik sembarangan).
   - **OpenClaw Agent Service:** Dijalankan via Node.js/Python di lingkungan venv terpisah.
   - **RAG Vector Search:** SQLite + BM25 / Faiss CPU ringan (<150MB RAM).
3. Saluran Komunikasi Terkoneksi:
   - **Discord Bot:** Untuk kolaborasi dan sesi brainstorming mendalam antara Mas Hisyam dan Mbak Salsa.
   - **Telegram Bot (via 9Router):** Untuk konsultasi dan pengujian cepat saat *mobile*.
4. **Pencegahan OOM:**
   - Batas memori maksimum untuk service Shadow Agent disetel ke 1.5 GB menggunakan cgroups / Docker limit agar tidak mengganggu stack SOC yang sedang berjalan di server.
