# Form Audit SOP di HP (Google Apps Script)

Web app untuk mengisi audit SOP langsung dari HP. Login memakai akun Google kantor, data disimpan di Google Sheets, dan foto disimpan di Google Drive. Tampilan mengikuti gaya WMS dan hanya mode terang.

## Isi folder
| File | Fungsi |
|---|---|
| `gas/Code.gs` | Server: setup, simpan isian, unggah foto, kunci, ekspor JSON |
| `gas/Index.html` | Tampilan dan CSS |
| `gas/App.html` | Logika halaman |
| `gas/Data.html` | Master langkah dan hasil audit sebelumnya. **Dibangun otomatis, jangan diedit manual.** |
| `gas/appsscript.json` | Pengaturan: zona waktu Jakarta, web app dijalankan sebagai pemilik, hanya untuk domain kantor |
| `build_gas.py` | Membangun `Data.html` dan pratinjau `dist/audit_mobile_mockup.html` dari `data/audit_dataset_v3.json` |
| `preview_mock.js` | Server tiruan, hanya untuk pratinjau (tidak diunggah ke Apps Script) |

## Pasang pertama kali (±15 menit)
1. Buka https://script.google.com dengan **akun Google kantor**, lalu pilih **New project**. Beri nama `MKT Audit SOP`.
2. Buat file sesuai isi folder `gas/`:
   - `Code.gs`: tempel isi `gas/Code.gs`.
   - Pilih **+ › HTML** tiga kali, beri nama `Index`, `App`, dan `Data` (tanpa `.html`), lalu tempel isinya masing-masing.
   - Pilih **Project Settings › Show "appsscript.json" manifest file in editor**, lalu tempel isi `gas/appsscript.json`.
3. Di editor, pilih fungsi `setup` dan tekan **Run**. Izinkan akses ke Sheets dan Drive. Fungsi ini membuat:
   - spreadsheet **MKT Audit SOP – Data** dengan sheet DOKUMEN, HASIL, PENGGUNA, MASTER_LANGKAH;
   - folder Drive **MKT Audit SOP – Foto & Ekspor**;
   - akun Anda sebagai admin di sheet PENGGUNA.

   Link spreadsheet dan folder muncul di **Execution log**.
4. Tambahkan auditor di sheet **PENGGUNA**: `email` | `nama` | `peran` (`auditor` atau `admin`) | `aktif` (`TRUE`). Akun yang tidak terdaftar hanya bisa melihat.
5. Pilih **Deploy › New deployment › Web app**. Atur *Execute as*: **Me**, dan *Who has access*: **Anyone within [domain kantor]**. Salin link `/exec`.
6. Buka link itu di HP, lalu pilih **Tambahkan ke layar utama** supaya bisa dibuka seperti aplikasi.

Kalau ingin memakai spreadsheet yang sudah ada: sebelum menjalankan `setup`, isi **Project Settings › Script properties** dengan `SS_ID` = ID spreadsheet tersebut.

## Update versi
- Data langkah berubah: jalankan `python3 apps/audit-mobile/build_gas.py`, tempel ulang `Data.html`, lalu jalankan `setup` lagi supaya MASTER_LANGKAH ikut diperbarui. Fungsi ini aman diulang dan tidak menghapus isian.
- Kode berubah: tempel ulang file yang berubah, lalu pilih **Deploy › Manage deployments › Edit › Version: New version**. Link `/exec` tetap sama.
- Kalau pakai `clasp`: `clasp clone <scriptId>` sekali, salin isi `gas/` ke folder clone, lalu jalankan `clasp push`.

## Cara kerja data
- **DOKUMEN**: satu baris per kunjungan audit cabang. Nomor `FRM-OPS-001-xxxx` dimulai dari 0006 (0001–0005 dipakai audit Agustus–September).
- **HASIL**: satu baris per dokumen × bagian × langkah. Kolom `status_dokumen` dan `status_lapangan` berisi COMPLY / NON-COMPLY / N/A, ditambah temuan, pelaksana aktual, link foto, siapa yang mengubah, dan kapan.
- Simpan otomatis: isian dikirim sekitar 1 detik setelah diketuk. Kalau sinyal putus, isian disimpan dulu di HP lalu dikirim ulang.
- Dua auditor bisa mengisi layanan berbeda di dokumen yang sama. Penulisan memakai kunci antrean (LockService), jadi tidak saling menimpa.
- **Kunci dokumen** hanya bisa dilakukan bila semua langkah lengkap dan semua NC punya temuan. Setelah dikunci, server menolak semua perubahan.
- **Ekspor JSON** menyimpan hasil satu dokumen ke folder Drive. File ini dipakai untuk mengarsipkan hasil ke repo dan membandingkan Agustus vs Desember di Gap Analysis.

## Batasan yang perlu diketahui
- Alamat aplikasi berupa `script.google.com/a/macros/...`; domain sendiri tidak bisa dipakai.
- Tidak ada mode offline penuh. Halaman pertama harus dibuka saat ada sinyal.
- Foto diperkecil di HP (maks. 1600px) sebelum diunggah. Maksimal 3 foto per langkah.
- Pilihan CY Handling dan penarikan full container ditentukan saat dokumen dibuat dan tidak bisa diubah setelahnya.
