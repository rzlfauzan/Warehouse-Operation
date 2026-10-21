#!/usr/bin/env python3
"""Cek konsistensi data: tiap langkah audit masuk tepat satu tahap alur, dan referensi tema ada di data."""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
D = json.loads((ROOT / 'data/audit_dataset_jkt_v2.json').read_text(encoding='utf-8'))
FL = json.loads((ROOT / 'data/flows.json').read_text(encoding='utf-8'))
GC = json.loads((ROOT / 'data/gap_config.json').read_text(encoding='utf-8'))
errs = []
items = {(s['sheet'], i['no']) for s in D['sheets'] for i in s['items']}
cover = {}
for p in FL['procs']:
    for ph in p['phases']:
        for st in ph['stages']:
            for n in range(st['from'], st['to'] + 1):
                if (st['sheet'], n) in items:
                    cover.setdefault((st['sheet'], n), []).append(st['id'])
for k in sorted(items):
    c = cover.get(k, [])
    if len(c) != 1:
        errs.append(f'{k[0]} {k[1]}: masuk {len(c)} tahap {c}')
for t in GC['THEMES']:
    for sh, ns in t['refs']:
        for n in ns:
            if (sh, n) not in items:
                errs.append(f"tema {t['id']}: {sh} {n} tidak ada di data")
for k in list(GC['GT']) + GC['FORCE']:
    sh, n = k.rsplit('-', 1)
    if (sh, int(n)) not in items:
        errs.append(f'GT/FORCE {k} tidak ada di data')
print(f'{len(items)} langkah, {sum(len(ph["stages"]) for p in FL["procs"] for ph in p["phases"])} tahap, {len(GC["THEMES"])} tema')
print('OK' if not errs else '\n'.join(errs))
sys.exit(1 if errs else 0)
