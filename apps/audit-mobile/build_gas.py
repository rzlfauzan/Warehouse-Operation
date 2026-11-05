"""Bangun file Apps Script dari data repo.
- gas/Data.html : master langkah + hasil audit Agustus–September 2026 (dari data/audit_dataset_v3.json)
- gas/Alur.html : halaman Alur, Peta & Gap (dari dist/mkt_audit_sop.html) dengan tema WMS, mode terang saja
- dist/audit_mobile_mockup.html + dist/audit_mobile_alur.html : pratinjau dengan server tiruan (preview_mock.js)
Jalankan: python3 apps/audit-mobile/build_gas.py  (jalankan scripts/build.py dulu bila halaman Alur berubah)"""
import json, pathlib, re
H = pathlib.Path(__file__).resolve().parent; R = H.parents[1]
d = json.loads((R/'data/audit_dataset_v3.json').read_text())
AB = {'COMPLY':'C','NON-COMPLY':'NC','N/A':'NA','PENDING':'P'}
ab = lambda v: AB.get(v) if isinstance(v, str) else None

# ---------- Data.html ----------
sites = [{k:s[k] for k in ('code','name','audit_no','date','sheets','template')}
         | {'units': s.get('units', {}), 'lead': s.get('lead_auditor', '')} for s in d['sites']]
sheets = []
for s in d['sheets']:
    secs = [{'id':x['id'],'name':x['name'],'sop':x['sop'],
             'opt': (s['sheet']=='CY' and s['template']=='JKT_TEMPLATE') or (s['sheet'],x['id'])==('TRUCKING','T2')} for x in s['sections']]
    items = []
    for i in s['items']:
        st = i['status']
        if isinstance(st, dict):  # DC Jakarta: status per lokasi, DOKUMEN = status dokumen
            prev = {u.lower(): {'g':ab(st.get(u)),'d':ab(st.get('DOKUMEN')),'f':i.get('finding_'+u.lower(),'') or i.get('finding',''),
                                'aa':i.get('actor_actual','')} for u in ('SEMPER','MARCEN')}
        else:
            prev = {'g':ab(st),'d':ab(i.get('doc_status')),'f':i.get('finding',''),'aa':i.get('actor_actual','')}
        items.append({'n':i['no'],'s':i['section'],'k':i['category'],'c':i['criterion'],'a':i['actor'],'r':i['sop_ref'],'p':prev})
    sheets.append({'site':s['site'],'sheet':s['sheet'],'template':s['template'],'sections':secs,'items':items})
payload = json.dumps({'lead': d['meta'].get('lead_auditor',''), 'sites':sites, 'sheets':sheets},
                     ensure_ascii=False, separators=(',',':')).replace('</','<\\/')
data_html = ('<script>\n/* Dibangun otomatis oleh apps/audit-mobile/build_gas.py — jangan diedit manual. */\n'
             'const DATA = ' + payload + ';\n</script>\n')
(H/'gas/Data.html').write_text(data_html)

# ---------- Alur.html: halaman gabungan Alur/Peta/Gap bertema WMS ----------
U = (R/'dist/mkt_audit_sop.html').read_text()
U = re.sub(r'@media \(prefers-color-scheme: dark\)\{:root:not\(\[data-theme="light"\]\)\{.*?\}\}\n', '', U, flags=re.S)
U = re.sub(r':root\[data-theme="dark"\]\{.*?\}\n', '', U, flags=re.S)
assert 'prefers-color-scheme' not in U and 'data-theme="dark"' not in U
WMS_ROOT = """:root{
  color-scheme:light;
  --bg:#FAFAFA; --surface:#ffffff; --surface2:#F5F5F5; --fg:#0A0A0A; --muted:#6B6B70; --line:#E7E7E7;
  --accent:#ED1C24; --accent-fg:#ffffff; --s1:#ED1C24; --grid:#EEEEEE;
  --ok:#2A9D6F; --ok-bd:#2A9D6F; --ok-bg:#EAF6F0; --ok-fg:#14563C;
  --nc:#ED1C24; --nc-bd:#ED1C24; --nc-bg:#FFF1F2; --nc-fg:#9B0F15;
  --na:#8C8C8C; --na-bd:#8C8C8C; --na-bg:#F5F5F5; --na-fg:#434343;
  --flag:#FDB913; --flag-fg:#8A5A00; --ta:#ED1C24; --tb:#6250d6; --tc:#8A5A00; --sig:#7a3d9e;
  --in:#8A5A00; --in-bg:#FFF8E1; --out:#14563C; --out-bg:#EAF6F0;
  --a-G:#2563a8; --a-P:#0b8a8c; --a-D:#c2561a; --a-B:#b0247a;
  --f-display:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif; --f-body:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;
  --f-mono:'JetBrains Mono',ui-monospace,Menlo,monospace;
}"""
U, n = re.subn(r':root\{\n  --bg:.*?\n\}', lambda m: WMS_ROOT, U, count=1, flags=re.S)
assert n == 1
U = U.replace('family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&', 'family=Plus+Jakarta+Sans:wght@400;500;600;700&')
BAR_CSS = """#themeBtn{display:none!important}
thead th{background:#FFFBEB!important;color:#461902!important}
.wmsbar{display:flex;align-items:center;gap:12px;height:56px;background:#fff;border-bottom:1px solid var(--line);margin:0 0 12px}
.wmsbar .lg{width:30px;height:30px;border-radius:8px;background:#ED1C24;color:#fff;font:700 12px/30px var(--f-body);text-align:center;flex:none}
.wmsbar b{font:600 15px var(--f-body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wmsbar .back{margin-left:auto;height:36px;padding:0 16px;border-radius:40px;border:1px solid #ED1C24;color:#ED1C24;background:#fff;
  font:600 13px var(--f-body);text-decoration:none;display:inline-flex;align-items:center;cursor:pointer;white-space:nowrap}
.wmsbar .back:hover{background:#FFF1F2}
</style>"""
U = U.replace('</style>', BAR_CSS, 1)
assert '<?' not in U
cut = U.index('</style>') + len('</style>')
head, rest = U[:cut].replace('<title>Audit SOP MKT</title>\n', ''), U[cut:]
def page(extra_head, bar):
    return ('<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n<meta name="color-scheme" content="light">\n'
            + extra_head + head + '\n</head>\n<body>\n' + bar + rest + '\n</body>\n</html>\n')
bar = '<div class="wmsbar"><span class="lg">MKT</span><b>Alur, Peta &amp; Gap SOP</b>{}</div>\n'
(H/'gas/Alur.html').write_text(page('<base target="_top">\n',
    bar.format('<a class="back" href="<?= appUrl ?>" target="_top">← Form audit</a>')))
(R/'dist/audit_mobile_alur.html').write_text(page(
    '<title>MKT Alur &amp; Gap SOP</title>\n<meta name="viewport" content="width=device-width, initial-scale=1">\n',
    bar.format('<button class="back" type="button" onclick="history.back()">← Form audit</button>')))

# ---------- pratinjau form audit ----------
idx = (H/'gas/Index.html').read_text()
app = (H/'gas/App.html').read_text()
mock = '<script>\n' + (H/'preview_mock.js').read_text() + '</script>\n'
body = (idx.replace("<?!= include('Data') ?>", data_html + mock).replace("<?!= include('App') ?>", app)
           .replace('<?= alurUrl ?>', 'audit_mobile_alur.html').replace(' target="_top" class="navlink"', ' class="navlink"'))
head2 = re.search(r'<head>(.*?)</head>', body, re.S).group(1)
head2 = head2.replace('<base target="_top">\n', '').replace('<meta charset="utf-8">\n', '')
main = re.search(r'<body>(.*?)</body>', body, re.S).group(1)
banner = '<div style="background:#FFF8E1;color:#8A5A00;font-size:12px;padding:6px 16px;text-align:center">Pratinjau: server tiruan, isian hanya di browser ini.</div>\n'
prev = '<title>MKT Audit SOP Mobile</title>\n' + head2 + banner + main
assert '<?' not in prev
(R/'dist/audit_mobile_mockup.html').write_text(prev)
print('Data.html', len(data_html)//1024, 'KB; Alur.html', len(U)//1024, 'KB; pratinjau', len(prev)//1024, 'KB')
