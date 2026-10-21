# MKT Audit SOP: peta proses dan gap analysis (Jakarta)

Sumber untuk tiga halaman HTML dan dua file Excel hasil audit SOP Warehouse & Multimode MKT,
form FRM-OPS-001-0001, site Jakarta, Agustus 2026. Dirancang untuk digabung menjadi satu halaman
dengan tiga tab (Alur Proses Umum, Peta Proses Audit SOP, Gap Analysis).

## Isi folder

| Folder | Isi |
|---|---|
| `data/audit_dataset_jkt_source.json` | Dataset asli dari auditor (62 Export, 62 Import, 53 DC). Jangan diubah. |
| `data/audit_dataset_jkt_v2.json` | Dataset kerja. Perubahan dari source: sheet `EXPORT` kehilangan seksi E6 (langkah 37-44); sheet `TRUCKING` baru berisi E6 (langkah 1-8, sudah diaudit, `orig_no` menyimpan nomor asli) dan draf penarikan full container (langkah 9-22, status `PENDING`). Setiap sheet punya field `site`. |
| `data/flow_rows_snapshot.json` | Hasil ekstraksi 32 tahap dari Alur Proses Umum (PIC, dokumen masuk/keluar, area). Dipakai untuk Excel. |
| `src/*.tpl.html` | Template tiga halaman. Placeholder data: `__DATA__` atau `__ST__`. |
| `scripts/build.py` | Membangun `dist/*.html` dari data dan template. `--check` membandingkan tanpa menulis. |
| `scripts/make_xlsx_peta.py` | Membangun `dist/Peta_Proses_Audit_SOP_Review.xlsx` (butuh openpyxl). |
| `scripts/export_flow_rows.js` | Mengekstrak `flow_rows_snapshot.json` dari halaman Alur memakai Playwright. |
| `dist/` | Hasil build, sama persis dengan yang diterbitkan. |
| `docs/` | Prompt asli dan Pendahuluan SOP Penarikan Full Container ke UTC Rev.01 (butir 6 Prosedur belum diterima). |

## Membangun ulang

```
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

## Rencana berikutnya

Satukan tiga halaman menjadi satu dengan tiga tab, header filter bersama (cabang, as reported/adjusted,
lokasi DC), data bersama, dan tautan antar tab (Alur ke Peta, Alur ke Gap, Peta ke Gap, Gap ke Peta, Gap ke Alur).
Tab pembuka: Alur Proses Umum. Cabang lain (Surabaya, Semarang, Medan, Makassar) menyusul setelah penyatuan.
