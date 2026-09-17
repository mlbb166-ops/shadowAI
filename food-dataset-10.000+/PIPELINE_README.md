# Pipeline otomatisasi bertahap

## Tujuan

`pipeline/collect_food_data.py` mengumpulkan record dari sumber publik yang dapat diaudit, menyimpan respons mentah, menormalisasi ke format seragam, dan dapat dilanjutkan dengan parameter baru. Pipeline tidak mengisi kolom kosong dengan perkiraan.

## Sumber yang dipakai

- **Produk kemasan:** Open Food Facts API, dengan filter `countries_tags_en=indonesia`.
- **Nomor BPOM:** endpoint DataTables resmi Cek Produk BPOM, setelah mengambil halaman resmi dan CSRF token. Field yang diambil meliputi nomor registrasi, nama produk, merek, kemasan, produsen, provinsi produsen, ID produk, dan tanggal terbit bila dikembalikan listing.
- **Pangan tradisional:** pencarian provinsi-scoped pada Wikipedia Bahasa Indonesia sebagai **discovery candidate**. Hasil ini belum dianggap fakta terverifikasi dan wajib direview; script tidak mengklaim bahwa setiap judul adalah makanan tradisional dari provinsi tersebut.
- **BTP:** `pipeline/parse_btp_regulation.py` mengekstrak nama BTP, INS, dan golongan dari Annex I Peraturan BPOM Nomor 11 Tahun 2019. Raw PDF dan text dipertahankan, dan setiap baris ditandai bahwa segmentation perlu direview sebelum dipakai sebagai ground truth.

## Cara menjalankan

```bash
cd /home/ubuntu/food-dataset
python3 pipeline/parse_btp_regulation.py
python3 pipeline/collect_food_data.py \
  --off-limit 5000 \
  --bpom-limit 5000 \
  --traditional-per-province 100
```

Perintah tersebut menargetkan lebih dari 10.000 record gabungan secara bertahap. Mulai dengan batch kecil untuk memeriksa rate limit dan kualitas:

```bash
python3 pipeline/collect_food_data.py --off-limit 100 --bpom-limit 100 --traditional-per-province 5
```

Output berada di `processed_pipeline/food_records.csv`, `processed_pipeline/food_records.jsonl`, `processed_pipeline/btp_bpom_11_2019.csv`, dan format JSON/JSONL terkait. Respons mentah berada di `raw_pipeline/`. Proses menyimpan satu file raw per halaman/provinsi, sehingga batch yang sudah terkumpul dapat diaudit dan dipakai ulang.

## Deduplication dan provenance

ID record dibuat dari hash deterministik dari barcode/ID sumber/URL dan konteks provinsi. Record tetap memiliki `source_url`, `source_api_url`, `accessed_at`, `verification_status`, dan `confidence_level`. Jangan menghapus provenance ketika menyiapkan training set.

## Batasan dan kebijakan anti-halusinasi

Pencarian Wikipedia hanya discovery; perlu validasi manual atau sumber kuliner/akademik/instansi daerah sebelum status dinaikkan menjadi verified. Listing BPOM adalah data registrasi, bukan bukti bahwa produk aman dikonsumsi atau bahwa seluruh komposisinya tersedia pada listing. Nomor BPOM harus diperlakukan sebagai identifier registrasi. BTP yang diekstrak dari PDF harus melalui pemeriksaan tabel sebelum digunakan sebagai label hukum atau batas dosis.

## Dua cara menjalankan

| Pendekatan | Trade-off | Biaya | Kompleksitas |
|---|---|---:|---:|
| Jalankan script secara manual per batch | Paling sederhana, mudah meninjau raw dan CSV setelah tiap batch, tetapi perlu menjalankan ulang sendiri | Rendah | Rendah |
| Jalankan sebagai job terjadwal di server yang persisten | Dapat mengumpulkan 1–2 batch per hari dan menyimpan checkpoint, tetapi perlu hosting, monitoring rate limit, dan review kualitas | Bergantung hosting | Menengah |

Untuk tahap sekarang saya menyarankan pendekatan pertama sampai skema, sumber, dan aturan review disetujui. Setelah itu script dapat dijalankan terjadwal tanpa mengubah format data.
