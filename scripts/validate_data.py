#!/usr/bin/env python3
"""Cek konsistensi data v3: cakupan tahap alur, referensi tema, jumlah baris terhadap sumber."""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
D = json.loads((ROOT / 'data/audit_dataset_v3.json').read_text(encoding='utf-8'))
SRC = json.loads((ROOT / 'data/audit_dataset_all_branches_source.json').read_text(encoding='utf-8'))
FL = json.loads((ROOT / 'data/flows.json').read_text(encoding='utf-8'))
GC = json.loads((ROOT / 'data/gap_config.json').read_text(encoding='utf-8'))
errs = []
tpl = lambda s: 'MDN' if s['template'] == 'MDN_TEMPLATE' else 'HO'

# 1. tiap langkah template HO masuk tepat satu tahap alur (per site dan sheet)
for s in D['sheets']:
    if tpl(s) != 'HO':
        continue
    for i in s['items']:
        hit = [st['id'] for p in FL['procs'] for ph in p['phases'] for st in ph['stages']
               if st['sheet'] == s['sheet'] and st['from'] <= i['no'] <= st['to']]
        if len(hit) != 1:
            errs.append(f"{s['site']} {s['sheet']} {i['no']}: masuk {len(hit)} tahap {hit}")

# 2. referensi tema ada di data
have = {(tpl(s), s['sheet'], i['no']) for s in D['sheets'] for i in s['items']}
for t in GC['THEMES']:
    for ref, nos in t['refs']:
        tp, sh = ref.split(':') if ':' in ref else ('HO', ref)
        for n in nos:
            if (tp, sh, n) not in have:
                errs.append(f"tema {t['id']}: {ref} {n} tidak ada di data")
for k in list(GC['GT']) + GC['FORCE']:
    sh, n = k.rsplit('-', 1)
    if ('HO', sh, int(n)) not in have:
        errs.append(f'GT/FORCE {k} tidak ada di data')

# 3. jumlah baris sumber = jumlah langkah terisi (JKT DC dua unit; langkah PENDING bukan dari sumber)
n_app = sum(len(s['items']) * (2 if s['site'] == 'JKT' and s['sheet'] == 'DC' else 1) for s in D['sheets']
            for _ in [0]) - sum(1 for s in D['sheets'] for i in s['items'] if i['status'] == 'PENDING')
if n_app != len(SRC['results']):
    errs.append(f"baris aplikasi {n_app} != baris sumber {len(SRC['results'])}")

# 4. setiap site punya sheet sesuai daftar sumber
for st in SRC['sites']:
    got = {s['sheet'] for s in D['sheets'] if s['site'] == st['code']} - {'TRUCKING'}
    if got != set(st['sheets']):
        errs.append(f"{st['code']}: sheet {sorted(got)} != {sorted(st['sheets'])}")

print(f"{len(D['sites'])} cabang, {len(D['sheets'])} sheet, {sum(len(s['items']) for s in D['sheets'])} langkah, {len(GC['THEMES'])} tema")
print('OK' if not errs else '\n'.join(errs))
sys.exit(1 if errs else 0)
