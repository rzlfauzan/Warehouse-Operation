#!/usr/bin/env python3
"""Bangun data/medan_ho_mapping.json: pemetaan langkah SOP Medan ke SOP Utama HO (template Jakarta).

Ini DRAF usulan. Dibuat dengan membaca bunyi langkah dan aktor kedua template; belum dikonfirmasi pemilik SOP.
Spesifikasi ringkas per langkah Medan:  nomor: (padanan HO, relasi, keyakinan, catatan)
  padanan HO : 'E3,E4' (E=EXPORT, I=IMPORT, D=DC, T=TRUCKING; T1-T8 penarikan empty, T9-T22 full), kosong = tidak ada
  relasi     : S setara (kegiatan sama), P sebagian (tumpang tindih atau beda rincian/aktor), M hanya Medan
  keyakinan  : T tinggi, S sedang, R rendah
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SH = {'E': 'EXPORT', 'I': 'IMPORT', 'D': 'DC', 'T': 'TRUCKING'}

def rng(a, b, ho_start, rel='S', conf='T', note=''):
    return {a + k: (f'{ho_start[0]}{int(ho_start[1:]) + k}', rel, conf, note) for k in range(b - a + 1)}

EXPORT = {
 1: ('E3', 'P', 'S', 'Cek tujuan SJT di pos depan; HO sekaligus registrasi dan catat waktu tiba'),
 2: ('E3', 'P', 'S', 'Pencocokan nopol dengan SJT; HO tidak memisahkannya'),
 3: ('E2', 'S', 'S', 'Logbook Medan setara registrasi kendaraan di pos Security HO'),
 4: ('E2', 'P', 'R', 'Langkah pengarah ke AO; HO tidak punya langkah eksplisit'),
 5: ('E5', 'S', 'T', ''),
 6: ('E7', 'P', 'S', 'Closing time gudang (Sen-Jum 17.00, Sab 13.00) vs batas overtime HO 17:00; beda aturan'),
 7: ('E6', 'S', 'T', ''),
 8: ('E8', 'P', 'S', 'Medan: AO input WIMS, beri cap, uang bongkar; HO: Admin buat Order Inbound'),
 9: ('', 'M', 'T', 'Uang bongkar dan Kasir tidak ada di SOP HO'),
 10: ('', 'M', 'T', 'Kasir dan Kwitansi Bongkar tidak ada di SOP HO'),
 11: ('E11', 'P', 'S', 'Perintah bongkar oleh Checker; HO mencatat bongkar lewat WMS'),
 12: ('E14', 'S', 'T', ''),
 13: ('D17', 'P', 'R', 'TTD SJT oleh Checker; HO hanya punya TTD SJT inbound di DC'),
 14: ('E19', 'P', 'S', 'Simpan cargo ke gudang oleh forklift'),
 15: ('E19', 'P', 'S', 'Lokasi dicatat Google Form; HO put away dengan scanning'),
 16: ('E16', 'P', 'R', 'Pencocokan lokasi dengan Cargo Tally; HO update Tally Report di WMS'),
 17: ('T1', 'S', 'T', ''),
 18: ('T3', 'P', 'S', 'Instruksi ambil empty ke depo dengan DO; HO memberi Bon Muat'),
 19: ('T6,T7', 'P', 'S', 'Pemeriksaan seal, SJT, EIR dan penggantian bila tidak layak'),
 20: ('', 'M', 'T', 'Penurunan container ke CY MKT; belum ada di SOP HO (calon SOP CY Handling)'),
 21: ('T4', 'P', 'R', 'Lapor empty di CY dan serah seal ke AO; HO pemeriksaan bersama Depo'),
 22: ('', 'M', 'T', 'Pencatatan container in ke WIMS tidak ada di SOP HO'),
 23: ('E5,T9', 'P', 'S', 'Terima VGM, PEB, COPARN, NPE; HO terima BC, SJ, PEB, NPE, PL, Invoice dan KE, PKBE'),
 24: ('', 'M', 'T', 'CEISA dan pembayaran port charge ke BNCT tidak ada di SOP HO'),
 25: ('', 'M', 'T', 'Pengesahan NPE, PKBE, PL di BC hanggar tidak ada di SOP HO'),
 26: ('T9', 'P', 'R', 'PKBE; draf HO penarikan full memuat PKBE sebagai dokumen masuk'),
 27: ('E22,E23', 'P', 'S', 'Stuffing list Medan setara CLP di HO'),
 28: ('E24,E25', 'P', 'S', 'Siapkan cargo sesuai stuffing list; HO oleh Picker'),
 29: ('E31', 'P', 'R', 'Scan dan ukur dimensi; HO scan Pallet ID oleh Surveyor'),
 30: ('', 'M', 'T', 'Kirim dimensi cargo ke pelanggan tidak ada di SOP HO'),
 31: ('E32,E33', 'P', 'S', 'Muat per tier dan dokumentasi; HO dokumentasi 25/50/75/100%'),
 32: ('E35,E36', 'P', 'S', 'Ambil seal, cocokkan nomor, segel; di HO dibagi Admin dan Surveyor'),
 33: ('E33,E36', 'P', 'S', 'Dokumentasi penyegelan (foto)'),
 34: ('', 'M', 'T', 'Serah Cargo Tally ke AO dan laporan ke pelanggan tidak ada di Export HO'),
 35: ('T9', 'P', 'R', 'SP2 dan stuffing list dari pelanggan; HO penarikan full memulai dari KE, PKBE, Survey Pelayaran, ESL'),
 36: ('', 'M', 'S', 'Peran Gate Officer tidak ada di SOP HO'),
 37: ('T16', 'S', 'S', 'Pesan truck untuk full container ke pelabuhan setara SPK ke vendor'),
 38: ('T14', 'P', 'R', 'Muat container full; HO memeriksa kondisi saat keluar gudang'),
 39: ('T15,T13', 'P', 'S', 'Cetak SJ dan cek nomor container dan seal; HO terbitkan SJT dan periksa segel'),
}
EXPORT.update(rng(40, 46, 'E45'))
EXPORT.update(rng(47, 57, 'E52'))

IMPORT = {
 1: ('I1', 'S', 'T', ''), 2: ('I2', 'S', 'T', ''),
 3: ('I3', 'P', 'S', 'Pengajuan pembayaran DO via MCM; HO AO estimasi biaya dan bayar'),
 4: ('I4', 'P', 'S', 'Messenger ambil DO ke pelayaran; HO forwarding terbitkan DO'),
 5: ('I4', 'P', 'R', 'Pelayaran verifikasi dan Messenger terima DO asli'),
 6: ('I5', 'S', 'T', ''), 7: ('I6', 'S', 'T', ''),
 8: ('I7', 'S', 'S', 'Permohonan PLP ke Pelindo (UTC) dan BC'),
 9: ('I8', 'P', 'S', 'BC TTD permohonan dan beri nomor pendaftaran'),
 10: ('I8', 'S', 'T', ''),
 11: ('I9', 'P', 'S', 'Medan: Staff bayar port charges; HO: Vendor CC'),
 12: ('I9,I10', 'P', 'S', 'Cetak SP2 dan order trucking; HO SP2 diteruskan untuk order E-Seal'),
 13: ('I11,I12', 'P', 'R', 'Pengemudi tarik container dengan SP2'),
 14: ('I13', 'P', 'S', 'BC Pelindo pasang segel dan BA Penyegelan; HO pasang E-Seal'),
 15: ('I14', 'P', 'R', 'Antar container ke CY MKT; HO langkah terdekat adalah input gate in'),
 16: ('I14', 'P', 'S', 'Serah dokumen dan input data; HO input gate in ke sistem'),
 17: ('', 'M', 'T', 'Penurunan container ke lapangan MKT belum ada di SOP HO (calon SOP CY Handling)'),
 18: ('I16', 'S', 'T', ''),
 19: ('I15,I18', 'P', 'S', 'TTD izin stripping oleh BC Hanggar'),
 20: ('I17', 'P', 'R', 'Serah copy PLP dan manifest ke AO'),
 21: ('I21', 'P', 'R', 'Instruksi bongkar; HO Staff Ops mengidentifikasi, menghitung, marking'),
 22: ('I21,I22', 'S', 'S', 'Pemeriksaan fisik, marking, hitung; discrepancy ikut IK'),
 23: ('I23', 'S', 'T', ''),
 24: ('I19,I24', 'S', 'S', 'Foto kegiatan bongkar; HO memisahkan foto seal dan foto bongkar'),
 25: ('I25', 'P', 'R', 'BC Hanggar dokumentasi ke Cargo Tally'),
 26: ('I25', 'P', 'S', 'Report cargo tally dan foto ke pelanggan'),
 27: ('I26,I30', 'P', 'S', 'DO pengembalian empty dan input container out'),
 28: ('', 'M', 'T', 'Pembayaran pengembalian empty di Depo tidak ada di SOP HO'),
 29: ('I26,I29', 'P', 'S', 'Serah SJ, CRO, DO ke supir dan muat empty oleh Operator RS'),
 30: ('I27,I28', 'P', 'R', 'Supir antar empty ke depo; Staff terima EIR'),
 31: ('', 'M', 'T', 'Serah EIR dan kwitansi jaminan ke pelayaran tidak ada di SOP HO'),
 32: ('I32', 'S', 'T', ''),
 33: ('I32', 'P', 'S', 'Operator tentukan dan lapor lokasi; Medan via Google Form'),
 34: ('I31,I33', 'P', 'S', 'Catat lokasi dan cocokkan dengan Cargo Tally; HO input lokasi di WMS'),
 35: ('I36', 'P', 'S', 'Consignee serahkan dokumen pengeluaran ke AO'),
 36: ('I36', 'P', 'S', 'AO verifikasi dokumen pengeluaran'),
 37: ('', 'M', 'T', 'Kasir dan kwitansi muat tidak ada di SOP HO'),
 38: ('I36,I38', 'P', 'S', 'Dokumen dan bukti bayar diserahkan ke Checker'),
 39: ('I37,I40', 'P', 'S', 'Instruksi muat oleh TKBM dan SJ keluar'),
 40: ('I41', 'P', 'S', 'Pelanggan bawa barang keluar dan input out cargo'),
}
IMPORT.update(rng(41, 47, 'I45'))
IMPORT.update(rng(48, 58, 'I52'))

DC = {
 1: ('D1', 'P', 'S', 'Info penarikan container dan SP2; HO info pengiriman via email'),
 2: ('D8', 'P', 'S', 'Input data container untuk WO dan SJT; HO Order Inbound di WMS'),
 3: ('', 'M', 'T', 'Penarikan full container dari CY pelabuhan ke area MKT; di HO dibahas di Import 9 sampai 14'),
 4: ('D2', 'P', 'S', 'Gate Officer terima SJT dan input WIMS; HO Security registrasi dan cek SJ'),
 5: ('', 'M', 'T', 'Penurunan container ke lapangan oleh Operator RS belum ada di SOP HO (calon SOP CY Handling)'),
 6: ('D10', 'S', 'T', ''),
 7: ('E10', 'P', 'R', 'Foto seal dan kondisi container; padanan terdekat ada di Export 10 (DC HO tidak punya)'),
 8: ('D12,D13', 'P', 'S', 'Periksa fisik, marking, jumlah vs PL'),
 9: ('D14', 'S', 'T', ''),
 10: ('D13,D15', 'S', 'S', 'Tally Sheet dan update WIMS'),
 11: ('', 'M', 'T', 'ICR tidak ada di SOP HO'),
 12: ('D5,D7', 'P', 'S', 'Terima dokumen dan cek jam kedatangan; HO batas overtime 16:00'),
 13: ('D11,D6', 'P', 'S', 'Periksa kendaraan dan dokumen; konfirmasi jika tidak layak atau lengkap'),
 14: ('D12,D14', 'P', 'S', 'Cek fisik saat bongkar; ketidaksesuaian di BA'),
 15: ('D13,D15', 'S', 'T', 'Tally Sheet dan Receiving Report'),
 16: ('D20', 'P', 'S', 'Pindah cargo ke area simpan oleh forklift'),
 17: ('D20', 'P', 'S', 'Tentukan dan lapor lokasi'),
 18: ('D21', 'P', 'S', 'Catat lokasi dan cocokkan dengan Tally; HO Put Away Report'),
 19: ('D23', 'P', 'S', 'Terima DN/DO pelanggan; HO terima info pengeluaran via email'),
 20: ('D27', 'P', 'R', 'Cocokkan cargo keluar; HO picking sesuai Picking Report dan scan'),
 21: ('D32,D30', 'P', 'S', 'Pemeriksaan kendaraan dengan form HSE; HO Form Kendaraan dan Form Kabin'),
 22: ('', 'M', 'T', 'Aturan keselamatan driver (rem tangan, ganjal ban, kunci) tidak ada di SOP HO'),
 23: ('D33', 'P', 'R', 'Security awasi pengeluaran dan cocokkan marking'),
 24: ('D34', 'P', 'S', 'AO terbitkan SJT dan Outbound Report; HO Outbound Confirmation Report dan TTD Ops Section Head'),
}
for n in range(25, 32):
    DC[n] = ('', 'M', 'T', 'Proses Cargo Retur tidak ada di SOP HO')
DC.update({
 32: ('D18', 'P', 'R', 'Pisahkan kargo damage dan susun ke pallet'),
 33: ('D18', 'P', 'S', 'Input jumlah SKU yang di-paletized ke WIMS'),
 34: ('D18', 'P', 'S', 'Cetak pallet tag dan list lokasi kosong; HO Pallet ID diserahkan ke Checker'),
 35: ('D19,D20', 'S', 'S', 'Tempel dan scan pallet tag, tentukan lokasi'),
 36: ('D20', 'P', 'R', 'Letakkan palet ke area Bin'),
 37: ('D20', 'P', 'R', 'Naikkan palet ke level atas dengan Reach Truck'),
})
DC.update(rng(38, 44, 'D36'))
DC.update(rng(45, 55, 'D43'))

def build():
    out = []
    for sheet, spec in (('EXPORT', EXPORT), ('IMPORT', IMPORT), ('DC', DC)):
        for no in sorted(spec):
            ho, rel, conf, note = spec[no]
            refs = [{'sheet': SH[r[0]], 'no': int(r[1:])} for r in ho.split(',') if r]
            out.append({'sheet': sheet, 'no': no, 'ho': refs, 'rel': rel, 'conf': conf, 'note': note})
    return out

if __name__ == '__main__':
    m = build()
    meta = {'status': 'draf usulan, belum dikonfirmasi pemilik SOP',
            'rel': {'S': 'setara', 'P': 'sebagian', 'M': 'hanya Medan'}, 'conf': {'T': 'tinggi', 'S': 'sedang', 'R': 'rendah'},
            'note': 'Medan memakai SOP-OPS-DC-002, EXP-003, IMP-004; acuan HO adalah SOP Utama (template Jakarta). T1-T8 = penarikan empty (asal Export 37-44), T9-T22 = penarikan full (draf).'}
    (ROOT / 'data/medan_ho_mapping.json').write_text(json.dumps({'meta': meta, 'map': m}, ensure_ascii=False, indent=1), encoding='utf-8')
    from collections import Counter
    for sh in ('EXPORT', 'IMPORT', 'DC'):
        c = Counter(x['rel'] for x in m if x['sheet'] == sh)
        print(sh, len([x for x in m if x['sheet'] == sh]), dict(c))
