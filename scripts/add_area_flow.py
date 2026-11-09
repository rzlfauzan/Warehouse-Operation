#!/usr/bin/env python3
"""Tambah proses AREA (Area Terbatas & NC Barang) ke data/flows.json (idempotent).
Tahap dan dokumen diturunkan dari kriteria audit di data/area_terbatas_source.json (SOP-OPS-007 dan SOP-OPS-008, template HO).
Jalankan setelah sumber berubah, lalu validate_data.py dan build.py."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
FL = json.loads((ROOT / 'data/flows.json').read_text(encoding='utf-8'))
docs = lambda xs: [{'t': t, 'sig': 0} for t in xs]

def st(no, name, pic, sop, a, b, ins, outs, cond='', sys=''):
    return {'id': f'AREA-{no}', 'no': no, 'name': name, 'cond': cond, 'pic': pic, 'areas': ['G'], 'sop': sop, 'sheet': 'AREA',
            'from': a, 'to': b, 'in': docs(ins), 'out': docs(outs), 'sys': sys, 'pending': False}

proc = {'key': 'AREA', 'label': 'Area Terbatas & NC Barang',
        'note': 'SOP-OPS-007 Area Terbatas Gudang dan SOP-OPS-008 Penanganan Ketidaksesuaian Barang, berlaku untuk semua departemen. '
                'Jakarta diaudit di tiga lokasi (Tj. Priok, Semper, Marcen). Medan memakai SOP-OPS-005 Area Terbatas Gudang Cabang Medan (23 langkah, tanpa NC Barang).',
        'phases': [
  {'name': 'Area terbatas gudang (SOP-OPS-007)', 'stages': [
    st(1, 'Pemeriksaan kendaraan masuk', ['Security'], 'SOP-OPS-007 6.1', 1, 4,
       ['STNK & SIM pengemudi', 'Surat Jalan (kendaraan logistik)', 'Kartu identitas tamu'],
       ['Kartu pengunjung (ID Visitor)', 'Laporan barang mencurigakan ke Manajemen'],
       sys='Pemeriksaan fisik dengan kaca cembung dan metal detector'),
    st(2, 'Lalu lintas & kendaraan keluar', ['Security'], 'SOP-OPS-007 6.2-6.3', 5, 9,
       ['Surat Jalan', 'Kartu pengunjung'],
       ['Catatan pelanggaran lalu lintas ke Manajemen', 'Kartu identitas dikembalikan ke tamu'],
       sys='Traffic Management System'),
    st(3, 'Akses keluar masuk gudang', ['Security'], 'SOP-OPS-007 6.4', 10, 14,
       ['Kartu pengunjung', 'ID Card karyawan'],
       ['Buku catatan tamu di Pos Security'],
       cond='Body checking karyawan dan tamu saat keluar masuk'),
    st(4, 'Pengawasan bongkar muat & CCTV', ['Security', 'Management'], 'SOP-OPS-007 6.5-6.6', 15, 20,
       ['Izin akses CCTV dari Operation Department Head'],
       ['Rekaman CCTV (simpan minimal 90 hari)'],
       sys='CCTV 24 jam mencakup seluruh area gudang'),
  ]},
  {'name': 'Ketidaksesuaian barang (SOP-OPS-008)', 'stages': [
    st(5, 'Identifikasi, pemisahan & dokumentasi', ['Operasional'], 'SOP-OPS-008 6.1', 21, 24,
       ['Temuan barang tidak sesuai (rusak, kurang/lebih)'],
       ['Laporan ke Manajemen', 'Foto & video kondisi barang'],
       cond='Barang cair: di atas spill pallet, bagian bocor menghadap ke atas'),
    st(6, 'Berita Acara & tindakan perbaikan', ['Operasional', 'QHSE', 'Management Rep.'], 'SOP-OPS-008 6.1', 25, 28,
       ['Foto & video kondisi barang'],
       ['Berita Acara ketidaksesuaian ke pelanggan (1x24 jam)', 'Form Tindakan Perbaikan & Pencegahan'],
       cond='Bahan kimia berbahaya yang tidak tertangani: prosedur darurat'),
  ]}]}
procs = [p for p in FL['procs'] if p['key'] != 'AREA']
ix = next(i for i, p in enumerate(procs) if p['key'] == 'DC') + 1
FL['procs'] = procs[:ix] + [proc] + procs[ix:]
(ROOT / 'data/flows.json').write_text(json.dumps(FL, ensure_ascii=False, indent=1), encoding='utf-8')
print([p['key'] for p in FL['procs']])
