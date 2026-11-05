"""Bangun file Apps Script dari data repo.
- gas/Data.html  : master langkah + hasil audit sebelumnya (dari data/audit_dataset_v3.json)
- dist/audit_mobile_mockup.html : pratinjau tampilan final dengan server tiruan (preview_mock.js), untuk dibuka di HP/Artifact.
Jalankan: python3 apps/audit-mobile/build_gas.py"""
import json, pathlib, re
H = pathlib.Path(__file__).resolve().parent; R = H.parents[1]
d = json.loads((R/'data/audit_dataset_v3.json').read_text())
AB = {'COMPLY':'C','NON-COMPLY':'NC','N/A':'NA','PENDING':'P'}
ab = lambda v: AB.get(v) if isinstance(v, str) else None
sites = [{k:s[k] for k in ('code','name','audit_no','date','sheets','template')} | {'units': s.get('units', {})} for s in d['sites']]
sheets = []
for s in d['sheets']:
    secs = [{'id':x['id'],'name':x['name'],'sop':x['sop'],
             'opt': (s['sheet']=='CY' and s['template']=='JKT_TEMPLATE') or (s['sheet'],x['id'])==('TRUCKING','T2')} for x in s['sections']]
    items = []
    for i in s['items']:
        st = i['status']
        if isinstance(st, dict):
            prev = {u.lower(): {'g':ab(st.get(u)),'d':ab(st.get('DOKUMEN')),'f':i.get('finding_'+u.lower(),'') or i.get('finding','')} for u in ('SEMPER','MARCEN')}
        else:
            prev = {'g':ab(st),'d':ab(i.get('doc_status')),'f':i.get('finding','')}
        items.append({'n':i['no'],'s':i['section'],'k':i['category'],'c':i['criterion'],'a':i['actor'],'r':i['sop_ref'],'p':prev})
    sheets.append({'site':s['site'],'sheet':s['sheet'],'sections':secs,'items':items})
payload = json.dumps({'sites':sites,'sheets':sheets}, ensure_ascii=False, separators=(',',':')).replace('</','<\\/')
data_html = '<script>\n/* Dibangun otomatis oleh apps/audit-mobile/build_gas.py — jangan diedit manual. */\nconst DATA = ' + payload + ';\n</script>\n'
(H/'gas/Data.html').write_text(data_html)
# pratinjau: Index + Data + mock + App, tanpa scriptlet
idx = (H/'gas/Index.html').read_text()
app = (H/'gas/App.html').read_text()
mock = '<script>\n' + (H/'preview_mock.js').read_text() + '</script>\n'
body = idx.replace("<?!= include('Data') ?>", data_html + mock).replace("<?!= include('App') ?>", app)
head = re.search(r'<head>(.*?)</head>', body, re.S).group(1)
head = head.replace('<base target="_top">\n','').replace('<meta charset="utf-8">\n','')
main = re.search(r'<body>(.*?)</body>', body, re.S).group(1)
banner = '<div style="background:#FFF6DA;color:#8A5A00;font-size:12px;padding:6px 16px;text-align:center">Pratinjau: server tiruan, isian hanya di browser ini.</div>\n'
prev = '<title>MKT Audit SOP Mobile</title>\n' + head + banner + main
(R/'dist/audit_mobile_mockup.html').write_text(prev)
assert '<?' not in prev
print('Data.html', len(data_html)//1024, 'KB; pratinjau', len(prev)//1024, 'KB')
