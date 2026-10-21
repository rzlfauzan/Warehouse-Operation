"""Catatan: skrip sejarah. Memuat langkah yang menurunkan audit_dataset_jkt_v2.json dari sumber (pindah E6 ke sheet TRUCKING, tambah draf penarikan full container). Tidak dijalankan lagi; hasilnya sudah disimpan di data/audit_dataset_jkt_v2.json. Path di dalamnya merujuk folder sementara dan tidak akan jalan apa adanya."""
import json,re
B='/tmp/claude-0/-home-user/05ab2ce3-8507-5197-b8bd-312cc2cd866f/scratchpad/'
d=json.load(open('/root/.claude/uploads/05ab2ce3-8507-5197-b8bd-312cc2cd866f/13059533-audit_dataset_jkt.json'))
for s in d['sheets']: s['site']=d['meta']['site']

# ---- sheet baru: draft dari Pendahuluan SOP Penarikan Full Container ke UTC Rev.01
SOP='SOP Penarikan Full Container ke UTC Rev.01'
STAFF='Staff Container & Trucking'
rows=[ # no, section, sop_ref, cat, actor, criterion
 (1,'T1','Ruang Lingkup 2','DOC',STAFF,'Terima dokumen penarikan: Kartu Ekspor (KE), PKBE, Survey Pelayaran, Export Summary List'),
 (2,'T1','Ruang Lingkup 2','DOC',STAFF,'Cek kelengkapan dan kesesuaian dokumen penarikan'),
 (3,'T1','Definisi 3b','DOC',STAFF,'Export Summary List memuat jenis dan jumlah barang yang telah di-stuffing'),
 (4,'T1','Definisi 3a','DOC',STAFF,'Survey Pelayaran memuat kondisi container serta data kapal dan tujuan'),
 (5,'T2','Uraian 4a','OPS',STAFF,'Segel container diperiksa terpasang baik saat akan diberangkatkan dari gudang'),
 (6,'T2','Uraian 4b','OPS',STAFF,'Kondisi container diperiksa saat keluar dari gudang'),
 (7,'T2','Definisi 3c','DOC',STAFF,'Surat Jalan (SJT) diterbitkan gudang, menjelaskan container yang dibawa sopir ke UTPK/UTC'),
 (8,'T3','Ruang Lingkup 2','DOC',STAFF,'SPK ke vendor diterbitkan untuk penarikan ke CY UTPK/UTC'),
 (9,'T3','Uraian 4c','COMP',STAFF,'Penarikan dijadwalkan dengan memperhatikan closing time pelabuhan (hindari denda)'),
 (10,'T3','Uraian 4d','OPS',STAFF,'Komunikasi dua arah dengan sopir via HP selama penarikan'),
 (11,'T3','Uraian 4d','COMP','Sopir / Vendor','Sopir selalu bisa dihubungi via HP, termasuk saat meninggalkan truk'),
 (12,'T4','Uraian 4a','OPS',STAFF,'Segel dibandingkan dengan hasil pemeriksaan saat container diturunkan di CY UTPK'),
 (13,'T4','Uraian 4b','DOC',STAFF,'Kondisi container dibandingkan: EIR versi UTPK vs Surat Jalan gudang'),
 (14,'T4','Dokumen terkait 5g','DOC',STAFF,'Selisih dicatat dengan IK Discrepancies penarikan full container ke UTC'),
]
# E6 (penarikan empty) dipindah dari sheet EXPORT ke TRUCKING; no baru berurutan, no asli disimpan di orig_no
ex=[x for x in d['sheets'] if x['sheet']=='EXPORT'][0]
sec6=[x for x in ex['sections'] if x['id']=='E6'][0]
e6=sorted([x for x in ex['items'] if x['section']=='E6'],key=lambda x:x['no'])
ex['items']=[x for x in ex['items'] if x['section']!='E6']
ex['sections']=[x for x in ex['sections'] if x['id']!='E6']
empty=[]
for k,x in enumerate(e6,1):
    y=dict(x);y.update(no=k,orig_no=x['no'],orig_sheet='Export',section='T1');empty.append(y)
SHIFT=len(empty);SEC={'T1':'T2','T2':'T2','T3':'T2','T4':'T2'}
full=[dict(no=n+SHIFT,sop_ref=r,category=c,criterion=k,actor=a,status='PENDING',finding='',qa_flag='',section=SEC[sec]) for n,sec,r,c,a,k in rows]
items=empty+full
oldsecs=[('T1','Penerimaan & Pengecekan Dokumen',1,4),('T2','Pemeriksaan Segel & Kondisi Sebelum Berangkat',5,7),
      ('T3','SPK Vendor & Penarikan ke UTPK/UTC',8,11),('T4','Penerimaan di CY UTPK & Pembandingan',12,14)]
secs=[('T1',sec6['name'],1,SHIFT,sec6['sop'])]+[('T2','Penarikan Full Container ke CY Pelabuhan (UTPK/UTC)',1+SHIFT,14+SHIFT,SOP)]
d['sheets'].append(dict(sheet='TRUCKING',site=d['meta']['site'],sop_refs=['SOP-OPS-005',SOP],
  note='Penarikan empty container (langkah 1-%d) sudah diaudit; asalnya langkah Export 37-44 dan dipindah ke sini. Penarikan full container (langkah %d-%d) belum diaudit: draf checklist dari Pendahuluan SOP butir 1 sampai 5, butir 6 Prosedur belum diterima sehingga langkah, aktor, dan urutan perlu disesuaikan.'%(SHIFT,SHIFT+1,len(items)),
  sections=[dict(id=i,name=n,sop=p,from_no=a,to_no=b) for i,n,a,b,p in secs],items=items))
d['meta']['dates']['TRUCKING']='2026-08-04 (penarikan empty); penarikan full belum diaudit'
j=json.dumps(d,ensure_ascii=False).replace('</','<\\/')

# ---- peta proses audit
s=open(B+'tpl.html').read()
def rep(a,b):
    global s
    assert s.count(a)==1,a; s=s.replace(a,b)
rep(".sw.na{background:var(--na-bg);border-color:var(--na-bd)}",".sw.na{background:var(--na-bg);border-color:var(--na-bd)} .sw.pe{background:var(--surface);border-color:var(--muted)}")
rep(".sec-c .na{color:var(--na-bd)}",".sec-c .na{color:var(--na-bd)} .sec-c .pe{color:var(--muted)}")
rep(".node.na{background:var(--na-bg);border-color:var(--na-bd);color:var(--na-fg)}",".node.na{background:var(--na-bg);border-color:var(--na-bd);color:var(--na-fg)}\n.node.pe{background:var(--surface);border-color:var(--muted);color:var(--muted)}\n.banner{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--muted);border-radius:6px;padding:10px 14px;font-size:13px;color:var(--muted)}")
rep(".pill.ok{",".pill.pe{background:var(--surface);border-color:var(--muted);color:var(--muted)}\n.pill.ok{")
rep("const CLS={'COMPLY':'ok','NON-COMPLY':'nc','N/A':'na'};","const CLS={'COMPLY':'ok','NON-COMPLY':'nc','N/A':'na','PENDING':'pe'};\nconst SHEETN={EXPORT:'Export',IMPORT:'Import',DC:'DC (Distribution Center)',TRUCKING:'Trucking Support'};")
rep("let c=0,n=0,na=0;items.forEach(i=>{const s=fn(i);if(s==='COMPLY')c++;else if(s==='NON-COMPLY')n++;else na++});\n  return {c,n,na,",
    "let c=0,n=0,na=0,pe=0;items.forEach(i=>{const s=fn(i);if(s==='COMPLY')c++;else if(s==='NON-COMPLY')n++;else if(s==='PENDING')pe++;else na++});\n  return {c,n,na,pe,")
rep("['EXPORT','IMPORT','DC'].map(s=>[s,s==='DC'?'DC (Distribution Center)':s[0]+s.slice(1).toLowerCase(),!avail.includes(s)])","['EXPORT','IMPORT','DC','TRUCKING'].map(s=>[s,SHEETN[s],!avail.includes(s)])")
rep("  const rep=pct(sh.items,rawStatus);\n","""  if(sh.items.every(i=>i.status==='PENDING')){
    $('kpis').innerHTML=`<div class="kpi"><div class="v">${sh.items.length}</div><div class="l">langkah SOP (draft)</div></div>`+
      `<div class="kpi"><div class="v">${sh.items.length}</div><div class="l">belum diaudit</div></div>`+
      `<div class="kpi"><div class="v">${sh.items.filter(i=>i.category==='DOC').length}</div><div class="l">langkah berbasis dokumen</div></div>`;
    return;
  }
  const rep=pct(sh.items,rawStatus);
""")
rep('<span class="ok">${cs.c} C</span><span class="nc">${cs.n} NC</span><span class="na">${cs.na} NA</span></span>','${cs.pe===items.length?\'\':`<span class="ok">${cs.c} C</span><span class="nc">${cs.n} NC</span><span class="na">${cs.na} NA</span>`}${cs.pe?`<span class="pe">${cs.pe} belum diaudit</span>`:\'\'}</span>')
rep("<i style=\"color:var(--muted)\">Tidak ada catatan temuan.</i>","<i style=\"color:var(--muted)\">'+(effStatus(it)==='PENDING'?'Belum diaudit. Item ini diturunkan dari Pendahuluan SOP, bukan dari langkah Prosedur.':'Tidak ada catatan temuan.')+'</i>")
rep("audit ${esc(dt)} ·","${dt?'audit '+esc(dt):'<b>belum diaudit</b>'} ·")
rep("  renderKpis(sh);renderBoard(sh);","  $('banner').hidden=!sh.note;$('banner').textContent=sh.note||'';\n  renderKpis(sh);renderBoard(sh);")
rep('<div class="kpis" id="kpis"></div>','<div class="kpis" id="kpis"></div>\n  <div class="banner" id="banner" hidden></div>')
rep('<span><i class="sw na"></i>N/A</span>','<span><i class="sw na"></i>N/A</span>\n    <span><i class="sw pe"></i>Belum diaudit</span>')
# tooltip for pending nodes
rep("if(f)h+=`<br>${esc(f)}`;else if(s==='NON-COMPLY')","if(s==='PENDING')h+='<br><i>Belum diaudit</i>';else if(f)h+=`<br>${esc(f)}`;else if(s==='NON-COMPLY')")
open(B+'peta_proses_audit_sop.html','w').write(s.replace('__DATA__',j))

