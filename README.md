# MKT Audit SOP: peta proses dan gap analysis (Jakarta)

Sumber untuk tiga halaman HTML dan dua file Excel hasil audit SOP Warehouse & Multimode MKT,
form FRM-OPS-001-0001, site Jakarta, Agustus 2026. Dirancang untuk digabung menjadi satu halaman
dengan tiga tab (Alur Proses Umum, Peta Proses Audit SOP, Gap Analysis).

## Isi folder

| Folder | Isi |
|---|---|
| `data/audit_dataset_jkt_source.json` | Dataset asli dari auditor (62 Export, 62 Import, 53 DC). Jangan diubah. |
| `data/audit_dataset_jkt_v2.json` | Dataset kerja. Perubahan dari source: sheet `EXPORT` kehilangan seksi E6 (langkah 37-44); sheet `TRUCKING` baru berisi E6 (langkah 1-8, sudah diaudit, `orig_no` menyimpan nomor asli) dan draf penarikan full container (langkah 9-22, status `PENDING`). Setiap sheet punya field `site`. |
| `data/flows.json` | Definisi 32 tahap alur (PIC, area kerja, dokumen masuk/keluar, rentang langkah audit, catatan per proses). Sumber untuk tab Alur dan Excel. |
| `data/gap_config.json` | Klasifikasi gap A/B/C (`GT`, `FORCE`), jenis gap, sepuluh tema, teks flag QA, dan catatan kualitas data. Sumber untuk tab Gap. |
| `src/app.tpl.html` | **Halaman gabungan** dengan tiga tab (Alur, Peta, Gap), filter bersama, dan tautan antar tab. Placeholder `__PAYLOAD__`. |
| `src/*.tpl.html` (lainnya) | Template tiga halaman terpisah yang lama (dipertahankan karena masih diterbitkan). Placeholder `__DATA__` atau `__ST__`. |
| `scripts/build.py` | Membangun `dist/*.html` dari data dan template. `--check` membandingkan tanpa menulis. |
| `scripts/validate_data.py` | Cek tiap langkah audit masuk tepat satu tahap alur, dan referensi tema ada di data. Jalankan setelah mengubah data. |
| `scripts/make_xlsx_peta.py` | Membangun `dist/Peta_Proses_Audit_SOP_Review.xlsx` dari `data/flows.json` dan `data/audit_dataset_jkt_v2.json` (butuh openpyxl). Hitung ulang rumus dengan LibreOffice setelahnya. |
| `dist/mkt_audit_sop.html` | Halaman gabungan (yang dipakai ke depan). |
| `dist/` (lainnya) | Tiga halaman lama dan satu file Excel review. |
| `docs/` | Prompt asli dan Pendahuluan SOP Penarikan Full Container ke UTC Rev.01 (butir 6 Prosedur belum diterima). |

## Membangun ulang

```
python3 scripts/validate_data.py  # harus OK
python3 scripts/build.py          # tulis dist/*.html
python3 scripts/build.py --check  # harus SAMA untuk ketiganya
python3 scripts/make_xlsx_peta.py
```

## Keputusan dan status yang perlu diingat

- **Status Adjusted:** langkah COMPLY bertanda `status_conflict_finding_says_*` dihitung NON-COMPLY;
  `status_conflict_should_be_NA` dihitung N/A. Data sumber tidak diubah.
- **Compliance** = COMPLY / (COMPLY + NON-COMPLY); N/A dan `PENDING` tidak dihitung.
- **Angka Export** (90,0% as reported) tidak sama dengan sheet SUMMARY sumber (91,4%) karena E6 dipindah ke Trucking.
- **Klasifikasi gap A/B/C** (kepatuhan petugas / form-WMS / SOP) dan sepuluh tema ada di `src/gap_analysis.tpl.html`
  (`GT`, `FORCE`, `THEMES`). Ini usulan awal, belum disetujui auditor.
- **Area kerja per tahap** ada di `LOC` dalam `src/alur_proses_umum.tpl.html`. Penilaian dari isi langkah,
  bukan dari form; sudah dikoreksi pengguna untuk Export bongkar/tally dan Import simpan/keluar.
- **Draf penarikan full container** diturunkan hanya dari Pendahuluan SOP. Aktor dan urutan perlu disesuaikan
  setelah butir 6 Prosedur diterima.
- **Temuan kualitas data belum diputuskan:** Import 59 dan 60 (NC tetapi temuan "tidak ada selisih"),
  Export 55/61 dan Import 61 (N/A padahal gap WMS), DC 3 Marcen (COMPLY tetapi "tanpa form standar").

## Halaman gabungan

Satu file, tiga tab, satu data. Filter bersama di header: cabang, as reported/adjusted, lokasi DC (muncul di Gap atau saat proses DC).
Tautan antar tab: Alur ke Peta (tombol "langkah"), Alur ke Gap (badge NC), Peta ke Alur dan Gap (panel detail), Gap ke Peta (chip tema dan nomor langkah), Gap ke Alur (tombol "Alur" di heatmap dan kolom Tahap).
Navigasi di dalam halaman memakai fungsi `go(tab, opsi)`; URL hanya membawa nama tab (`#alur`, `#peta`, `#gap`).
Menambah cabang: tambahkan sheet dengan field `site` ke `audit_dataset_jkt_v2.json`; tombol cabang aktif otomatis.

## Rencana berikutnya

Cabang lain (Surabaya, Semarang, Medan, Makassar), butir 6 Prosedur penarikan full container, dan keputusan
atas temuan kualitas data di atas. Badge NC di Alur perlu aturan agregasi saat ada banyak cabang.
