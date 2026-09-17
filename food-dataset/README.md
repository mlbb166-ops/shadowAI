# Indonesian Food Dataset — Verified Source Snapshot

## Isi paket

Paket ini berisi **1.646 record yang benar-benar dikumpulkan dari sumber eksternal**, bukan data sintetis:

| Koleksi | Record | Sumber | Isi utama |
|---|---:|---|---|
| `panganku_ifct_foods` | 1.146 | Indonesian Food Composition Table (IFCT), Panganku | Kode pangan, nama pangan, kelompok, dan tipe pangan (raw/processed sesuai tabel) |
| `indonesia_packaged_foods` | 500 | Open Food Facts API dengan penanda negara Indonesia | Barcode, nama produk, merek, komposisi label, kategori, alergen, label, kemasan, nutrisi, dan provenance |

## File siap training

- `processed/panganku_ifct_foods.csv`
- `processed/panganku_ifct_foods.jsonl`
- `processed/panganku_ifct_foods.json`
- `processed/indonesia_packaged_foods.csv`
- `processed/indonesia_packaged_foods.jsonl`
- `processed/indonesia_packaged_foods.json`

## Raw source dan audit trail

Folder `raw/` menyimpan respons JSON mentah dari API Open Food Facts. File `source/panganku-all-foods.html` menyimpan snapshot halaman tabel resmi Panganku yang diparsing menjadi 1.146 record. Setiap record memiliki `source_url`, `accessed_at`, `source_type`, `verification_status`, dan `confidence_level`.

## Aturan kualitas

Tidak ada nilai yang diimputasi atau ditebak. Nilai kosong dipertahankan sebagai kosong. Record Open Food Facts diberi status `source-recorded; not independently label-verified` karena Open Food Facts adalah basis data kontribusi komunitas. Record Panganku diberi status `official-source-recorded; values preserved as published` karena diambil dari tabel IFCT pada domain Panganku.

Kolom `quality_flags` pada produk kemasan menunjukkan kekurangan seperti komposisi tidak tersedia, merek kosong, label kosong, atau nutrisi inti kosong. Jangan menganggap produk yang tidak memiliki klaim organik/halal sebagai tidak organik/tidak halal; artinya hanya data tersebut tidak ada pada record sumber.

## Sumber dan lisensi

1. Panganku / Indonesian Food Composition Table: <https://www.panganku.org/en-EN/semua_nutrisi>
2. FAO/INFOODS metadata IFCT 2017: <https://www.fao.org/food-composition/tables-and-databases/detail/(country--date)-title-18/en>
3. Open Food Facts data conditions and downloads: <https://world.openfoodfacts.org/data>
4. Open Food Facts API: <https://world.openfoodfacts.org/api/v2/search>

Open Food Facts menyatakan database-nya tersedia di bawah Open Database License (ODbL), sedangkan isi individual di bawah Database Contents License (DbCL). Baca dan patuhi ketentuan sumber sebelum redistribusi atau penggunaan komersial. Data Panganku/IFCT tetap tunduk pada ketentuan pemilik/pengelola sumbernya.

## Batasan yang wajib dipahami

Paket ini **bukan sensus seluruh pangan Indonesia** dan bukan jaminan bahwa setiap label telah diverifikasi secara independen. Produk kemasan dapat berubah formulasi atau label. Snapshot ini juga belum mencakup detail nutrisi per 1.146 record IFCT karena halaman tabel yang tersedia memuat indeks pangan; detail harus diambil dari halaman detail sumber secara terpisah dan tetap dicatat dengan provenance. Gunakan kolom confidence dan verification status saat membuat split training/evaluation.

## Contoh penggunaan

```python
import json

with open("processed/indonesia_packaged_foods.jsonl", encoding="utf-8") as f:
    records = [json.loads(line) for line in f]

# Jangan menghapus quality_flags jika provenance penting bagi model.
training_records = [r for r in records if r["food_name"] and r["verification_status"]]
print(len(training_records))
```
