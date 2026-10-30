# HANDOFF: Audit SOP MKT (5 cabang) - peta proses, alur umum, gap analysis

Dokumen ini untuk AI agent yang melanjutkan proyek. Baca seluruhnya sebelum mengubah apa pun.
Status per 2026-10-30. Bahasa kerja dengan pengguna: **Bahasa Indonesia**.

## 0. Cara memakai handoff ini
Awali dengan:
```
cd /home/user/warehouse-operation     # atau clone rzlfauzan/Warehouse-Operation (privat), branch main
python3 -I scripts/validate_data.py    # harus: OK
python3 -I scripts/build.py --check    # harus: SAMA untuk semua halaman
```
Jika keduanya lolos, kondisi repo sama dengan yang diterbitkan. Lanjutkan dari bagian 8 (Pekerjaan berikutnya).

## 1. Tujuan proyek
Pengguna (tim Warehouse & Multimode MKT) memegang hasil audit SOP form FRM-OPS-001-000x (2026) untuk lima cabang.
Mereka ingin satu halaman interaktif dengan tiga tab:
1. **Alur Proses Umum**: tahap proses SOP Utama Head Office (HO), dokumen masuk/keluar, PIC, area kerja.
2. **Peta Proses Audit SOP**: swimlane tiap langkah audit, diwarnai status hasil lapangan.
3. **Gap Analysis**: compliance, jenis gap, matriks langkah x cabang, heatmap, peringkat, tema.

Bahan: Excel review untuk SOP HO + Medan, dan dokumen draf dua SOP baru (penarikan full container ke UTC/CY, CY Handling).

## 2. Hasil yang sudah ada (tautan)
| Apa | Lokasi |
|---|---|
| **Halaman gabungan (utama)** | https://claude.ai/artifact/RaJCuk43QDT4b116daeoEN (Artifact, versi 5). Terakhir terdeteksi berstatus "Anyone with the link"; pengguna yang mengatur akses lewat menu Share. |
| Draf SOP (A: penarikan full container ke UTC/CY, B: CY Handling) | https://claude.ai/artifact/EiwxvfMtCb7eKWZ47tHP8H (Claude Docs, bisa diedit/dikomentari) |
| Halaman lama (hanya Jakarta, sudah tidak dipelihara) | Alur https://claude.ai/artifact/NhcRGKS439K5Zp3t4hSCoB , Peta https://claude.ai/artifact/BJT6LtxNaK9XCRtYchj9AT , Gap https://claude.ai/artifact/Vd7wieaYLfAgGT24NAWoGG . Saran: dihentikan setelah pengguna puas. |
| Kode sumber | GitHub `rzlfauzan/Warehouse-Operation` (**privat**), branch `main`, commit terakhir `3504bce`. |
| Excel review | `dist/Peta_Proses_Audit_SOP_Review.xlsx` (enam+ sheet, lihat bagian 6). Sudah dikirim ke chat; kirim ulang bila diubah. |

## 3. Struktur repositori
```
data/
  audit_dataset_all_branches_source.json   SUMBER dari auditor (5 cabang, 807 baris hasil). Jangan diubah.
  audit_dataset_v3.json                    DATA APLIKASI. Dibangun oleh scripts/make_dataset_v3.py.
  flows.json                               32 tahap alur HO (PIC, area, dokumen masuk/keluar, rentang langkah audit)
  gap_config.json                          klasifikasi gap, 14 tema, teks flag, kategori, NOTES (catatan di luar NC)
  medan_ho_mapping.json                    pemetaan draf 170 langkah Medan -> SOP HO (dibangun scripts/make_medan_mapping.py)
  audit_dataset_jkt_source.json, _v2.json  riwayat Jakarta saja (v2 masih dipakai halaman lama + draf T2 penarikan full)
src/
  app.tpl.html  markup+CSS halaman gabungan (placeholder __PAYLOAD__ dan __APP_JS__)
  app.js        SEMUA logika halaman gabungan (disisipkan saat build)
  *.tpl.html    template halaman lama (alur_proses_umum, peta_proses_audit_sop, gap_analysis)
scripts/
  build.py              bangun dist/*.html; --check membandingkan tanpa menulis
  validate_data.py      cek konsistensi data (WAJIB dijalankan setelah mengubah data)
  make_dataset_v3.py    sumber -> v3
  make_medan_mapping.py spesifikasi pemetaan Medan->HO (ubah di sini, jalankan ulang)
  make_xlsx_peta.py     bangun Excel (butuh openpyxl; hitung ulang rumus dengan LibreOffice)
  legacy_derive_v2_and_peta.py   sejarah, tidak dijalankan
dist/   hasil build (halaman gabungan = mkt_audit_sop.html) + Excel
docs/   prompt asli, Pendahuluan SOP penarikan full container (.doc + .txt)
README.md  ringkasan; HANDOFF.md  dokumen ini
```

## 4. Model data (v3)
- `sheets[]`: satu per (site, sheet). `site` in {JKT, SUB, MKS, SRG, MDN}; `sheet` in {EXPORT, IMPORT, DC, TRUCKING}; `template` = JKT_TEMPLATE (SOP Utama HO) atau MDN_TEMPLATE (SOP Medan).
- Item: `no, section, sop_ref, category (DOC/COMP/SYS/OPS), criterion, actor, status, finding, auditor_note, qa_flag, actor_actual, root_cause`, `doc_status` (self-assessment) kecuali JKT DC.
- **JKT DC** `status` = `{SEMPER, MARCEN, DOKUMEN}`; SEMPER/MARCEN dari kolom `genba` (lapangan), DOKUMEN dari kolom `doc`.
- Status: `COMPLY`, `NON-COMPLY`, `N/A`, `PENDING` (belum diaudit).
- Makassar hanya DC; Medan pakai template sendiri (57/58/55 langkah) dan tidak punya sheet TRUCKING.
- Aplikasi memecah tiap item menjadi **observasi** (`OBS`): satu per langkah per cabang, JKT DC menjadi per unit.

## 5. Aturan dan keputusan yang SUDAH disepakati atau diterapkan
1. **Resmi** = COMPLY / (COMPLY + NON-COMPLY); N/A diabaikan. **Adjusted** = langkah COMPLY bertanda `status_conflict_*` dihitung ulang (NC; atau N/A untuk `should_be_NA` dan `role_not_exist`). **"Diperiksa"** = COMPLY + NON-COMPLY (bukan seluruh langkah diaudit). Data sumber tidak pernah diubah diam-diam.
2. **Seksi E6 (penarikan empty, SOP-OPS-005) dipindah dari EXPORT ke sheet TRUCKING** (langkah 1-8, `orig_no` = nomor asli 37-44) untuk semua cabang ber-template HO yang punya Export. Akibatnya angka Export tidak sama dengan sheet SUMMARY sumber (mis. Jakarta 90,0% vs 91,4%). Penarikan full container = T2 (langkah 9-22), status PENDING, draf dari Pendahuluan SOP butir 1-5; butir 6 Prosedur belum diterima.
3. **Unit "Dokumen" DC Jakarta** hanya masuk hitungan bila dipilih di filter; default "Semper + Marcen".
4. **Medan**: SOP berbeda, ditampilkan sebagai workflow sendiri (jangan dipaksa ke template HO). Alurnya nanti disamakan dengan SOP Utama HO. Sementara dipakai **pemetaan draf** (`medan_ho_mapping.json`): sama (S) / mirip (P) / hanya di Medan (M) + kecocokan tinggi/sedang/rendah. Hasil: 76 sama, 70 mirip, 24 hanya di Medan; 47 langkah HO tidak ada di Medan. Tampil sebagai kolom MDN* di matriks Gap, badge "Medan n NC*" di Alur (juga saat "Semua cabang"), dan panel detail Peta dua arah.
5. **Gap Analysis hanya fokus NON-COMPLY**: kartu jenis gap = A kepatuhan petugas, B form/dokumen/WMS belum menyediakan. Semua NC yang tidak jelas form/WMS otomatis A (kemungkinan A terlalu besar; B sengaja konservatif). Jenis C (SOP usang) dan D (dikerjakan pihak lain) bukan NC, sehingga pindah ke bagian terpisah **"Catatan di luar NON-COMPLY"** (8 kelompok, `NOTES` di gap_config.json).
6. Bagian Gap yang **sudah dihapus atas permintaan pengguna**: Dokumen vs lapangan, Akar masalah bersama, Kualitas data. Jangan dikembalikan tanpa diminta (data `doc_status`/`root_cause` tetap ada dan tampil di panel detail Peta).
7. Redaksi: gunakan kata umum (sama/mirip/hanya di Medan, penanggung jawab, diperiksa), hindari istilah teknis (padanan, overclaim, self-assessment, cakupan, owner, kode flag).
8. Satuan hitung Gap: per langkah per cabang (JKT DC per unit). Satu langkah NC di tiga cabang dihitung tiga kali.
9. Visual Peta: garis putus kuning = status perlu ditinjau (`status_conflict*`, `sop_*`); titik kuning = COMPLY tapi menyimpang; diagonal abu-abu = N/A dikerjakan pihak lain (`na_not_performed_by_mkt`); bingkai ganda merah + ikon = `integrity_risk_reported_by_auditor` (Medan Export 11, dugaan fraud; jangan disembunyikan); ikon ↔ = pelaksana aktual beda dari SOP.
10. Area kerja per tahap (Gudang MKT, Port/Pelayaran, Depo, Bea Cukai) adalah penilaian dari isi langkah dan sudah dikoreksi pengguna; "Kantor/Pelanggan" sengaja tidak dipakai. Tab Trucking Support memuat penarikan empty (diaudit) dan penarikan full (draf).

## 6. Cara kerja halaman gabungan (src/app.js)
- State global `S` (site, view rep/adj, dcloc, tab, proc, alur/peta/gap). Navigasi lintas tab hanya lewat `go(tab, opsi)`; URL hanya membawa `#alur|#peta|#gap`.
- Lima tautan antar tab: Alur->Peta (tombol "langkah"), Alur->Gap (badge NC), Peta->Alur/Gap (panel detail), Gap->Peta (chip tema, nomor langkah, sel matriks), Gap->Alur (tombol "Alur").
- Header: Cabang ("Semua cabang" di Alur dan Gap, tidak di Peta), Status (As reported / Adjusted), Lokasi DC (hanya relevan untuk Jakarta).
- Kemungkinan perubahan terbesar ada di `app.js` (render*), `data/gap_config.json` (tema, jenis gap, NOTES), dan `data/flows.json` (alur).
- Excel (`make_xlsx_peta.py`): sheet Petunjuk, Export, Import, Trucking Support, DC (hanya Jakarta/HO; baris tahap berlatar abu memuat dokumen masuk/keluar, kolom kuning = review), Dokumen, Pemetaan Medan-HO, HO tidak ada di Medan. Setelah membangun, hitung ulang rumus (script `recalc.py` dari skill xlsx; LibreOffice).

## 7. Cara bekerja (alur standar)
1. Ubah sumber (data/*.json atau skrip spesifikasi, atau src/app.js / app.tpl.html).
2. `python3 -I scripts/make_dataset_v3.py` hanya jika sumber audit berubah; `python3 -I scripts/make_medan_mapping.py` hanya jika pemetaan berubah.
3. `python3 -I scripts/validate_data.py` (harus OK) lalu `node --check src/app.js` lalu `python3 -I scripts/build.py`.
4. Uji di browser: Playwright tersedia di `/opt/node-tools/node_modules/playwright` (Chromium `/opt/pw-browsers/chromium`). Pola uji yang dipakai: muat `dist/mkt_audit_sop.html`, panggil `go(...)`/`setSite(...)`, cek tanpa `pageerror`, tanpa geser horizontal di lebar 400 px, serta angka kunci (bawah).
5. Terbitkan: `Artifact` publish `dist/mkt_audit_sop.html`. Dari sesi baru, **baca dulu** artifact (`action: read`) lalu publish dengan `url` = tautan di atas; tanpa `url` akan membuat artifact baru.
6. Commit (akhiri pesan dengan baris atribusi yang diminta sesi) dan `git push -u origin main`. Token `gh` di sesi lama tidak valid; repositori dilampirkan lewat `add_repo` (clone `https://github.com/rzlfauzan/warehouse-operation`).

**Angka kunci untuk regresi** (Semua cabang, As reported): 807 langkah diaudit = 506 COMPLY + 199 NON-COMPLY + 102 N/A; diperiksa 705; NC = A 184 + B 15; Adjusted: NC 213, A 198. Catatan di luar NC = 113 (pihak lain 67, menyimpang 15, status perlu ditinjau 14, gap WMS N/A 5, SOP usang 5, seharusnya N/A 3, perbaikan 3, risiko integritas 1). Compliance resmi: JKT Export 90,0 / Import 76,7 / DC Semper 60,8 / Marcen 79,2; SUB Export 88,0 / Import 97,6 / DC 74,5; MKS DC 73,6; SRG Export 46,9 / Import 100 / DC 24,5; MDN Export 72,2 / Import 72,9 / DC 67,3. `validate_data.py`: 5 cabang, 16 sheet, 796 langkah, 14 tema.

## 8. Pekerjaan berikutnya (urut saran)
1. **Menunggu jawaban pengguna**: (a) pembagi persentase kartu gap: 705 (diperiksa, dipakai sekarang) vs 807 (seluruh diaudit); (b) tema gap lintas proses: pertahankan / ringkas satu baris per tema / hapus; (c) tinjauan pemetaan Medan (21 langkah kecocokan rendah, 24 hanya Medan) lewat Excel; (d) apakah klasifikasi B terlalu konservatif.
2. **Terima butir 6 Prosedur** SOP Penarikan Full Container ke UTC (hanya Pendahuluan yang ada). Lalu perbarui tabel di dokumen draf, `flows.json` (kartu 4-7 Trucking), dan checklist T2 di `make_dataset_v3.py`/data (langkah 9-22).
3. **Sheet "CY Handling"** dari form audit belum diterima; Bagian B dokumen draf baru kerangka. Minta sheet itu, lalu isi dan tambahkan ke alur/audit bila perlu.
4. **Tinjau/ konfirmasi pemetaan Medan->HO** dengan pemilik SOP, lalu (setelah SOP Medan diselaraskan) audit ulang pada template yang sama.
5. **Excel review per cabang** (sekarang hanya Jakarta/HO + sheet Medan). Sinkronisasi dokumen draf (Claude Docs) ke halaman/Excel masih manual.
6. Hentikan tiga halaman lama setelah pengguna puas; periksa pengaturan akses halaman utama (sekarang "Anyone with the link").
7. Uji di HP sungguhan (belum pernah; baru emulasi lebar 400 px) dan mode gelap penuh.

## 9. Temuan data yang diketahui (belum diputuskan; jangan diubah diam-diam)
- Jakarta Import 59, 60: NON-COMPLY padahal temuan "tidak ditemukan selisih" (kemungkinan N/A).
- Gap WMS freeze dinilai tidak konsisten: N/A di sebagian (Jakarta Export 55/61, Import 61; Semarang; Medan Export 50/Import 51), NON-COMPLY di lain (Jakarta Import 55; Semarang DC; Medan DC 48; Makassar DC 46).
- Jakarta DC 3 Marcen: COMPLY padahal temuan "tanpa form standar" (DC 11 dan 32 serupa = NC).
- Medan Import: 8 langkah N/A (5, 8, 9, 13, 14, 15, 19, 30) berasal dari vendor/BC/pelayaran tapi belum bertanda `na_not_performed_by_mkt`.
- Surabaya: `doc_status` = lapangan di semua langkah (kemungkinan salinan); bukti DC berisi placeholder sisa copy-paste.
- Semarang Import resmi 100% tetapi hanya 16 dari 62 langkah diperiksa (46 N/A dikerjakan CFS Pelindo); Surabaya Import resmi 97,6% dengan 21 N/A.
- Medan Export 11: auditor mencatat dugaan fraud saat bongkar (status COMPLY) -> perlu jalur tindak lanjut di luar audit SOP.
- Pola lintas cabang dari prompt terkonfirmasi, kecuali dua yang hanya sebagian: form pemeriksaan kendaraan/kabin (benar untuk DC 11 dan 32; DC 30 hanya Jakarta NC, DC 3 Semarang COMPLY) dan komunikasi WA/telepon (tersebar tidak merata).

## 10. Preferensi pengguna (penting)
- Hindari validasi kosong ("ide bagus", "kamu benar"). Beri pushback jelas dan umpan balik siap-keputusan, tunjukkan trade-off. Jangan menyetujui tanpa menguji dulu.
- Koreksi pengguna adalah final (mis. area kerja per tahap, istilah, penghapusan bagian Gap).
- Jangan mengeksekusi saat pengguna bilang "brainstorming dulu".
- Hal berisiko keluar (push GitHub, publikasi, akses) konfirmasi dulu; data audit ini internal dan repositori harus privat. Jangan dorong ke repositori publik (`rzlfauzan/mktkf-portal` adalah proyek lain dan publik; jangan dipakai).
- Jelaskan angka dengan istilah sederhana; pengguna sering menanyakan arti metrik (contoh: "temuan", "x dari y").

## 11. Hal teknis yang pernah menjebak
- Skrip dan template yang dulu ada di folder sementara sesi hilang; sumber sekarang hanya di repositori. Selalu commit.
- Jalankan Python dengan `-I`. `build.py` hanya menulis `dist/`; `--check` gagal bila template, data, atau JS berubah tapi dist belum dibangun ulang.
- `make_xlsx_peta.py` memuat `V3` penuh dan memfilter `D` ke Jakarta; jangan menimpa `D` sebelum `V3` dibaca.
- Template memakai `[hidden]` untuk bagian tersembunyi; skeleton publikasi menambahkan aturan `[hidden]{display:none!important}`, jadi file lokal tampak sedikit berbeda dari versi terbit.
- Penerbitan ulang tanpa `url` dari sesi lain membuat artifact baru. Selalu baca dulu lalu publish dengan `url`.
