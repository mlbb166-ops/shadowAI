# Knowledge Base 01: Proposal Resmi Shield (Tim Shadow)
**Sumber:** GitHub Issue #1 putrihalimi/salsabilaph_portfolioDA_landingpages
**Penulis:** Salsabila Putri Halimi (Data & Impact Lead, Tim Shadow AI)
**Kolaborator:** Muhammad Hisyam Alfaris (Tech & Security Lead, Tim Shadow AI)

---

## 1. Identitas Proyek
* **Nama Tim:** Shadow AI
* **Nama Produk:** SHIELD (Autonomous AI Assistant for Digital Safety & Stunting Prevention)
* **Kategori Kompetisi:** Digital Safety & Public Good
* **Platform Target:** Web App (nutrishield.web.id) + Multi-channel Gateway (WhatsApp Bot & Web Dashboard)
* **Infrastruktur Target:** CloudBaik Cloud VPS (4 Core CPU / 4GB RAM / 20GB SSD) — AI Hosting IDwebhost

---

## 2. Urgensi Masalah (Ancaman Ganda Keluarga Indonesia)
Keluarga di Indonesia menghadapi ancaman ganda yang mendesak:
1. **Kejahatan Siber & Disinformasi Harian:** Maraknya social engineering, APK penipuan kurir/undangan, pinjol ilegal, dan misinformasi kesehatan/gizi di grup keluarga.
2. **Krisis Gizi Kronis (Stunting):** 1 dari 5 anak Indonesia masih terancam stunting akibat rendahnya literasi gizi 1.000 Hari Pertama Kehidupan (HPK), ketidakmampuan memilah alergi klinis, serta stigma bahwa "makan sehat itu mahal".

**Celah Pendekatan Lama:**
Solusi publik konvensional bersifat *pukul rata (one-size-fits-all)* dan mengabaikan kondisi unik keluarga rentan (alergi anak, penyakit bawaan ibu, keterbatasan ekonomi, akses faskes BPJS/KIS).

---

## 3. Pilar Inovasi Utama SHIELD

### A. Deterministic Rule-Based Guardrail (Zero Medical Hallucination)
* **Prinsip Utama:** AI Generatif (LLM) **TIDAK BOLEH** mendiagnosis penyakit atau meracik resep secara bebas tanpa pengawasan kode logika pasti (*hard filter*).
* **Mekanisme:** 
  - Jika profil anak mencatat `Alergi: Telur`, sistem deterministik memblokir mutlak semua rekomendasi berbahan telur dari database lokal sebelum menyentuh LLM.
  - LLM (Nemotron lokal) hanya berperan sebagai *friendly conversational translator* yang menyajikan data rujukan medis tervalidasi ke bahasa yang hangat dan mudah dipahami ibu/kader Posyandu.

### B. Optimalisasi Pangan Lokal Nusantara (Superior & Terjangkau)
* Mematahkan stigma bahwa gizi tinggi harus salmon, quinoa, atau susu formula impor mahal.
* Pangan lokal unggulan berbiaya sangat terjangkau:
  - **Ikan Kembung:** Kandungan Omega-3 (asam lemak esensial DHA/EPA) 2,2g per 100g — **lebih tinggi daripada ikan salmon (1,4g)** dengan harga 1/5-nya.
  - **Daun Kelor (*Moringa oleifera*):** Kaya zat besi, kalsium nabati, dan vitamin A untuk mencegah anemia pada ibu hamil dan balita.
  - **Jambu Biji Merah:** Sumber Vitamin C alami tertinggi untuk mempercepat penyerapan zat besi.
  - **Pepaya & Pisang Lokal:** Sumber serat prebiotik dan kalium ramah pencernaan anak.

### C. Personalized Onboarding Klinis
Pengguna atau kader Posyandu menginput data dasar:
* Golongan darah, Berat Badan (BB), Tinggi Badan (TB)
* Tekanan darah & riwayat penyakit kronis keluarga
* Riwayat alergi spesifik (makanan, obat)
* Status jaminan kesehatan (BPJS Kesehatan PBI/Non-PBI, KIS, Umum)

### D. Navigator Faskes & Bansos Terintegrasi
* Rekomendasi rujukan Fasilitas Kesehatan Tingkat Pertama (FKTP / Puskesmas / Bidan Desa) terdekat sesuai faskes terdaftar di BPJS.
* Informasi panduan akses bantuan sosial gizi (Program Makan Bergizi Gratis / MBG, PKH, PMT Posyandu).

### E. Habit Tracker & Dynamic Monitoring
* Checklist pemantauan harian: Asupan protein hewani lokal, jadwal berjemur pagi 10–15 menit (sintesis Vitamin D3 alami untuk penyerapan kalsium tulang), konsumsi air bersih, dan stimulasi motorik.
* Grafik tren kurva antropometri BB/TB berkala berbasis standar KMS / WHO Z-score.

---

## 4. Keselarasan Strategis dengan Kebijakan Nasional
1. **Program Makan Bergizi Gratis (MBG):** MBG bergerak di kebijakan makro dan distribusi fisik, sementara SHIELD menjadi *digital public good* di tingkat mikro keluarga untuk memastikan menu harian dan alergi termonitor secara presisi.
2. **Kemenkes SatuSehat & Buku KIA:** Mengadopsi standar 1.000 HPK dan panduan gizi seimbang Kemenkes RI.
3. **Strategi Distribusi B2B2C:** Menggandeng Kader Posyandu, Bidan Desa, dan Puskesmas sebagai agen penggerak di lapangan agar adopsi meluas dan menyentuh masyarakat akar rumput.
