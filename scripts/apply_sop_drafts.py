#!/usr/bin/env python3
"""Perbarui data/flows.json dari dua draf SOP (idempotent):
  1. Penarikan full container ke CY Pelabuhan, draf Rev.02 (data/sop_full_container_draft.json, dari Notion)
     -> menggantikan empat kartu penarikan full di proses TRUCKING.
  2. CY Handling (data/cy_mkt_pemetaan_source.json, dari Google Sheets pemetaan proses CY MKT)
     -> proses baru CY dengan dua alur (penerimaan, pengambilan), tiap tahap memuat varian Gate Manual dan Gate Otomatis.
Jalankan setelah salah satu file sumber berubah, lalu validate_data.py dan build.py.
"""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
FL = json.loads((ROOT / 'data/flows.json').read_text(encoding='utf-8'))
FC = json.loads((ROOT / 'data/sop_full_container_draft.json').read_text(encoding='utf-8'))
PM = json.loads((ROOT / 'data/cy_mkt_pemetaan_source.json').read_text(encoding='utf-8'))
docs = lambda xs: [{'t': t, 'sig': 0} for t in xs]

# ---------- 1. penarikan full container (TRUCKING)
trk = next(p for p in FL['procs'] if p['key'] == 'TRUCKING')
full = next(ph for ph in trk['phases'] if ph['name'].startswith('Penarikan full'))
groups = []
for st in FC['langkah']:
    if not groups or groups[-1]['tahap'] != st['tahap']:
        groups.append({'tahap': st['tahap'], 'steps': []})
    groups[-1]['steps'].append(st)
AREA = ['G', 'G', 'P', 'P']
SYS = {'SPK dan penarikan': 'Komunikasi dan tracing Staff Trucking dengan sopir; antisipasi closing time pelabuhan.'}
stages = []
for k, g in enumerate(groups):
    pics, ins, outs = [], [], []
    for s in g['steps']:
        for a in [x.strip() for x in s['aktor'].split('&')]:
            if a not in pics: pics.append(a)
        ins += [d for d in s['masuk'] if d not in ins]
        outs += [d for d in s['keluar'] if d not in outs]
    nos = [8 + s['no'] for s in g['steps']]
    stages.append({'id': f'TRUCKING-{4 + k}', 'no': 4 + k, 'name': g['tahap'], 'cond': '', 'pic': pics, 'areas': [AREA[k]],
                   'sop': 'Draf Rev.02', 'sheet': 'TRUCKING', 'from': min(nos), 'to': max(nos), 'in': docs(ins), 'out': docs(outs),
                   'sys': SYS.get(g['tahap'], ''), 'pending': True})
full['stages'] = stages
full['meta'] = (f"{FC['judul']} · pembuat {FC['pembuat']}, pemeriksa {FC['pemeriksa']}, penyetuju {FC['penyetuju']} · belum diaudit")
trk['note'] = ('Penarikan empty sudah diaudit (langkah 1 sampai 8, asalnya Export 37-44). Penarikan full container belum diaudit: '
               'tahap dan dokumen di kartu 4 sampai 7 berasal dari draf Rev.02 (Notion) dan checklist langkah 9 sampai 18 diturunkan darinya.')

# ---------- 2. CY Handling
DOK = {  # (masuk, keluar, sistem) per alur dan nomor tahap; dipisah dari kolom 'Dokumen / Sistem' pada sheet
 'A': {0: (['Email pra-info (no. container, Empty/Full, size/type, SJT/SP2)'], ['Working Order (WO) di WIMS', 'Tiket Bongkar', 'Gate Pass QR/barcode (hanya Gate Otomatis)'], ''),
       1: (['SJT', 'Gate Pass (Gate Otomatis)'], ['Logbook (manual) atau Log Gate (otomatis)'], ''),
       2: (['SJT'], ['SJT ber-cap dan jam lapor (manual)'], ''),
       3: (['SJT'], ['Tiket Bongkar'], 'Input Gate In ke WIMS'),
       4: ([], ['Form Inspeksi Container'], ''),
       5: (['Tiket Bongkar'], [], ''),
       6: ([], [], 'Update lokasi stack (blok/row/tier) di WIMS'),
       7: ([], ['EIR'], 'Jam keluar dicatat di WIMS')},
 'B': {0: (['Email pra-info (no. container, Empty/Full, size/type, DO/SJT/stuffing list)'], ['Working Order (WO) di WIMS', 'Tiket Muat', 'Gate Pass (Gate Otomatis)'], ''),
       1: (['SJT', 'Gate Pass (Gate Otomatis)'], ['Logbook (manual) atau Log Gate (otomatis)'], ''),
       2: (['SJT'], ['SJT ber-cap dan jam lapor (manual)'], ''),
       3: ([], ['Tiket Muat'], 'Gate In di WIMS; job order muat ke Operator RS'),
       4: (['Tiket Muat'], [], ''),
       5: ([], [], 'Status muat diperbarui di WIMS'),
       6: (['SJT'], ['Form Inspeksi Container', 'Logbook (manual) atau Log Gate (otomatis)'], '')}}
phases = []
for al in PM['alur']:
    sts = []
    for t in al['tahap']:
        pics = []
        for a in t['pic_manual'] + t['pic_otomatis']:
            if a not in pics: pics.append(a)
        ins, outs, sysx = DOK[al['id']][t['no']]
        refs = t['ref']
        sts.append({'id': f"CY-{al['id']}{t['no']}", 'no': t['no'], 'name': t['tahap'], 'cond': 'usulan' if t.get('usulan') else '',
                    'pic': pics, 'areas': ['G'], 'sop': 'SOP-OPS-CY-001 (draf)', 'sheet': 'CY', 'refs': refs,
                    'from': min(refs) if refs else 0, 'to': max(refs) if refs else 0, 'in': docs(ins), 'out': docs(outs), 'sys': sysx,
                    'manual': t['manual'], 'otomatis': t['otomatis'], 'pic_manual': t['pic_manual'], 'pic_otomatis': t['pic_otomatis'],
                    'catatan': t['catatan'], 'pending': False, 'hoNo': (1 if al['id'] == 'A' else 9) + t['no']})
    phases.append({'name': al['nama'], 'meta': 'SOP-OPS-CY-001 · area MKT Medan · Gate Manual vs Gate Otomatis', 'periodic': False, 'restart': True, 'stages': sts})
cy = {'key': 'CY', 'label': 'CY Handling',
      'note': 'Draf berasal dari pemetaan proses CY area MKT Medan (Google Sheets). Tahap bertanda "usulan" belum ada di SOP-OPS-CY-001. Langkah audit hanya ada untuk Medan (27 langkah); 8 langkah audit di luar area MKT (penarikan dari pelabuhan, order truck) tidak dipetakan ke tahap.',
      'phases': phases}
FL['procs'] = [p for p in FL['procs'] if p['key'] != 'CY'] + [cy]
(ROOT / 'data/flows.json').write_text(json.dumps(FL, ensure_ascii=False, indent=1), encoding='utf-8')
print('TRUCKING full:', [(s['id'], s['from'], s['to']) for s in stages])
print('CY:', [(s['id'], s['refs']) for ph in phases for s in ph['stages']])
