#!/usr/bin/env python3
"""Bangun data/audit_dataset_v3.json (model aplikasi) dari data/audit_dataset_all_branches_source.json.

Model keluaran: sheets[] satu per (site, sheet) dengan sections, items, dan status per langkah.
Perubahan terhadap sumber (semuanya tercatat di README):
- Seksi E6 (penarikan empty, SOP-OPS-005) di template Jakarta dipindah dari EXPORT ke sheet TRUCKING (langkah 1-8,
  field orig_no menyimpan nomor asli). Berlaku untuk site ber-template Jakarta yang punya EXPORT. Medan tidak dipindah.
- Sheet TRUCKING juga memuat draf penarikan full container (langkah 9-22, status PENDING) dari data/audit_dataset_jkt_v2.json.
- 'Auditor: ...' di dalam finding dipisah menjadi field auditor_note.
- JKT DC: status per lokasi {SEMPER, MARCEN} dari kolom genba, DOKUMEN dari kolom doc.
"""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SRC = json.loads((ROOT / 'data/audit_dataset_all_branches_source.json').read_text(encoding='utf-8'))
V2 = json.loads((ROOT / 'data/audit_dataset_jkt_v2.json').read_text(encoding='utf-8'))
M = {'C': 'COMPLY', 'NC': 'NON-COMPLY', 'NA': 'N/A', None: None}

def split_note(text):
    """'temuan | Auditor: catatan' -> ('temuan', 'catatan')"""
    parts = [p.strip() for p in (text or '').split(' | ')]
    note = [p[len('Auditor: '):] for p in parts if p.startswith('Auditor: ')]
    rest = [p for p in parts if p and not p.startswith('Auditor: ')]
    return ' | '.join(rest), ' | '.join(note)

rows = {}
for r in SRC['results']:
    rows.setdefault((r['site'], r['sheet'], r['no']), []).append(r)

t2 = next(s for s in V2['sheets'] if s['sheet'] == 'TRUCKING')
T2_SECTION = next(x for x in t2['sections'] if x['id'] == 'T2')
T2_ITEMS = [i for i in t2['items'] if i['section'] == 'T2']
TRUCK_NOTE = ('Penarikan empty container (langkah 1-8) asalnya langkah Export 37-44 (SOP-OPS-005) dan dipindah ke sini. '
              'Penarikan full container (langkah 9-22) belum diaudit: draf checklist dari Pendahuluan SOP butir 1 sampai 5; '
              'butir 6 Prosedur belum diterima sehingga langkah, aktor, dan urutan perlu disesuaikan.')

def build_item(tpl_item, site, sheet):
    rs = rows.get((site, sheet, tpl_item['no']))
    if not rs:
        return None
    it = {k: tpl_item[k] for k in ('no', 'section', 'sop_ref', 'category', 'criterion', 'actor')}
    r0 = rs[0]
    if site == 'JKT' and sheet == 'DC':
        by = {r['unit']: r for r in rs}
        fs, ns = split_note(by['SEMPER']['finding']); fm, nm = split_note(by['MARCEN']['finding'])
        it['status'] = {'SEMPER': M[by['SEMPER']['genba']], 'MARCEN': M[by['MARCEN']['genba']], 'DOKUMEN': M[by['SEMPER']['doc']]}
        it.update(finding='', finding_semper=fs, finding_marcen=fm, auditor_note=ns or nm)
    else:
        f, n = split_note(r0['finding'])
        it.update(status=M[r0['genba']], doc_status=M[r0['doc']], finding=f, auditor_note=n)
    it.update(qa_flag=r0['flag'], actor_actual=r0['actor_actual'], root_cause=r0['root_cause'])
    return it

sheets = []
for site in SRC['sites']:
    code, tplname = site['code'], site['template']
    for sheet in site['sheets']:
        tpl = SRC['templates'][tplname][sheet]
        sections = [dict(s) for s in tpl['sections']]
        items = [x for x in (build_item(i, code, sheet) for i in tpl['items']) if x]
        base = dict(site=code, sheet=sheet, template=tplname)
        if tplname == 'JKT_TEMPLATE' and sheet == 'EXPORT':
            sec6 = next(s for s in sections if s['id'] == 'E6')
            e6 = sorted([i for i in items if i['section'] == 'E6'], key=lambda i: i['no'])
            items = [i for i in items if i['section'] != 'E6']
            sections = [s for s in sections if s['id'] != 'E6']
            empty = []
            for k, i in enumerate(e6, 1):
                j = dict(i); j.update(no=k, orig_no=i['no'], orig_sheet='Export', section='T1'); empty.append(j)
            full = []
            for i in T2_ITEMS:
                j = {k: i[k] for k in ('no', 'section', 'sop_ref', 'category', 'criterion', 'actor')}
                j.update(status='PENDING', doc_status=None, finding='', auditor_note='', qa_flag='', actor_actual='', root_cause='')
                full.append(j)
            sheets.append(dict(base, sheet='TRUCKING', note=TRUCK_NOTE, sop_refs=['SOP-OPS-005', 'SOP Penarikan Full Container ke UTC Rev.01'],
                sections=[dict(id='T1', name=sec6['name'], sop=sec6['sop'], from_no=1, to_no=len(empty)), dict(T2_SECTION)],
                items=empty + full))
        sheets.append(dict(base, sections=sections, items=items))

sites = [{k: s[k] for k in ('code', 'name', 'audit_no', 'date', 'template') if k in s} | {'note': s.get('note', ''), 'units': s.get('units', {}),
         'sheets': [x['sheet'] for x in sheets if x['site'] == s['code']]} for s in SRC['sites']]
for x in sites:
    if x['code'] == 'JKT':
        x['lead_auditor'] = V2['meta']['lead_auditor']
out = {'meta': {k: v for k, v in SRC['meta'].items() if k != 'title'} | {'title': SRC['meta']['title'], 'lead_auditor': V2['meta']['lead_auditor'],
       'hq_sop_note': 'SOP Medan berbeda dan nanti disamakan alurnya dengan SOP Utama di Head Office (template Jakarta).'},
       'sites': sites, 'sheets': sheets}
(ROOT / 'data/audit_dataset_v3.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')

# ringkasan dan pengecekan
def tally(its, key=lambda i: i['status']):
    c = {'COMPLY': 0, 'NON-COMPLY': 0, 'N/A': 0, 'PENDING': 0}
    for i in its: c[key(i)] += 1
    return c
for s in sheets:
    if s['site'] == 'JKT' and s['sheet'] == 'DC':
        for loc in ('SEMPER', 'MARCEN', 'DOKUMEN'):
            c = tally(s['items'], lambda i: i['status'][loc]); print(s['site'], s['sheet'], loc, c, f"{c['COMPLY']/max(1,c['COMPLY']+c['NON-COMPLY'])*100:.1f}%")
    else:
        c = tally(s['items']); print(s['site'], s['sheet'], len(s['items']), c, f"{c['COMPLY']/max(1,c['COMPLY']+c['NON-COMPLY'])*100:.1f}%")
