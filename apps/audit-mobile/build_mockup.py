"""Bangun mockup form audit HP (gaya WMS) dari data/audit_dataset_v3.json.
Output: dist/audit_mobile_mockup.html. Hasil audit sebelumnya hanya dipakai sebagai petunjuk per langkah."""
import json, pathlib
R = pathlib.Path(__file__).resolve().parents[2]
d = json.loads((R/'data/audit_dataset_v3.json').read_text())
AB = {'COMPLY':'C','NON-COMPLY':'NC','N/A':'NA','PENDING':'P'}
def ab(v): return AB.get(v) if isinstance(v,str) else None
OPT = {('CY',None), ('TRUCKING','T2')}   # disiapkan, belum pernah diaudit
sites = [{k:s[k] for k in ('code','name','audit_no','date','sheets','template')} | {'units':s.get('units',{})} for s in d['sites']]
sheets = []
for s in d['sheets']:
    secs = []
    for x in s['sections']:
        opt = (s['sheet']=='CY' and s['template']=='JKT_TEMPLATE') or (s['sheet'],x['id']) in OPT
        secs.append({'id':x['id'],'name':x['name'],'sop':x['sop'],'opt':opt})
    items = []
    for i in s['items']:
        st = i['status']
        if isinstance(st, dict):  # JKT DC per unit
            prev = {u.lower():{'g':ab(st.get(u)),'d':ab(st.get('DOKUMEN')),'f':i.get('finding_'+u.lower(),'') or i.get('finding','')} for u in ('SEMPER','MARCEN')}
        else:
            prev = {'g':ab(st),'d':ab(i.get('doc_status')),'f':i.get('finding','')}
        items.append({'n':i['no'],'s':i['section'],'k':i['category'],'c':i['criterion'],'a':i['actor'],'r':i['sop_ref'],'p':prev})
    sheets.append({'site':s['site'],'sheet':s['sheet'],'sections':secs,'items':items})
payload = json.dumps({'sites':sites,'sheets':sheets}, ensure_ascii=False, separators=(',',':'))
tpl = (R/'apps/audit-mobile/mockup.tpl.html').read_text()
out = R/'dist/audit_mobile_mockup.html'
out.write_text(tpl.replace('__DATA__', payload.replace('</','<\\/')))
print(out, len(out.read_text())//1024, 'KB')
