# Handoff ke Claude Code: Process Map & Gap Analysis Audit SOP (MKT)

## Konteks
Dataset `audit_dataset_jkt.json` berisi hasil audit SOP Warehouse & Multimode MKT site Jakarta (FRM-OPS-001-0001, Agustus 2026) untuk 3 sheet: EXPORT (62 item), IMPORT (62 item), DC (53 item, dengan status per lokasi Semper, Marcen, dan Dokumen).
Angka sudah dicocokkan dengan sheet SUMMARY (Export 53/5/4, Import 46/14/2, DC Semper 31/20/2, DC Marcen 42/11/0).

Skema: `sheets[].sections[]` = tahapan proses (berurutan), `sheets[].items[]` = langkah SOP dengan `sop_ref`, `category` (DOC/COMP/SYS/OPS), `actor`, `status`, `finding`, `qa_flag`.

## Ruang lingkup saat ini
Hanya site Jakarta. Fokus TAHAP 1 = workflow (poin 1 di bawah). Gap analysis (poin 2) dikerjakan di TAHAP 2 setelah workflow disetujui. Jangan tambah data cabang lain.

## Tugas
1. (TAHAP 1) Buat process map (swimlane) per sheet: lane = `actor`, urutan = `no`, dikelompokkan per `section`. Warna node by status (COMPLY hijau, NON-COMPLY merah, N/A abu). Node NC menampilkan `finding` saat di-hover/klik.
2. Buat halaman gap analysis: heatmap section x status, ranking NC per actor, per kategori (DOC/COMP/SYS/OPS), per SOP ref, dan daftar tema gap lintas proses (lihat di bawah).
3. Satu file HTML interaktif, tema sesuai design system MKT/Samudera (jika skill/design system tersedia).
4. Skema harus bisa diperluas: tambahkan field `site` dan jadikan filter cabang, agar data cabang lain (Surabaya, Semarang, Medan, Makassar) tinggal ditambahkan.

## Tema gap yang perlu diverifikasi dari data
- BA Cycle Count tidak digunakan di semua area: Export 51, Import 51, DC 42 (Semper, Marcen, Dokumen). Akar masalah: tidak ada form BA.
- BA Stock Opname belum digunakan: Export 62, Import 62, DC 53 (Semper).
- Komunikasi formal lewat WA/telepon, bukan email/BA: Export 6, 7, 29; Import 14, 21; DC 6, 31.
- Tanda tangan Ops Section Head tidak ada: DC 16, 17, 22, 35 (3 status NC semuanya). Beberapa karena kolom TTD memang tidak ada di dokumen/WMS (form gap).
- Form pemeriksaan kabin/kendaraan tidak dipakai: DC 3, 11, 30, 32.
- Cycle count harian belum jalan (baru mingguan): Export 45-51, Import 45-46, DC Semper 37-41.
- Stock Opname Import belum berkala/tuntas, WMS tanpa fitur freeze/lock: Import 52-60, Export 55 dan 61 (N/A).
- Disiplin Pallet ID, scanning, dan lokasi: Export 18, Import 23 dan 32, DC 18-21.
- Input sistem terlambat/salah: Import 14, DC Semper 8-10 (Job Order dibuat setelah bongkar).

## Catatan kualitas data (tampilkan sebagai flag, jangan diubah diam-diam)
`qa_flag` menandai item yang status-nya tidak konsisten dengan temuannya:
- `status_conflict_finding_says_not_run`: Export 45-50 dan Import 45-46 berstatus COMPLY padahal temuan menyebut cycle count harian belum dijalankan. Kemungkinan seharusnya NC, sehingga compliance Export (91.4%) dan Import terlalu tinggi.
- `status_conflict_should_be_NA`: Export 27 (surveyor sudah tidak ada), Import 42 (MKT tidak melakukan redress).
- `sop_outdated`: Import 25 dan 27 (BC sudah tidak menandatangani, hanya stempel). Ini gap di SOP, bukan di lapangan.
- `sop_inconsistent_16_vs_17`: DC 7 menyebut batas overtime 16:00, Export 7 menyebut 17:00, praktik lapangan 17:00.
- `deviation_but_comply`: berstatus COMPLY tapi praktiknya menyimpang dari kalimat SOP (mis. konfirmasi WA dulu baru email).
- `form_gap` / `improvement_note`: masalah ada di form/dokumen/WMS, bukan kepatuhan petugas.

### Aturan visual (disetujui user)
- Node dengan `qa_flag` berawalan `status_conflict` atau `sop_` digambar dengan garis putus-putus kuning (dashed yellow border), warna isi tetap sesuai status asli. Artinya: praktik/temuan berbeda dari SOP atau status perlu ditinjau ulang.
- `deviation_but_comply` cukup diberi ikon kecil kuning di pojok node, tanpa garis putus-putus, agar warna kuning tidak berlebihan.
- Tambahkan legenda dan tooltip yang menjelaskan alasan flag (ambil dari `finding`).

Tampilkan compliance "as reported" dan "adjusted" (setelah flag status_conflict dihitung NC) berdampingan.

## Pembeda penting untuk rekomendasi
Pisahkan gap menjadi: (a) kepatuhan petugas, (b) form/dokumen/WMS belum menyediakan, (c) SOP sudah tidak sesuai praktik. Masing-masing punya owner dan tindakan berbeda.
