#!/usr/bin/env python3
"""Bangun data/audit_dataset_v3.json (model aplikasi) dari data/audit_dataset_all_branches_source.json.

Model keluaran: sheets[] satu per (site, sheet) dengan sections, items, dan status per langkah.
Perubahan terhadap sumber (semuanya tercatat di README):
- Seksi E6 (penarikan empty, SOP-OPS-005) di template Jakarta dipindah dari EXPORT ke sheet TRUCKING (langkah 1-8,
  field orig_no menyimpan nomor asli). Berlaku untuk site ber-template Jakarta yang punya EXPORT. Medan tidak dipindah.
- Sheet TRUCKING juga memuat draf penarikan full container (langkah 9-22, status PENDING) dari data/audit_dataset_jkt_v2.json.
- 'Auditor: ...' di dalam finding dipisah menjadi field auditor_note.
- JKT DC: status per lokasi {SEMPER, MARCEN} dari kolom genba, DOKUMEN dari kolom doc.
- Sheet AREA (Area Terbatas & NC Barang) dari data/area_terbatas_source.json; JKT: status per lokasi {TJ PRIOK, SEMPER, MARCEN}.
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

FC = json.loads((ROOT / 'data/sop_full_container_draft.json').read_text(encoding='utf-8'))
CYSRC = json.loads((ROOT / 'data/cy_handling_medan_source.json').read_text(encoding='utf-8'))
T2_SECTION = {'id': 'T2', 'name': 'Penarikan Full Container ke CY Pelabuhan (UTPK/UTC)', 'sop': 'SOP Penarikan Full Container ke CY Pelabuhan (draf Rev.02)',
              'from_no': 9, 'to_no': 8 + len(FC['langkah'])}
T2_ITEMS = [{'no': 8 + x['no'], 'section': 'T2', 'sop_ref': 'Draf Rev.02 · ' + x['sumber'], 'category': x['kategori'],
             'criterion': x['langkah'], 'actor': x['aktor']} for x in FC['langkah']]
TRUCK_NOTE = ('Penarikan empty container (langkah 1-8) asalnya langkah Export 37-44 (SOP-OPS-005) dan dipindah ke sini. '
              f"Penarikan full container (langkah 9-{8 + len(FC['langkah'])}) belum diaudit: draf Rev.02 (sumber: Notion, dibaca 2026-11-02) "
              'dengan 10 langkah; checklist audit diturunkan dari prosedur draf itu.')

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
            sheets.append(dict(base, sheet='TRUCKING', note=TRUCK_NOTE, sop_refs=['SOP-OPS-005', 'SOP Penarikan Full Container ke CY Pelabuhan (draf Rev.02)'],
                sections=[dict(id='T1', name=sec6['name'], sop=sec6['sop'], from_no=1, to_no=len(empty)), dict(T2_SECTION)],
                items=empty + full))
        sheets.append(dict(base, sections=sections, items=items))

# sheet AREA TERBATAS & NC BARANG (SOP-OPS-007, SOP-OPS-008; Medan: SOP-OPS-005 Medan), dibaca dari Google Sheets
AT = json.loads((ROOT / 'data/area_terbatas_source.json').read_text(encoding='utf-8'))
ATC = {'C': 'COMPLY', 'N': 'NON-COMPLY', 'A': 'N/A'}
AT_UNITS = AT['hasil']['JKT']['units']
def area_sheet(code):
    h, mdn = AT['hasil'][code], code == 'MDN'
    T = AT['medan' if mdn else 'ho']
    items = []
    for x in T['langkah']:
        n = x['no']
        it = {k: x[k] for k in ('no', 'section', 'sop_ref', 'category', 'criterion', 'actor')}
        it['method'] = x['method']
        if code == 'JKT':
            it['status'] = {u: ATC[h['genba'][u][n - 1]] for u in AT_UNITS}
            it.update(finding='', finding_units={u: h['temuan'][u].get(str(n), '') for u in AT_UNITS}, auditor_note='')
        else:
            it.update(status=ATC[h['genba'][n - 1]], doc_status=ATC[h['doc'][n - 1]], finding=h['temuan'].get(str(n), ''),
                      auditor_note=h.get('catatan_auditor', {}).get(str(n), ''))
        it.update(qa_flag='', actor_actual=h.get('pelaksana', {}).get(str(n), ''), root_cause='')
        items.append(it)
    note = ('Sheet AREA TERBATAS MEDAN (SOP-OPS-005 Medan), 23 langkah; Medan tidak mengaudit NC Barang.' if mdn else
            'Sheet AREA TERBATAS & NC BARANG: SOP-OPS-007 Area Terbatas Gudang (langkah 1-20) dan SOP-OPS-008 Penanganan Ketidaksesuaian Barang (21-28).') + \
           ' Status resmi = status lapangan (genba). Sumber: Google Sheets, dibaca 2026-11-09.'
    if code == 'JKT':
        note += ' Jakarta diaudit di tiga lokasi: Tj. Priok, Semper, Marcen.'
    return dict(site=code, sheet='AREA', template='MDN_TEMPLATE' if mdn else 'JKT_TEMPLATE', note=note, sop_refs=T['sop_refs'],
                sections=[dict(x) for x in T['seksi']], items=items)
for code in [x['code'] for x in SRC['sites']]:
    if code in AT['hasil']:
        sheets.append(area_sheet(code))

# sheet CY Handling Medan (SOP-OPS-CY-001), dibaca dari Google Sheets
MCY = {'COMPLY': 'COMPLY', 'NON-COMPLY': 'NON-COMPLY', 'N/A': 'N/A'}
sheets.append(dict(site='MDN', sheet='CY', template='MDN_TEMPLATE',
    note='Sheet CY HANDLING MEDAN (SOP-OPS-CY-001), 27 langkah. Status resmi = status lapangan (genba); status dokumen disimpan terpisah. Sumber: Google Sheets, dibaca 2026-11-02.',
    sop_refs=[CYSRC['sop']], sections=[dict(x) for x in CYSRC['seksi']],
    items=[dict(no=x['no'], section=x['section'], sop_ref=x['sop_ref'], category=x['category'], criterion=x['criterion'], actor=x['actor'],
                status=MCY[x['status_genba']], doc_status=MCY[x['status_doc']], finding=x['finding'], auditor_note='', qa_flag='',
                actor_actual='', root_cause='') for x in CYSRC['langkah']]))

# sheet CY Handling untuk cabang ber-template HO: alur dari pemetaan proses CY MKT, dianggap BELUM DIAUDIT
PM = json.loads((ROOT / 'data/cy_mkt_pemetaan_source.json').read_text(encoding='utf-8'))
CYCAT = {'Pra-Kedatangan': 'DOC', 'Kedatangan di Gerbang': 'COMP', 'Lapor Dokumen': 'DOC', 'Gate In': 'SYS', 'Inspeksi Container': 'COMP',
         'Bongkar dan Penumpukan': 'OPS', 'Update Lokasi': 'SYS', 'Gate Out Truck': 'COMP', 'Muat Container': 'OPS', 'Konfirmasi Muat': 'SYS', 'Gate Out': 'COMP'}
def cy_pending_sheet(code):
    secs, items, n = [], [], 0
    for al in PM['alur']:
        sid = 'CY' + al['id']
        first = n + 1
        for t in al['tahap']:
            n += 1
            note = f"Gate otomatis ({', '.join(t['pic_otomatis']) or 'tanpa PIC'}): {t['otomatis']}" + (f" Catatan: {t['catatan']}" if t['catatan'] else '')
            items.append(dict(no=n, section=sid, sop_ref='SOP-OPS-CY-001 (draf)' + (', usulan' if t.get('usulan') else ''), category=CYCAT[t['tahap']],
                criterion=f"{t['tahap']}: {t['manual']}", actor=' / '.join(t['pic_manual']), status='PENDING', doc_status=None, finding='',
                auditor_note=note, qa_flag='', actor_actual='', root_cause=''))
        secs.append(dict(id=sid, name=al['nama'], sop='SOP-OPS-CY-001 (draf)', from_no=first, to_no=n))
    return dict(site=code, sheet='CY', template='JKT_TEMPLATE',
                note='Alur CY Handling diambil dari pemetaan proses CY MKT (draf, area MKT Medan). Belum diaudit di cabang ini. Aktor dan dokumen mengikuti varian Gate Manual; varian Gate Otomatis ada di catatan tiap langkah.',
                sop_refs=['SOP-OPS-CY-001 (draf)'], sections=secs, items=items)
for code in [x['code'] for x in SRC['sites'] if x['template'] == 'JKT_TEMPLATE']:
    sheets.append(cy_pending_sheet(code))

sites = [{k: s[k] for k in ('code', 'name', 'audit_no', 'date', 'template') if k in s} | {'note': s.get('note', ''), 'units': s.get('units', {}),
         'sheets': [x['sheet'] for x in sheets if x['site'] == s['code']]} for s in SRC['sites']]
for x in sites:
    if x['code'] == 'JKT':
        x['lead_auditor'] = V2['meta']['lead_auditor']
        x['units'] = dict(x['units'], AREA=AT_UNITS)
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
    if s['site'] == 'JKT' and s['sheet'] == 'AREA':
        for loc in AT_UNITS:
            c = tally(s['items'], lambda i: i['status'][loc]); print(s['site'], s['sheet'], loc, c, f"{c['COMPLY']/max(1,c['COMPLY']+c['NON-COMPLY'])*100:.1f}%")
    elif s['site'] == 'JKT' and s['sheet'] == 'DC':
        for loc in ('SEMPER', 'MARCEN', 'DOKUMEN'):
            c = tally(s['items'], lambda i: i['status'][loc]); print(s['site'], s['sheet'], loc, c, f"{c['COMPLY']/max(1,c['COMPLY']+c['NON-COMPLY'])*100:.1f}%")
    else:
        c = tally(s['items']); print(s['site'], s['sheet'], len(s['items']), c, f"{c['COMPLY']/max(1,c['COMPLY']+c['NON-COMPLY'])*100:.1f}%")
