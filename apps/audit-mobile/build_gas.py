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
        if isinstance(st, dict):  # Jakarta per lokasi: DC (Semper, Marcen; DOKUMEN = status dokumen), Area Terbatas (Tj. Priok, Semper, Marcen)
            fu = i.get('finding_units') or {}
            prev = {u.lower(): {'g':ab(st.get(u)),'d':ab(st.get('DOKUMEN')),'f':fu.get(u) or i.get('finding_'+u.lower(),'') or i.get('finding',''),
                                'aa':i.get('actor_actual','')} for u in st if u != 'DOKUMEN'}
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
  --bg:#FEFDFB; --surface:#ffffff; --surface2:#F3F2ED; --fg:#1D1C1A; --muted:#6B6862; --line:#E6E3DA;
  --accent:#1D1C1A; --accent-fg:#ffffff; --s1:#3355FF; --grid:#EEECE5;
  --ok:#1F8A5B; --ok-bd:#1F8A5B; --ok-bg:#E3F4EA; --ok-fg:#145C3C;
  --nc:#D93025; --nc-bd:#D93025; --nc-bg:#FDECEA; --nc-fg:#8E1C15;
  --na:#8C887F; --na-bd:#8C887F; --na-bg:#F3F2ED; --na-fg:#4A4741;
  --flag:#CBD810; --flag-fg:#5C6300; --ta:#3355FF; --tb:#6250d6; --tc:#8A6A00; --sig:#7a3d9e;
  --in:#8A6A00; --in-bg:#FBF3D2; --out:#145C3C; --out-bg:#E3F4EA;
  --a-G:#3355FF; --a-P:#0b8a8c; --a-D:#c2561a; --a-B:#b0247a;
  --f-display:'Plus Jakarta Sans',ui-sans-serif,system-ui,Arial,sans-serif; --f-body:'Plus Jakarta Sans',ui-sans-serif,system-ui,Arial,sans-serif;
  --f-mono:'JetBrains Mono',ui-monospace,Menlo,monospace;
}"""
U, n = re.subn(r':root\{\n  --bg:.*?\n\}', lambda m: WMS_ROOT, U, count=1, flags=re.S)
assert n == 1
U = U.replace('family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&', 'family=Plus+Jakarta+Sans:wght@400;500;600;700&')
BAR_CSS = """#themeBtn{display:none!important}
body{background:var(--bg)}
h1,h2,h3{letter-spacing:-.03em}
thead th{background:#F3F2ED!important;color:#1D1C1A!important;font-weight:500}
.wmsbar{position:sticky;top:8px;z-index:40;display:flex;align-items:center;gap:10px;height:58px;padding:0 10px 0 8px;margin:8px 0 16px;
  background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border:1px solid var(--line);border-radius:999px;box-shadow:0 1px 2px rgba(29,28,26,.04),0 8px 24px rgba(29,28,26,.06)}
.wmsbar .lg{width:50px;height:30px;border-radius:4px;object-fit:cover;flex:none;box-shadow:0 0 0 1px var(--line)}
.wmsbar .ttl{display:flex;flex-direction:column;line-height:1.1;min-width:0}
.wmsbar .ttl small{color:#16A0A6;font:700 11px var(--f-body);letter-spacing:.08em;white-space:nowrap}
.wmsbar .ttl b{color:#1B3A57;font:700 18px var(--f-body);letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* kontrol diseragamkan dengan form audit */
.wrap > header h1{font-weight:600;letter-spacing:-.035em}
.gbar{border-radius:24px;padding:14px 16px;gap:10px 16px}
.lab{font-family:var(--f-body);letter-spacing:.06em}
.seg{border:0;border-radius:0;overflow:visible;background:transparent;gap:6px}
.seg button{border:0!important;border-radius:999px;background:#F3F2ED;padding:8px 14px;font-weight:500;font-size:13.5px}
.seg button:hover{background:#EAE8E0}
.seg button[aria-pressed="true"]{background:#EEF5A6;color:#1D1C1A}
.tabs{border-bottom:1px solid var(--line);gap:6px;padding-block:6px 0}
.tabs button{font-family:var(--f-body);font-size:16px;font-weight:600;letter-spacing:-.01em;border-radius:12px 12px 0 0}
.tabs button[aria-selected="true"]{border-bottom-color:#1D1C1A}
.achip,.chip{border:0;background:#F3F2ED;padding:7px 14px}
.achip[aria-pressed="true"],.chip[aria-pressed="true"]{background:#EEF5A6;box-shadow:none}
.pfoot{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#0D0403;color:#fff;padding:18px 24px;margin-top:32px}
.pfoot b{font:700 13px var(--f-body);letter-spacing:.03em}
.pfoot a{color:#fff;text-decoration:none;font:400 14px var(--f-body)}
.wmsbar .back{margin-left:auto;height:40px;padding:0 16px;border-radius:12px;border:0;color:#fff;background:#1D1C1A;
  font:500 14px var(--f-body);text-decoration:none;display:inline-flex;align-items:center;cursor:pointer;white-space:nowrap}
.wmsbar .back:hover{background:#000}
</style>"""
U = U.replace('</style>', BAR_CSS, 1)
EN = [('<h1>Audit SOP MKT</h1>','<h1>Business Process</h1>'),
      ('data-tab="alur" id="tab-alur">Alur Proses Umum<','data-tab="alur" id="tab-alur">Process Flow<'),
      ('data-tab="peta" id="tab-peta">Peta Proses Audit SOP<','data-tab="peta" id="tab-peta">Audit Process Map<'),
      ('<h2>Compliance per proses</h2>','<h2>Compliance by process</h2>'),
      ('<h2>Jenis gap dan penanggung jawab</h2>','<h2>Gap types and owners</h2>'),
      ('<h2>Catatan di luar NON-COMPLY</h2>','<h2>Notes outside NON-COMPLY</h2>'),
      ('<h2>Matriks langkah x cabang</h2>','<h2>Step by branch matrix</h2>'),
      ('<h2>Pemetaan langkah Medan ke SOP HO</h2>','<h2>Medan steps mapped to HO SOP</h2>'),
      ('<h2>Heatmap tahap proses x status</h2>','<h2>Stage by status heatmap</h2>'),
      ('<h2>Peringkat NON-COMPLY</h2>','<h2>NON-COMPLY ranking</h2>'),
      ('<h2>Tema gap lintas proses</h2>','<h2>Cross-process gap themes</h2>'),
      ('<h2>Daftar temuan</h2>','<h2>Findings</h2>')]
for a, b in EN:
    assert U.count(a) == 1, a
    U = U.replace(a, b)
assert '<?' not in U
cut = U.index('</style>') + len('</style>')
head, rest = U[:cut].replace('<title>Audit SOP MKT</title>\n', ''), U[cut:]
def page(extra_head, bar):
    return ('<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n<meta name="color-scheme" content="light">\n'
            + extra_head + head + '\n</head>\n<body>\n' + bar + rest + '\n' + FOOT + '</body>\n</html>\n')
LOGO = (H/'assets/logo_datauri.txt').read_text().strip()
bar = '<div class="wmsbar"><img class="lg" src="' + LOGO + '" alt="Samudera Indonesia" width="50" height="30"><div class="ttl"><small>PORTAL OPERASIONAL</small><b>Audit SOP Operasional</b></div>{}</div>\n'
FOOT = '<footer class="pfoot"><b>PT MASAJI KARGOSENTRA TAMA</b><a href="https://samudera.id" target="_blank" rel="noopener">samudera.id</a></footer>\n'
(H/'gas/Alur.html').write_text(page('<base target="_top">\n',
    bar.format('<a class="back" href="<?= appUrl ?>" target="_top">Form audit →</a>')))
(R/'dist/audit_mobile_alur.html').write_text(page(
    '<title>MKT Business Process</title>\n<meta name="viewport" content="width=device-width, initial-scale=1">\n',
    bar.format('<button class="back" type="button" onclick="history.back()">Form audit →</button>')))

# ---------- pratinjau form audit ----------
idx = (H/'gas/Index.html').read_text()
app = (H/'gas/App.html').read_text()
mock = '<script>\n' + (H/'preview_mock.js').read_text() + '</script>\n'
body = (idx.replace("<?!= include('Data') ?>", data_html + mock).replace("<?!= include('App') ?>", app)
           .replace('<?= alurUrl ?>', 'audit_mobile_alur.html').replace(' target="_top" class="navlink"', ' class="navlink"'))
head2 = re.search(r'<head>(.*?)</head>', body, re.S).group(1)
head2 = head2.replace('<base target="_top">\n', '').replace('<meta charset="utf-8">\n', '')
main = re.search(r'<body>(.*?)</body>', body, re.S).group(1)
banner = '<div style="background:#EEF5A6;color:#1D1C1A;font-size:12px;padding:6px 16px;text-align:center">Pratinjau: server tiruan, isian hanya di browser ini.</div>\n'
prev = '<title>MKT Audit SOP Mobile</title>\n' + head2 + banner + main
assert '<?' not in prev
(R/'dist/audit_mobile_mockup.html').write_text(prev)
print('Data.html', len(data_html)//1024, 'KB; Alur.html', len(U)//1024, 'KB; pratinjau', len(prev)//1024, 'KB')
