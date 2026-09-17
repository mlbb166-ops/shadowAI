# Knowledge Base 02: Standar Medis Kemenkes, Matriks Alergen & Pangan Nusantara
**Sumber Standar:** Kementerian Kesehatan RI (Buku KIA, Pedoman Pencegahan Stunting, TKPI Kemenkes RI, WHO Multicentre Growth Reference Study)

---

## 1. Aturan Logika Deterministik Medis (Hard-Coded Filter)

Dalam arsitektur SHIELD, pantangan medis dan alergen dieksekusi secara deterministik sebelum teks diteruskan ke AI:

```
IF user.profile.allergies CONTAINS "telur":
    BLOCK recipes WHERE ingredients CONTAINS ["telur", "mayones", "kue telur"]
    FLAG warning: "Menu mengandung telur telah disaring secara otomatis demi keselamatan klinis anak."

IF user.profile.allergies CONTAINS "seafood" OR "ikan":
    SUBSTITUTE ikan_kembung WITH [hati_ayam_kampung, tahu, tempe, daging_unggas]
    FLAG warning: "Substitusi protein hewani non-seafood diaktifkan."

IF user.profile.conditions CONTAINS "hipertensi_kehamilan" (Preeklamsia):
    HARD_LIMIT sodium < 1500mg/hari
    BLOCK makanan_asin_olahan, ikan_asin
```

---

## 2. Komparasi Nilai Gizi Pangan Lokal vs Impor (Per 100 Gram)

| Komponen Gizi | Ikan Kembung Lokal | Ikan Salmon Impor | Daun Kelor Segar | Bayam Impor / Biasa |
|---|---|---|---|---|
| **Omega-3 (DHA/EPA)** | **2,2 g** | 1,4 g | - | - |
| **Protein** | **21,3 g** | 19,8 g | **6,7 g** | 2,9 g |
| **Zat Besi (Fe)** | **2,0 mg** | 0,8 mg | **7,0 mg** (3x bayam) | 2,7 mg |
| **Kalsium (Ca)** | **136 mg** | 12 mg | **440 mg** | 99 mg |
| **Estimasi Harga/kg** | **Rp 35.000 - Rp 45.000** | Rp 250.000 - Rp 350.000 | **Rp 5.000 (pekarangan)** | Rp 20.000 |

*Insight untuk Brainstorming & Dewan Juri:*
Ikan kembung mengandung lemak tak jenuh ganda esensial (DHA) yang sangat krusial bagi pembentukan mielin saraf otak janin dan balita. Menolak hegemoni salmon mahal adalah bukti keberpihakan pada *sovereignty* dan *public good*.

---

## 3. Protokol Sinar Matahari Pagi (Sintesis Vitamin D3)
* **Durasi Optimal:** 10 – 15 menit, dilakukan antara pukul 08:30 – 10:00 WIB.
* **Area Terpapar:** Lengan dan tungkai terbuka (tanpa tabir surya tebal selama 15 menit pertama).
* **Fungsi Biologis:** Paparan sinar UV-B merangsang 7-dehidrokolesterol di epidermis kulit menjadi pre-vitamin D3, yang kemudian dihidroksilasi di hepar dan ginjal menjadi kalsitriol (1,25-(OH)2D3) guna memfasilitasi absorpsi kalsium di usus halus dan kalsifikasi tulang/gigi balita.

---

## 4. Standar Medical Disclaimer Wajib (Sesuai Regulasi IDI & Kemenkes)
Setiap interaksi AI di SHIELD wajib menyertakan atau memahami batas tanggung jawab:
> *"SHIELD adalah instrumen digital pemantauan mandiri dan literasi gizi keluarga berbasis standar Kementerian Kesehatan RI. Sistem ini TIDAK menggantikan diagnosis, pemeriksaan medis langsung, tindakan kuratif, maupun resep dokter/bidan faskes primer."*
