# Legacy frontend archive

Folder ini menyimpan komponen prototype lama untuk referensi migrasi saja. Isinya **tidak termasuk** dalam TypeScript build, tidak diroute oleh aplikasi, dan tidak boleh dipakai untuk autentikasi atau otorisasi.

Portal kader lama dipindahkan ke sini karena memakai PIN di sisi klien dan endpoint legacy yang tidak memiliki kontrol kepemilikan server. Fitur tersebut hanya boleh dikembalikan setelah backend memiliki RBAC, tenant isolation, audit, dan test otorisasi yang memadai.
