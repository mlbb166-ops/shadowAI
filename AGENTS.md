# NutriShield Agent Guidelines & Customization System

Dokumen ini memuat standar baku operasi dan instruksi kerja agentik untuk repositori **NutriShield (Shadow AI)** yang mengadopsi 6 pedoman inti:

---

## 1. Frontend Design (Anthropic Official Skill)
- **Visual Identity:** Tampilan web tidak boleh terlalu sederhana, generik, atau menyerupai template AI biasa (*no AI slop*).
- **Palette Nusantara:** Gunakan palet berwibawa khas kesehatan nusantara: *Medical Teal* (`#0D9488`), *Midnight Slate* (`#0A0F1D`), dan *Warm Gold* (`#F59E0B`).
- **Typographic Discipline:** Gunakan *Plus Jakarta Sans* / *Inter* dengan hierarki skala tipe yang tegas, angka tabular (`font-mono`) untuk metrik klinis Z-score, dan panjang baris teks di bawah 80 karakter.
- **Informative Visual Structure:** Setiap garis batas, badge status, dan diagram (seperti *WHO Growth Gauge*) harus merepresentasikan data klinis nyata, bukan sekadar ornamen hiasan.

---

## 2. Stop Slop (Hardik Pandya Standard)
- **Eliminasi AI Tells:** Hindari pembuka bertele-tele (*throat-clearing*), formula kontras palsu (*not only... but also*), dan istilah korporat hampa (*synergy, revolutionary paradigm*).
- **Suara Manusia yang Jelas & Terpercaya:** Gunakan kalimat aktif, faktual, berbasis data laboratorium resmi **TKPI Kemenkes RI 2020** dan standar antropometri **WHO 2006 & Permenkes RI No. 2/2020**.

---

## 3. End-to-End Full Stack Integration (OpenCode Principle)
- **Konektivitas Tiga Lapis Wajib Aktif:**
  1. **Frontend:** React 18 + Vite 5 + TypeScript (`http://localhost:3000`)
  2. **Backend:** Python FastAPI REST API (`http://localhost:8000`)
  3. **Database:** SQLite 3 WAL Mode (`web-nutrishield/database/nutrishield.db`)
- Data penimbangan, kohort posyandu, dan komparasi pangan harus mengalir langsung antara antarmuka peramban, server backend, dan tabel basis data riil.

---

## 4. Ponytail (YAGNI & Implementasi Ramping)
- *"He says nothing. He writes one line. It works."*
- Bangun fitur yang diminta secara presisi tanpa lapisan abstraksi yang membengkak (*no over-engineering*).

---

## 5. Caveman & RTK (Efisiensi Token & Output Berdensitas Tinggi)
- Komunikasi ringkas, padat, dan langsung ke inti solusi (*high signal-to-noise ratio*).
- Eksekusi perintah terminal secara terarah tanpa membanjiri konteks dengan log mentah yang tidak relevan.
