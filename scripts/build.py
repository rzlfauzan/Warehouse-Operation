#!/usr/bin/env python3
"""Bangun tiga halaman HTML dari data dan template.

Pakai:  python3 scripts/build.py            -> tulis ke dist/
        python3 scripts/build.py --check    -> bandingkan hasil dengan dist/ (tidak menulis)
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / 'data/audit_dataset_jkt_v2.json').read_text(encoding='utf-8'))

def embed(obj, compact):
    # '</' dilepas agar tidak menutup tag <script>
    s = json.dumps(obj, ensure_ascii=False, separators=(',', ':')) if compact else json.dumps(obj, ensure_ascii=False)
    return s.replace('</', '<\\/')

def status_map(d):
    """Status per langkah untuk badge NC di Alur Proses Umum. DC: [Semper, Marcen, Dokumen]."""
    st = {}
    for sh in d['sheets']:
        if sh['sheet'] == 'DC':
            st['DC'] = {i['no']: [i['status'][l] for l in ('SEMPER', 'MARCEN', 'DOKUMEN')] for i in sh['items']}
        else:
            st[sh['sheet']] = {i['no']: i['status'] for i in sh['items']}
    return st

OUT = {
    'peta_proses_audit_sop.html': ('src/peta_proses_audit_sop.tpl.html', '__DATA__', lambda: embed(DATA, False)),
    'alur_proses_umum.html':      ('src/alur_proses_umum.tpl.html',      '__ST__',   lambda: json.dumps(status_map(DATA))),
    'gap_analysis.html':          ('src/gap_analysis.tpl.html',          '__DATA__', lambda: embed(DATA, True)),
}

def main():
    check = '--check' in sys.argv
    bad = 0
    for name, (tpl, ph, payload) in OUT.items():
        tp = (ROOT / tpl).read_text(encoding='utf-8')
        assert tp.count(ph) == 1, f'{tpl}: placeholder {ph} harus tepat satu'
        html = tp.replace(ph, payload())
        dest = ROOT / 'dist' / name
        if check:
            same = dest.exists() and dest.read_text(encoding='utf-8') == html
            print(('SAMA   ' if same else 'BEDA   ') + name); bad += (not same)
        else:
            dest.write_text(html, encoding='utf-8'); print('tulis  ' + str(dest.relative_to(ROOT)))
    sys.exit(1 if bad else 0)

main()
