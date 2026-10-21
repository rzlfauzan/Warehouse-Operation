# Handoff ke Claude Code: Process Map & Gap Analysis Audit SOP MKT (5 cabang)

## Data
File: `audit_dataset_all_branches.json` (menggantikan `audit_dataset_jkt.json`, yang hanya Jakarta).

Struktur:
- `sites[]`: JKT Jakarta, SUB Surabaya, MKS Makassar, SRG Semarang, MDN Medan, lengkap dengan nomor audit, tanggal, sheet yang diaudit, dan catatan.
- `templates`: dua katalog langkah SOP.
  - `JKT_TEMPLATE` dipakai JKT, SUB, MKS, SRG (EXPORT 62 langkah, IMPORT 62, DC 53).
  - `MDN_TEMPLATE` dipakai Medan saja. SOP Medan berbeda (SOP-OPS-DC-002, EXP-003, IMP-004; EXPORT 57, IMPORT 58, DC 55). JANGAN dipaksa cocok ke template Jakarta.
- `results[]`: satu baris per site x sheet x langkah (807 baris): `doc`, `genba`, `finding`, `actor_actual`, `flag`, `root_cause`. Kode status: C, NC, NA.

Semua total genba sudah dicocokkan dengan sheet SUMMARY/REKAP tiap cabang (14 dari 14 cocok).

## Ruang lingkup
Hanya sheet EXPORT, IMPORT, DC. Sheet lain (CY Handling, Area Terbatas, Multimode, Sistem Monitoring, dll.) belum diambil.
Makassar hanya DC (Export/Import tidak diaudit). Jakarta DC punya dua unit: SEMPER dan MARCEN.

## TAHAP 1: Workflow (kerjakan dulu, tampilkan hasil sebelum lanjut)
1. Swimlane per sheet (EXPORT / IMPORT / DC): lane = aktor, urutan = nomor langkah, dikelompokkan per section.
2. Filter cabang. Pilih satu cabang, node diwarnai status genba (COMPLY hijau, NON-COMPLY merah, N/A abu).
3. Untuk Medan gunakan `MDN_TEMPLATE` (alur berbeda), tampilkan sebagai workflow sendiri, bukan overlay.
4. Node NC menampilkan `finding` saat di-klik. Jika `actor_actual` terisi dan berbeda dari aktor SOP, tampilkan keduanya (pelaksana sebenarnya).

### Aturan visual
- `flag` berawalan `status_conflict` atau `sop_`: garis putus-putus kuning, warna isi tetap sesuai status asli.
- `deviation_but_comply`: ikon kuning kecil tanpa garis putus-putus.
- `na_not_performed_by_mkt` (N/A karena dikerjakan Pelindo/vendor/customer): pola garis diagonal abu-abu dan label "dikerjakan pihak lain". Jangan disamakan dengan N/A biasa.
- `integrity_risk_reported_by_auditor` (Medan Export 11): tandai khusus, jangan disembunyikan.
- Sertakan legenda dan tooltip alasan flag.

## TAHAP 2: Gap analysis (setelah workflow disetujui)
- Heatmap langkah x cabang (baris = langkah SOP Jakarta-template, kolom = cabang). Medan di panel terpisah.
- Ranking NC per aktor, per kategori (DOC/COMP/SYS/OPS), per section.
- Tampilkan compliance "resmi" (C/(C+NC), N/A diabaikan) berdampingan dengan "adjusted" (N/A ikut dihitung sebagai tidak terverifikasi). Contoh yang menyesatkan: Semarang Import resmi 100% tapi 46 dari 62 langkah N/A; Surabaya Import resmi 97.6% dengan 21 N/A.
- Selisih `doc` vs `genba` (self-assessment vs lapangan): "overclaim" = doc C tetapi genba NC. Medan Import kebalikannya (doc NC, genba C pada 21 langkah).
- `root_cause` (terisi untuk Semarang): satu akar masalah mendorong banyak NC (no_wms 19, no_cycle_count 14, no_so 8). Tampilkan sebagai satu akar dengan jumlah dampak, bukan 40 temuan terpisah.

## Pola lintas cabang yang sudah terlihat (verifikasi di visual)
- Ops Sect Head tidak menandatangani GR / SJ inbound / Inbound Confirmation / DO outbound (DC 16, 17, 22, 35): NC di hampir semua cabang (hanya Makassar item 22 yang C).
- Pallet ID tidak sesuai posisi (DC 19): NC di semua cabang Jakarta-template.
- BA Cycle Count: NC di JKT, SRG, MKS, MDN; BA Stock Opname: NC di hampir semua. Akar masalah umum: form BA tidak tersedia, hanya via email.
- Konfirmasi lewat WA/telepon, bukan email (Export 6, 7, 29; DC 6, 7).
- Lokasi cargo di Google Form, belum di WIMS (Medan Export 15, 16, 43, 53; Import 33, 34, 44, 54).
- Form pemeriksaan kendaraan/kabin tidak konsisten: NC di JKT-Semper, SUB, SRG; C di Makassar.
- WMS belum punya fitur freeze/lock stock (Jakarta, Semarang, Medan).

## Catatan kualitas data (tampilkan sebagai flag, jangan diubah diam-diam)
- `status_conflict_*` (17 baris): status COMPLY padahal temuan menyebut belum dijalankan. Contoh: Jakarta Export 45-50, Import 45-46, Surabaya DC 33 dan 47, Medan Export 28. Angka resmi terlalu tinggi untuk baris ini.
- `status_conflict_role_not_exist`: peran Surveyor sudah tidak ada (Jakarta dan Surabaya Export 27), seharusnya N/A atau dialihkan ke peran lain.
- `sop_outdated` / `sop_inconsistent_16_vs_17`: SOP tidak sesuai praktik atau antar-template (batas overtime 16:00 vs 17:00; BC tidak lagi menandatangani laporan stripping).
- Surabaya DC: kolom bukti berisi placeholder sisa copy-paste, tidak dipakai.

## Pisahkan jenis gap
(a) kepatuhan petugas, (b) form/dokumen/WMS belum menyediakan, (c) SOP tidak sesuai praktik, (d) proses dikerjakan pihak lain sehingga MKT tidak punya kontrol langsung. Masing-masing punya owner dan tindakan berbeda.
