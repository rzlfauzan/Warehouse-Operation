# MKT Audit SOP: peta proses dan gap analysis (Jakarta)

Sumber untuk tiga halaman HTML dan dua file Excel hasil audit SOP Warehouse & Multimode MKT,
form FRM-OPS-001-0001, site Jakarta, Agustus 2026. Dirancang untuk digabung menjadi satu halaman
dengan tiga tab (Alur Proses Umum, Peta Proses Audit SOP, Gap Analysis).

## Isi folder

| Folder | Isi |
|---|---|
| `data/audit_dataset_jkt_source.json` | Dataset asli dari auditor (62 Export, 62 Import, 53 DC). Jangan diubah. |
| `data/audit_dataset_all_branches_source.json` | Dataset lima cabang dari auditor (807 baris hasil). Sumber untuk v3. Jangan diubah. |
| `data/audit_dataset_v3.json` | **Dataset aplikasi** (dibangun oleh `scripts/make_dataset_v3.py`): satu sheet per cabang dan proses. Lihat bagian Multi-cabang. |
| `data/audit_dataset_jkt_v2.json` | Dataset Jakarta saja (riwayat). Masih dipakai halaman lama dan sebagai sumber draf penarikan full container. |
| `data/audit_dataset_jkt_v2.json` (lanjutan) | Dataset kerja. Perubahan dari source: sheet `EXPORT` kehilangan seksi E6 (langkah 37-44); sheet `TRUCKING` baru berisi E6 (langkah 1-8, sudah diaudit, `orig_no` menyimpan nomor asli) dan draf penarikan full container (langkah 9-22, status `PENDING`). Setiap sheet punya field `site`. |
| `data/flows.json` | Definisi 32 tahap alur (PIC, area kerja, dokumen masuk/keluar, rentang langkah audit, catatan per proses). Sumber untuk tab Alur dan Excel. |
| `data/gap_config.json` | Klasifikasi gap A/B/C (`GT`, `FORCE`), jenis gap, sepuluh tema, teks flag QA, dan catatan kualitas data. Sumber untuk tab Gap. |
| `src/app.tpl.html` + `src/app.js` | **Halaman gabungan** dengan tiga tab (Alur, Peta, Gap), filter bersama, dan tautan antar tab. Markup dan CSS di template; logika di `app.js` (disisipkan saat build). |
| `src/*.tpl.html` (lainnya) | Template tiga halaman terpisah yang lama (dipertahankan karena masih diterbitkan). Placeholder `__DATA__` atau `__ST__`. |
| `scripts/build.py` | Membangun `dist/*.html` dari data dan template. `--check` membandingkan tanpa menulis. |
| `scripts/make_dataset_v3.py` | Membangun `audit_dataset_v3.json` dari sumber lima cabang. |
| `scripts/validate_data.py` | Cek tiap langkah template HO masuk tepat satu tahap alur, referensi tema ada di data, dan jumlah baris sama dengan sumber. Jalankan setelah mengubah data. |
| `scripts/make_xlsx_peta.py` | Membangun `dist/Peta_Proses_Audit_SOP_Review.xlsx` dari `data/flows.json` dan `data/audit_dataset_jkt_v2.json` (butuh openpyxl). Hitung ulang rumus dengan LibreOffice setelahnya. |
| `dist/mkt_audit_sop.html` | Halaman gabungan (yang dipakai ke depan). |
| `dist/` (lainnya) | Tiga halaman lama dan satu file Excel review. |
| `docs/` | Prompt asli dan Pendahuluan SOP Penarikan Full Container ke UTC Rev.01 (butir 6 Prosedur belum diterima). |

## Membangun ulang

```
python3 scripts/make_dataset_v3.py # hanya bila sumber berubah
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

## Multi-cabang (lima cabang)

- **Cabang:** Jakarta (JKT), Surabaya (SUB), Makassar (MKS, hanya DC), Semarang (SRG), Medan (MDN).
- **Template:** JKT, SUB, MKS, SRG memakai template HO (SOP Utama, template Jakarta). **Medan memakai SOP sendiri** (SOP-OPS-DC-002, EXP-003, IMP-004; 57/58/55 langkah) yang ditampilkan sebagai workflow terpisah dan tidak dipaksa cocok ke template HO. Alur Medan nanti disamakan dengan SOP Utama HO; sampai pemetaan langkah dibuat, Alur menampilkan "SOP cabang berbeda" untuk Medan dan tautan ke Alur dinonaktifkan.
- **Dua kolom status:** `genba` (lapangan) adalah status resmi; `doc` adalah self-assessment. Di DC Jakarta, `doc` tampil sebagai unit "Dokumen" yang hanya masuk hitungan bila dipilih. Selisih keduanya dibaca di bagian Dokumen vs lapangan.
- **Seksi E6** (penarikan empty, SOP-OPS-005) dipindah ke sheet `TRUCKING` untuk semua cabang ber-template HO yang punya Export (JKT, SUB, SRG). Compliance Export tiap cabang karena itu tidak sama dengan SUMMARY sumber. Medan tidak dipindah.
- **Compliance:** resmi = C/(C+NC), N/A diabaikan. **Adjusted** = `status_conflict_*` dihitung ulang (NC, atau N/A untuk `should_be_NA` dan `role_not_exist`). **Cakupan** = porsi langkah bukan N/A, supaya cabang dengan banyak N/A (Semarang Import 25,8%, Surabaya Import 66,1%) tidak tampak sempurna.
- **Jenis gap:** A kepatuhan petugas, B form/dokumen/WMS, C SOP tidak sesuai praktik, D dikerjakan pihak lain (`na_not_performed_by_mkt`). Klasifikasi adalah usulan, belum disetujui auditor.
- **Flag baru:** `na_not_performed_by_mkt` (pola diagonal, "dikerjakan pihak lain"), `integrity_risk_reported_by_auditor` (Medan Export 11; ditandai khusus), `status_conflict_finding_says_not_done|incomplete|role_not_exist`.
- **Excel review** masih hanya Jakarta (SOP Utama HO).

## Rencana berikutnya

Pemetaan langkah Medan ke SOP HO, butir 6 Prosedur penarikan full container, Excel review per cabang,
dan keputusan atas temuan kualitas data di atas (lihat bagian Kualitas data di halaman Gap).
