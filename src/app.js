const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const PL=JSON.parse($('payload').textContent);
const DATA=PL.audit, FL=PL.flows, GC=PL.gap;

/* ===================== INTI BERSAMA ===================== */
const LOCS=['SEMPER','MARCEN','DOKUMEN'],LOCN={SEMPER:'Semper',MARCEN:'Marcen',DOKUMEN:'Dokumen'};
const PROCS=['EXPORT','IMPORT','TRUCKING','DC'];
const PROCN={EXPORT:'Export',IMPORT:'Import',TRUCKING:'Trucking Support',DC:'DC (Distribution Center)'};
const SHN={EXPORT:'Export',IMPORT:'Import',DC:'DC',TRUCKING:'Trucking'};
const CLS={'COMPLY':'ok','NON-COMPLY':'nc','N/A':'na','PENDING':'pe'};
const CATN=GC.CATN, FLAGTXT=GC.FLAGTXT, AREAS=FL.areas, FORCE=new Set(GC.FORCE), RCN=GC.RCN;
const SITES=DATA.sites;
const MAP=PL.map.map,REL=PL.map.meta.rel,CONF=PL.map.meta.conf;
const MAPBY={},HOIDX={};
MAP.forEach(m=>{MAPBY[m.sheet+'-'+m.no]=m;m.ho.forEach(h=>{(HOIDX[h.sheet+'-'+h.no]=HOIDX[h.sheet+'-'+h.no]||[]).push(m)})});
const siteInfo=c=>SITES.find(s=>s.code===c);
const tplOfSite=c=>siteInfo(c).template==='MDN_TEMPLATE'?'MDN':'HO';
const NA_OTHER='na_not_performed_by_mkt', RISK='integrity_risk_reported_by_auditor';
const adjOf=f=>!f?null:(f==='status_conflict_should_be_NA'||f==='status_conflict_role_not_exist')?'N/A':f.startsWith('status_conflict')?'NON-COMPLY':null;
const S={site:'JKT',lastSite:'JKT',view:'rep',dcloc:'ALL',tab:'alur',proc:'EXPORT',
  alur:{af:null,hl:null},peta:{focus:'all',sel:null,range:null,scrollTo:null},
  gap:{mx:{sheet:'EXPORT',onlyNc:false,sort:false},f:{gt:'',sec:'',actor:'',cat:'',sop:'',theme:'',mapStage:'',all:false,range:null}}};

const OBS=[];
DATA.sheets.forEach(s=>{
  const secs=Object.fromEntries(s.sections.map(x=>[x.id,x])),tpl=s.template==='MDN_TEMPLATE'?'MDN':'HO';
  s.items.forEach(it=>{
    const mk=(raw,loc,finding,doc)=>OBS.push({site:s.site,tpl,sheet:s.sheet,no:it.no,loc,sec:it.section,secName:secs[it.section].name,actor:it.actor,actual:it.actor_actual||'',cat:it.category,sop:it.sop_ref,crit:it.criterion,raw,doc:doc??null,flag:it.qa_flag||'',finding:finding||'',note:it.auditor_note||'',orig:it.orig_no?`Export ${it.orig_no}`:'',root:it.root_cause||''});
    if(s.site==='JKT'&&s.sheet==='DC'){
      mk(it.status.SEMPER,'SEMPER',it.finding_semper,it.status.DOKUMEN);
      mk(it.status.MARCEN,'MARCEN',it.finding_marcen,it.status.DOKUMEN);
      mk(it.status.DOKUMEN,'DOKUMEN',it.finding,null);
    }else mk(it.status,null,it.finding,it.doc_status);
  });
});
const STAGES=[];FL.procs.forEach(p=>p.phases.forEach(ph=>ph.stages.forEach(st=>STAGES.push(Object.assign({proc:p.key,phase:ph.name},st)))));
const stageOf=(sheet,no)=>STAGES.find(s=>s.sheet===sheet&&s.from<=no&&no<=s.to);
const sheetOf=code=>DATA.sheets.find(s=>s.sheet===code&&s.site===S.site);
const SECNAME={};DATA.sheets.forEach(s=>s.sections.forEach(x=>{SECNAME[(s.template==='MDN_TEMPLATE'?'MDN':'HO')+'|'+x.id]=x.id+' '+x.name}));
const inScope=o=>S.site==='ALL'||o.site===S.site;
const siteObs=()=>OBS.filter(inScope);
const scopeSites=()=>S.site==='ALL'?SITES.map(s=>s.code):[S.site];
const scopeTpls=()=>new Set(scopeSites().map(tplOfSite));
function locOk(o){if(o.loc===null)return true;if(S.dcloc==='ALL')return o.loc!=='DOKUMEN';return o.loc===S.dcloc}
const vis=()=>siteObs().filter(locOk);
const key=o=>o.sheet+'-'+o.no;
function eff(o){if(S.view==='adj'&&o.raw==='COMPLY'){const a=adjOf(o.flag);if(a)return a}return o.raw}
function gtype(o){
  if(o.flag===NA_OTHER)return 'd';
  if(o.tpl==='HO'){const g=GC.GT[key(o)];if(g)return g}
  const f=o.flag;
  if(f==='form_gap'||f==='improvement_note')return 'b';
  if(f.startsWith('sop_')||f==='status_conflict_should_be_NA'||f==='status_conflict_role_not_exist')return 'c';
  if(f)return 'a';
  return eff(o)==='NON-COMPLY'?'a':null;
}
const isTem=o=>eff(o)==='NON-COMPLY'||!!o.flag||(o.tpl==='HO'&&FORCE.has(key(o)));
const procOf=o=>o.sheet==='DC'&&o.site==='JKT'?'DC '+LOCN[o.loc]:SHN[o.sheet];
const pct=(c,n)=>c+n?c/(c+n)*100:null;
const fmt=x=>x==null?'-':x.toFixed(1).replace('.',',')+'%';
function tally(os,f){let c=0,n=0,na=0,pe=0;os.forEach(o=>{const s=f(o);if(s==='COMPLY')c++;else if(s==='NON-COMPLY')n++;else if(s==='PENDING')pe++;else na++});return{c,n,na,pe}}
const adjStatus=o=>{if(o.raw==='COMPLY'&&adjOf(o.flag))return adjOf(o.flag);return o.raw};
function mkSeg(el,items,cur,cb){el.innerHTML='';items.forEach(([v,label,dis])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=!!dis;b.setAttribute('aria-pressed',String(v===cur));b.onclick=()=>cb(v);el.appendChild(b)})}
function flash(el){if(!el)return;el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.remove('hl');void el.offsetWidth;el.classList.add('hl')}
function setSite(c){S.site=c;if(c!=='ALL')S.lastSite=c;S.peta.sel=null;S.peta.range=null;S.alur.hl=null;const sh=DATA.sheets.filter(s=>s.site===c);if(c!=='ALL'&&!sh.some(s=>s.sheet===S.proc))S.proc=(PROCS.find(p=>sh.some(s=>s.sheet===p)))||S.proc}

/* ---- navigasi antar tab ---- */
function go(tab,o={}){
  if(o.site)setSite(o.site);
  if(tab==='peta'&&S.site==='ALL')setSite(S.lastSite||'JKT');
  if(tab==='alur'){if(o.proc)S.proc=o.proc;S.alur.af=null;S.alur.hl=o.stage||null}
  if(tab==='peta'){if(o.proc)S.proc=o.proc;S.peta.range=o.range||null;S.peta.sel=o.sel??null;S.peta.focus='all';S.peta.scrollTo=o.sel??(o.range?o.range[0]:null);if(o.loc)S.dcloc=o.loc}
  if(tab==='gap'){const f=S.gap.f;Object.assign(f,{gt:'',sec:'',actor:'',cat:'',sop:'',theme:'',mapStage:'',range:null,all:!!o.all},o.f||{})}
  S.tab=tab;render();
  requestAnimationFrame(()=>{
    if(tab==='alur'&&S.alur.hl)flash(document.querySelector(`[data-stage="${S.alur.hl}"]`));
    else if(tab==='peta'&&S.peta.scrollTo!=null){flash(document.querySelector(`#peta-board .node[data-no="${S.peta.scrollTo}"]`));S.peta.scrollTo=null}
    else if(tab==='gap'&&o.f)$('gap-s7').scrollIntoView({behavior:'smooth',block:'start'});
    else window.scrollTo({top:0})
  });
}

/* ---- header ---- */
function renderHeader(){
  const multi=S.tab!=='peta';
  mkSeg($('siteSeg'),(multi?[['ALL','Semua cabang']]:[]).concat(SITES.map(s=>[s.code,s.name])),S.site,v=>{setSite(v);render()});
  [...$('viewSeg').children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===S.view)));
  const hasJkt=S.site==='JKT'||S.site==='ALL';
  const showLoc=hasJkt&&(S.tab==='gap'||S.proc==='DC');
  $('locSeg').hidden=!showLoc;$('locLab').hidden=!showLoc;
  mkSeg($('locSeg'),[['ALL','Semper + Marcen'],['SEMPER','Semper'],['MARCEN','Marcen'],['DOKUMEN','Dokumen']],S.dcloc,v=>{S.dcloc=v;render()});
  [...$('tabs').children].forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===S.tab)));
  ['alur','peta','gap'].forEach(t=>$('panel-'+t).hidden=t!==S.tab);
  const si=S.site==='ALL'?null:siteInfo(S.site);
  $('meta').innerHTML=si?`${esc(si.audit_no)} · <b>${esc(si.name)}</b> · audit ${esc(si.date)}${si.lead_auditor?' · '+esc(si.lead_auditor):''} · template ${tplOfSite(si.code)==='MDN'?'Medan (SOP berbeda)':'HO (SOP Utama)'}`:
    `<b>${SITES.length} cabang</b> · ${SITES.map(s=>esc(s.name)+' '+esc(s.date)).join(' · ')}`;
  const nb=$('sitenote');
  const notes=[];
  if(si){if(si.note)notes.push(si.note);if(tplOfSite(si.code)==='MDN')notes.push(DATA.meta.hq_sop_note)}
  nb.hidden=!notes.length;nb.innerHTML=notes.map(esc).join('<br>');
}
function render(){
  renderHeader();
  if(S.tab==='alur')renderAlur();else if(S.tab==='peta')renderPeta();else renderGap();
  try{history.replaceState(null,'','#'+S.tab)}catch(e){}
}

/* ===================== ALUR ===================== */
function stageObs(st){return siteObs().filter(o=>o.tpl==='HO'&&o.sheet===st.sheet&&o.no>=st.from&&o.no<=st.to&&locOk(o))}
function mdnBadge(st,prefix){
  const ms=MAP.filter(m=>m.ho.some(h=>h.sheet===st.sheet&&h.no>=st.from&&h.no<=st.to));
  const os=OBS.filter(o=>o.site==='MDN'&&ms.some(m=>m.sheet===o.sheet&&m.no===o.no));
  if(!os.length)return '<span class="ncb pe" title="Tidak ada langkah Medan yang dipetakan ke tahap ini">Medan: tidak ada</span>';
  const n=os.filter(o=>eff(o)==='NON-COMPLY').length;
  return `<button type="button" class="ncb${n?'':' z'}" data-gapmap="${st.id}" title="Pemetaan draf Medan ke SOP HO: ${os.length} langkah Medan masuk tahap ini. Klik untuk melihat.">${prefix}${n} NC*</button>`;
}
function ncBadge(st){
  if(S.site!=='ALL'&&tplOfSite(S.site)==='MDN')return mdnBadge(st,'');
  const os=stageObs(st),med=S.site==='ALL'?mdnBadge(st,'Medan '):'';
  if(!os.length)return '<span class="ncb pe">tidak diaudit</span>'+med;
  if(os.every(o=>eff(o)==='PENDING'))return '<span class="ncb pe">belum diaudit</span>'+med;
  const mk=(sub,lab,loc)=>{const n=sub.filter(o=>eff(o)==='NON-COMPLY').length;
    const per=S.site==='ALL'?SITES.filter(s=>tplOfSite(s.code)==='HO').map(s=>{const k=sub.filter(o=>o.site===s.code);return k.length?`${s.name} ${k.filter(o=>eff(o)==='NON-COMPLY').length}`:''}).filter(Boolean).join(' · '):'';
    return `<button type="button" class="ncb${n?'':' z'}" data-gap="${st.id}"${loc?` data-loc="${loc}"`:''} title="${esc(per||'Lihat temuan di Gap Analysis')}">${lab?lab+' ':''}${n} NC</button>`};
  if(st.sheet==='DC'&&S.dcloc==='ALL'&&S.site==='JKT')return ['SEMPER','MARCEN'].map(l=>mk(os.filter(o=>o.loc===l),LOCN[l],l)).join('');
  return mk(os,'','')+med;
}
function docs(list){return list.map(d=>`<li>${esc(d.t)}${d.sig?' <span class="sg" title="Memerlukan tanda tangan">✎ TTD</span>':''}</li>`).join('')}
function alurCard(st,idx,seq){
  const dim=S.alur.af&&!st.areas.includes(S.alur.af),mdn=S.site!=='ALL'&&tplOfSite(S.site)==='MDN';
  const ar=st.areas.map((a,i)=>`<span class="ar${i?'':' main'}" style="--c:var(--a-${a})" title="${i?'Area terlibat':'Area utama'}">${esc(AREAS[a])}</span>`).join('');
  return `<article class="card${seq?' seq':''}${st.cond?' cond':''}${dim?' dim':''}" data-stage="${st.id}" style="--ac:var(--a-${st.areas[0]})">
   <div class="c-h"><div class="areas">${ar}</div><div class="c-t"><span class="num${seq?'':' p'}">${seq?idx:'↻'}</span><div class="c-n">${esc(st.name)}${st.cond?` <span class="tag">${esc(st.cond)}</span>`:''}</div></div>
   <div class="pic">${st.pic.map(p=>`<span>${esc(p)}</span>`).join('')}</div></div>
   ${st.in.length?`<div class="cblk in"><div class="bl">Dokumen masuk</div><ul>${docs(st.in)}</ul></div>`:''}
   ${st.out.length?`<div class="cblk out"><div class="bl">Dokumen keluar</div><ul>${docs(st.out)}</ul></div>`:''}
   ${st.sys?`<div class="sys">${esc(st.sys)}</div>`:''}
   <div class="c-f"><span>${esc(st.sop)}</span>${mdn?`<span>langkah ${st.from}–${st.to} (HO)</span>`:`<button type="button" class="lnk" data-peta="${st.id}" title="Buka langkah audit di Peta">langkah ${st.from}–${st.to} →</button>`}${ncBadge(st)}</div></article>`;
}
function renderAlur(){
  const p=FL.procs.find(x=>x.key===S.proc);let idx=0;
  mkSeg($('alur-proc'),FL.procs.map(x=>[x.key,x.label]),S.proc,v=>{S.proc=v;S.alur.af=null;S.alur.hl=null;render()});
  const all=p.phases.flatMap(x=>x.stages);
  const present=Object.keys(AREAS).filter(a=>all.some(c=>c.areas.includes(a)));
  if(S.alur.af&&!present.includes(S.alur.af))S.alur.af=null;
  $('alur-af').innerHTML='<span class="lab">Area kerja</span>'+
    `<button type="button" class="achip" data-a="" aria-pressed="${!S.alur.af}">Semua <span class="n">${all.length}</span></button>`+
    present.map(a=>`<button type="button" class="achip" data-a="${a}" style="--c:var(--a-${a})" aria-pressed="${S.alur.af===a}"><i></i>${esc(AREAS[a])} <span class="n">${all.filter(c=>c.areas.includes(a)).length}</span></button>`).join('')+
    '<span style="font-size:12.5px;color:var(--muted)">Label penuh = area utama, label garis = area yang ikut terlibat</span>';
  $('alur-af').querySelectorAll('button').forEach(b=>b.onclick=()=>{S.alur.af=b.dataset.a||null;renderAlur()});
  const mdn=S.site!=='ALL'&&tplOfSite(S.site)==='MDN';
  $('alur-hq').hidden=!(mdn||S.site==='ALL');$('alur-hq').textContent=(mdn||S.site==='ALL')?'Alur di bawah mengacu SOP Utama di Head Office. Badge bertanda * memakai pemetaan draf langkah Medan ke langkah HO (belum dikonfirmasi pemilik SOP).':'';
  $('alur-intro').innerHTML='<span class="k"><i class="i"></i>Dokumen masuk: harus ada sebelum tahap dimulai</span><span class="k"><i class="o"></i>Dokumen keluar: dihasilkan tahap ini</span><span class="k"><i class="s">✎ TTD</i>perlu tanda tangan</span>'+
    '<span class="k">Klik "langkah" untuk membuka Peta, klik badge NC untuk membuka daftar temuan</span>';
  $('alur-flow').innerHTML=p.phases.map(ph=>`<section class="phase"><div class="ph-h"><span class="ph-n">${esc(ph.name)}</span><span class="ph-m">${esc(ph.meta)}</span></div>
    <div class="rowx">${ph.stages.map(st=>alurCard(st,ph.periodic?0:++idx,!ph.periodic)).join('')}</div></section>`).join('');
  $('alur-foot').textContent='Urutan kartu mengikuti alur kerja nyata di SOP HO. Nomor langkah audit mengikuti nomor di Peta Proses Audit SOP. Jumlah NC mengikuti pilihan cabang dan status di atas.'+(p.note?' '+p.note:'');
  $('alur-flow').querySelectorAll('[data-peta]').forEach(b=>b.onclick=()=>{const st=STAGES.find(x=>x.id===b.dataset.peta);go('peta',{proc:st.sheet,range:[st.from,st.to]})});
  $('alur-flow').querySelectorAll('[data-gapmap]').forEach(b=>b.onclick=()=>go('gap',{all:true,f:{mapStage:b.dataset.gapmap}}));
  $('alur-flow').querySelectorAll('[data-gap]').forEach(b=>b.onclick=()=>{const st=STAGES.find(x=>x.id===b.dataset.gap);
    go('gap',{f:{range:{tpl:'HO',sheet:st.sheet,a:st.from,b:st.to,label:`${st.name} (${SHN[st.sheet]} ${st.from}–${st.to})`}}});
    if(b.dataset.loc){S.dcloc=b.dataset.loc;render()}});
}

/* ===================== PETA ===================== */
const isDash=f=>f&&(f.startsWith('status_conflict')||f.startsWith('sop_'));
const isDev=f=>f==='deviation_but_comply';
const itemObs=(sh,no)=>OBS.filter(o=>o.site===S.site&&o.sheet===sh&&o.no===no);
function itemEff(sh,no){
  const ss=itemObs(sh,no).filter(locOk).map(eff);
  if(ss.includes('NON-COMPLY'))return 'NON-COMPLY';
  if(ss.includes('COMPLY'))return 'COMPLY';
  if(ss.includes('PENDING'))return 'PENDING';
  return 'N/A';
}
function itemFinding(sh,no){
  const os=itemObs(sh,no).filter(locOk);
  if(!os.length)return '';
  if(S.site==='JKT'&&sh==='DC'&&os.length>1)return os.filter(o=>o.finding).map(o=>`${LOCN[o.loc]}: ${o.finding}`).join(' | ');
  return os[0].finding;
}
const NW=150,NH=68,PX=34,LANEH=90,LABW=132,GAP=22;
function petaFocus(it,s){
  if(S.peta.range&&!(it.no>=S.peta.range[0]&&it.no<=S.peta.range[1]))return false;
  if(S.peta.focus==='NON-COMPLY')return s==='NON-COMPLY';
  if(S.peta.focus==='flag')return !!it.qa_flag;
  return true;
}
function renderPeta(){
  const sh=sheetOf(S.proc);
  mkSeg($('peta-proc'),PROCS.map(c=>[c,PROCN[c],!sheetOf(c)]),S.proc,v=>{S.proc=v;S.peta.sel=null;S.peta.range=null;render()});
  const os=siteObs().filter(o=>o.sheet===S.proc&&locOk(o));
  const rep=tally(os,o=>o.raw),adj=tally(os,adjStatus);
  const pr=pct(rep.c,rep.n),pa=pct(adj.c,adj.n),cov=rep.c+rep.n+rep.na?(rep.c+rep.n)/(rep.c+rep.n+rep.na)*100:null;
  const nflag=sh.items.filter(i=>i.qa_flag).length,nconf=sh.items.filter(i=>i.qa_flag.startsWith('status_conflict')).length;
  const lc=S.site==='JKT'&&S.proc==='DC'?' · '+(S.dcloc==='ALL'?'Semper + Marcen':LOCN[S.dcloc]):'';
  $('peta-kpis').innerHTML=`<div class="kpi"><div class="v">${sh.items.length}</div><div class="l">langkah SOP${esc(lc)}</div></div>`+
   (pr==null?'':`<div class="kpi pair"><div class="v">${fmt(pr)}<small>${rep.c} C · ${rep.n} NC · ${rep.na} N/A</small></div><div class="l">Compliance resmi (as reported)</div></div>
   <div class="kpi pair"><div class="v">${fmt(pa)}<small>${adj.c} C · ${adj.n} NC · ${adj.na} N/A</small></div><div class="l">Adjusted (${nconf} status_conflict dihitung ulang)${pa!==pr?` <span class="arrow">▼ ${(pr-pa).toFixed(1).replace('.',',')} poin</span>`:''}</div></div>
   <div class="kpi"><div class="v">${fmt(cov)}</div><div class="l">Langkah yang diperiksa (bukan N/A)${rep.na?` (${rep.na} N/A)`:''}</div></div>`)+
   `<div class="kpi"><div class="v">${nflag}</div><div class="l">item ber-flag QA</div></div>`+(rep.pe?`<div class="kpi"><div class="v">${rep.pe}</div><div class="l">belum diaudit</div></div>`:'')+
   (tplOfSite(S.site)==='MDN'?(()=>{const c=k=>sh.items.filter(i=>(MAPBY[S.proc+'-'+i.no]||{}).rel===k).length;return `<div class="kpi"><div class="v">${c('S')} · ${c('P')} · ${c('M')}</div><div class="l">Dibanding SOP HO (draf): sama · mirip · hanya di Medan</div></div>`})():'');
  $('peta-banner').hidden=!sh.note;$('peta-banner').textContent=sh.note||'';
  const risk=sh.items.filter(i=>i.qa_flag===RISK);
  $('peta-risk').hidden=!risk.length;
  $('peta-risk').innerHTML=risk.length?`⚠ <b>Risiko integritas dilaporkan auditor:</b> ${risk.map(i=>`langkah #${i.no}`).join(', ')}. ${esc(risk[0].finding)}`:'';
  const cnt={all:sh.items.length,nc:0,flag:0};sh.items.forEach(i=>{if(itemEff(S.proc,i.no)==='NON-COMPLY')cnt.nc++;if(i.qa_flag)cnt.flag++});
  $('peta-chips').innerHTML='';
  [['all','Semua','',cnt.all],['NON-COMPLY','Hanya NON-COMPLY','nc',cnt.nc],['flag','Hanya flag QA','flag',cnt.flag]].forEach(([k,l,c,n])=>{
    const b=document.createElement('button');b.type='button';b.className='chip';b.setAttribute('aria-pressed',String(S.peta.focus===k));
    b.innerHTML=(c?`<i class="sw ${c}"></i>`:'')+esc(l)+` <span class="n">${n}</span>`;b.onclick=()=>{S.peta.focus=k;renderPeta()};$('peta-chips').appendChild(b)});
  const r=S.peta.range;
  $('peta-range').innerHTML=r?`<span class="fc">Tahap: langkah ${r[0]}–${r[1]}<button type="button" id="peta-rx" aria-label="Hapus sorotan tahap">×</button></span>`:'';
  if(r)$('peta-rx').onclick=()=>{S.peta.range=null;renderPeta()};
  const host=$('peta-board');host.innerHTML='';
  sh.sections.forEach(sec=>{
    const items=sh.items.filter(i=>i.section===sec.id).sort((a,b)=>a.no-b.no);
    const actors=[];items.forEach(i=>{if(!actors.includes(i.actor))actors.push(i.actor)});
    const cs=tally(items,i=>itemEff(S.proc,i.no));
    const W=LABW+PX+items.length*(NW+GAP)+PX-GAP,H=actors.length*LANEH;
    const d=document.createElement('section');d.className='section';
    d.innerHTML=`<div class="sec-h"><span class="sec-id">${esc(sec.id)}</span><span class="sec-n">${esc(sec.name)}</span><span class="sec-m">${esc(sec.sop)} · langkah ${sec.from_no}–${sec.to_no}</span>
      <span class="sec-c">${cs.pe!==items.length?`<span class="ok">${cs.c} C</span><span class="nc">${cs.n} NC</span><span class="na">${cs.na} NA</span>`:''}${cs.pe?`<span class="pe">${cs.pe} belum diaudit</span>`:''}</span></div>
      <div class="scroll"><div class="board" style="width:${W}px;height:${H}px"></div></div>`;
    const b=d.querySelector('.board');
    actors.forEach((a,i)=>{const l=document.createElement('div');l.className='lane';l.style.cssText=`top:${i*LANEH}px;height:${LANEH}px`;l.innerHTML=`<div class="lane-l">${esc(a)}</div>`;b.appendChild(l)});
    const pos=items.map((it,k)=>({it,x:LABW+PX+k*(NW+GAP),y:actors.indexOf(it.actor)*LANEH+(LANEH-NH)/2}));
    let paths='';
    for(let k=0;k<pos.length-1;k++){const a=pos[k],c=pos[k+1];const x1=a.x+NW,y1=a.y+NH/2,x2=c.x,y2=c.y+NH/2,mx=x1+GAP/2;paths+=`<path d="M${x1} ${y1} H${mx} V${y2} H${x2-1}" fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#ah)"/>`}
    b.insertAdjacentHTML('beforeend',`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs><marker id="ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="currentColor"/></marker></defs>${paths}</svg>`);
    pos.forEach(({it,x,y})=>{
      const s=itemEff(S.proc,it.no),n=document.createElement('button');n.type='button';
      const other=it.qa_flag===NA_OTHER,risky=it.qa_flag===RISK,act=it.actor_actual&&it.actor_actual!==it.actor;
      n.className=`node ${CLS[s]}${isDash(it.qa_flag)?' flag':''}${other?' otr':''}${risky?' risk':''}${(other||act)?' tg':''}${petaFocus(it,s)?'':' dim'}${S.peta.sel===it.no?' sel':''}`;
      n.style.cssText=`left:${x}px;top:${y}px`;n.dataset.no=it.no;n.setAttribute('aria-label',`Langkah ${it.no}, ${s}, ${it.criterion}`);
      n.innerHTML=`<span class="no">#${it.no} · ${esc(it.category)}</span><span class="t">${esc(it.criterion)}</span>`+(isDev(it.qa_flag)?'<span class="dev" title="Menyimpang dari SOP">!</span>':'')+(risky?'<span class="rk" title="Risiko integritas dilaporkan auditor">⚠</span>':'')+
        (other?'<span class="oth">dikerjakan pihak lain</span>':act?`<span class="oth act" title="Pelaksana aktual berbeda dari SOP">↔ ${esc(it.actor_actual)}</span>`:'')+
        (S.site==='JKT'&&S.proc==='DC'?`<span class="dots">${LOCS.map(l=>{const o=itemObs('DC',it.no).find(q=>q.loc===l);return `<i class="${CLS[eff(o)]}" title="${LOCN[l]}"></i>`}).join('')}</span>`:'');
      n.onmouseenter=e=>showTip(e,it);n.onmousemove=moveTip;n.onmouseleave=()=>{$('tip').hidden=true};
      n.onfocus=e=>showTip(e,it,true);n.onblur=()=>{$('tip').hidden=true};
      n.onclick=()=>{S.peta.sel=it.no;renderPeta()};
      b.appendChild(n);
    });
    host.appendChild(d);
  });
  renderDrawer(sh);
}
function showTip(e,it,fromFocus){
  const s=itemEff(S.proc,it.no),f=itemFinding(S.proc,it.no);
  let h=`<b>#${it.no}</b> ${esc(it.criterion)}`;
  if(s==='PENDING')h+='<br><i>Belum diaudit</i>';else if(f)h+=`<br>${esc(f)}`;else if(s==='NON-COMPLY')h+='<br><i>(tidak ada catatan temuan)</i>';
  if(it.actor_actual&&it.actor_actual!==it.actor)h+=`<br>Pelaksana aktual: ${esc(it.actor_actual)} (SOP: ${esc(it.actor)})`;
  if(it.qa_flag)h+=`<span class="fl">⚑ ${esc(FLAGTXT[it.qa_flag]||it.qa_flag)}</span>`;
  const t=$('tip');t.innerHTML=h;t.hidden=false;
  if(fromFocus){const r=e.target.getBoundingClientRect();place(r.left,r.bottom+6)}else moveTip(e);
}
function place(x,y){const t=$('tip');const w=t.offsetWidth,h=t.offsetHeight;t.style.left=Math.max(8,Math.min(x,innerWidth-w-8))+'px';t.style.top=(y+h>innerHeight-8?Math.max(8,y-h-30):y)+'px'}
function moveTip(e){place(e.clientX+14,e.clientY+16)}
function pill(s){return `<span class="pill ${CLS[s]}">${s}</span>`}
function themeHit(t,o){
  if(t.flag)return o.flag===t.flag;
  return t.refs.some(([s,ns])=>{const [tp,sh]=s.includes(':')?s.split(':'):['HO',s];return o.tpl===tp&&o.sheet===sh&&ns.includes(o.no)});
}
function renderDrawer(sh){
  const d=$('peta-drawer'),it=sh.items.find(i=>i.no===S.peta.sel);
  if(!it){d.hidden=true;return}
  d.hidden=false;
  const tpl=tplOfSite(S.site),sec=sh.sections.find(s=>s.id===it.section),os=itemObs(S.proc,it.no),mp=tpl==='MDN'?MAPBY[S.proc+'-'+it.no]:null;
  const st=tpl==='HO'?stageOf(S.proc,it.no):(mp&&mp.ho[0]?stageOf(mp.ho[0].sheet,mp.ho[0].no):null);
  const gt=os.map(gtype).find(Boolean),themes=GC.THEMES.filter(t=>os.some(o=>themeHit(t,o)));
  let right='';
  if(S.site==='JKT'&&S.proc==='DC'){
    right+='<div class="locs">'+os.map(o=>`<div>${pill(eff(o))} <b>${LOCN[o.loc]}</b>${o.finding?': '+esc(o.finding):''}</div>`).join('')+'</div>';
  }else{
    const o=os[0],s=eff(o);
    right+=`<div>${pill(s)} ${o.finding?esc(o.finding):`<i style="color:var(--muted)">${s==='PENDING'?'Belum diaudit. Item ini diturunkan dari Pendahuluan SOP, bukan dari langkah Prosedur.':'Tidak ada catatan temuan.'}</i>`}</div>`;
    if(o.doc)right+=`<div class="fbx plain"><b>Menurut dokumen:</b> ${pill(o.doc)} ${o.doc!==o.raw?`<span class="fgl">berbeda dari lapangan (${o.raw})</span>`:'sama dengan lapangan'}</div>`;
  }
  if(it.auditor_note)right+=`<div class="fbx plain"><b>Catatan auditor:</b> ${esc(it.auditor_note)}</div>`;
  if(it.actor_actual&&it.actor_actual!==it.actor)right+=`<div class="fbx plain"><b>Pelaksana:</b> SOP menyebut ${esc(it.actor)}, aktualnya ${esc(it.actor_actual)}.</div>`;
  if(it.root_cause)right+=`<div class="fbx plain"><b>Akar masalah:</b> ${esc(RCN[it.root_cause]||it.root_cause)}</div>`;
  if(it.qa_flag)right+=`<div class="fbx${it.qa_flag===RISK?' risk':''}"><b>Flag QA · ${esc(it.qa_flag)}</b><br>${esc(FLAGTXT[it.qa_flag]||'')}`+(adjOf(it.qa_flag)&&os[0].raw==='COMPLY'?`<br>Pada tampilan Adjusted dihitung sebagai <b>${adjOf(it.qa_flag)}</b>.`:'')+`</div>`;
  if(mp)right+=`<div class="fbx plain"><b>Sama dengan di SOP HO (draf)</b><br>${mp.rel==='M'?'Tidak ada di SOP HO, hanya di SOP Medan.':mp.ho.map(h=>`<button type="button" class="lnk" data-ho="${h.sheet}|${h.no}">${SHN[h.sheet]} ${h.no} →</button>`).join(' ')+` <span class="fgl">${REL[mp.rel]}, kecocokan ${CONF[mp.conf]}</span>`}${mp.note?`<br>${esc(mp.note)}`:''}</div>`;
  const rv=tpl==='HO'?(HOIDX[S.proc+'-'+it.no]||[]):[];
  if(rv.length)right+=`<div class="fbx plain"><b>Sama dengan di SOP Medan (draf)</b><br>${rv.map(m=>`<button type="button" class="lnk" data-md="${m.sheet}|${m.no}">Medan ${SHN[m.sheet]} ${m.no} (${REL[m.rel]}) →</button>`).join(' ')}</div>`;
  right+='<div class="xl">'+(st?`<button type="button" class="lnk" data-alur="${st.id}">Tahap alur HO: ${esc(st.name)} →</button>`:'')+
    `<button type="button" class="lnk" data-gaprange="1">Daftar temuan →</button>`+
    (gt?`<span class="tp s t${gt}" title="Jenis gap ${gt.toUpperCase()}">${gt.toUpperCase()}</span>`:'')+
    themes.map(t=>`<button type="button" class="lnk" data-theme="${t.id}">Tema: ${esc(t.t.length>38?t.t.slice(0,36)+'…':t.t)} →</button>`).join('')+'</div>';
  d.innerHTML=`<button class="x" type="button" aria-label="Tutup detail" id="peta-dx">×</button>
   <div><h2>#${it.no} ${esc(it.criterion)}</h2><dl><dt>Aktor</dt><dd>${esc(it.actor)}</dd><dt>Kategori</dt><dd>${esc(it.category)}</dd><dt>Acuan SOP</dt><dd>${esc(it.sop_ref)}</dd>${it.orig_no?`<dt>No. di form audit</dt><dd>${esc(it.orig_sheet)} ${it.orig_no}</dd>`:''}<dt>Tahap</dt><dd>${esc(sec.id)} · ${esc(sec.name)}</dd></dl></div><div>${right}</div>`;
  $('peta-dx').onclick=()=>{S.peta.sel=null;renderPeta()};
  d.querySelectorAll('[data-alur]').forEach(b=>b.onclick=()=>{const st2=STAGES.find(x=>x.id===b.dataset.alur);go('alur',{proc:st2.sheet,stage:st2.id})});
  d.querySelectorAll('[data-ho]').forEach(b=>{const [sh2,no2]=b.dataset.ho.split('|');b.onclick=()=>go('peta',{site:'JKT',proc:sh2,sel:+no2})});
  d.querySelectorAll('[data-md]').forEach(b=>{const [sh2,no2]=b.dataset.md.split('|');b.onclick=()=>go('peta',{site:'MDN',proc:sh2,sel:+no2})});
  d.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>go('gap',{f:{theme:b.dataset.theme}}));
  d.querySelectorAll('[data-gaprange]').forEach(b=>b.onclick=()=>go('gap',{all:true,f:{range:{tpl,site:S.site,sheet:S.proc,a:it.no,b:it.no,label:`${siteInfo(S.site).name} ${SHN[S.proc]} ${it.no}`}}}));
}

/* ===================== GAP ===================== */
function renderGap(){renderCmp();renderG3();renderMx();renderMap();renderHm();renderRk();renderThemes();renderList()}

function renderCmp(){
  const groups=[];
  scopeSites().forEach(code=>{
    const rows=[];
    DATA.sheets.filter(s=>s.site===code).sort((x,y)=>PROCS.indexOf(x.sheet)-PROCS.indexOf(y.sheet)).forEach(s=>{
      if(code==='JKT'&&s.sheet==='DC')['SEMPER','MARCEN','DOKUMEN'].forEach(l=>rows.push({label:'DC '+LOCN[l],f:o=>o.sheet==='DC'&&o.loc===l}));
      else if(s.sheet==='TRUCKING'){rows.push({label:'Trucking: penarikan empty',f:o=>o.sheet==='TRUCKING'&&o.sec==='T1'});if(S.site!=='ALL')rows.push({label:'Trucking: penarikan full',f:o=>o.sheet==='TRUCKING'&&o.sec==='T2'})}
      else rows.push({label:SHN[s.sheet]==='DC'?'DC':SHN[s.sheet],f:o=>o.sheet===s.sheet&&o.loc!=='DOKUMEN'});
    });
    groups.push({code,rows});
  });
  let h='<div class="h">Proses</div><div class="h">Compliance resmi → adjusted (0 sampai 100%)</div><div class="h">Angka</div>';
  groups.forEach(g=>{
    if(S.site==='ALL')h+=`<div class="cs">${esc(siteInfo(g.code).name)}<span>${esc(siteInfo(g.code).audit_no)} · ${esc(siteInfo(g.code).date)}</span></div>`;
    g.rows.forEach(row=>{
      const os=OBS.filter(o=>o.site===g.code&&row.f(o));
      const r=tally(os,o=>o.raw),a=tally(os,adjStatus),pr=pct(r.c,r.n),pa=pct(a.c,a.n),cov=r.c+r.n+r.na?(r.c+r.n)/(r.c+r.n+r.na)*100:null;
      const sub=pr==null?`${os.length} langkah, belum diaudit`:`${r.c} C · ${r.n} NC · ${r.na} N/A`;
      let trk='<div class="trk">'+[0,25,50,75,100].map(t=>`<span class="tick" style="left:${t}%"></span><span class="tl" style="left:${t}%">${t}</span>`).join('');
      let val;
      if(pr==null)val='<span style="color:var(--muted)">belum diaudit</span>';
      else{
        if(pa!==pr)trk+=`<span class="link" style="left:${Math.min(pa,pr)}%;width:${Math.abs(pr-pa)}%"></span>`;
        trk+=`<span class="mk" style="left:${pr}%" title="Resmi ${fmt(pr)}"></span><span class="mk adj" style="left:${pa}%" title="Adjusted ${fmt(pa)}"></span>`;
        val=`${fmt(pr)} → ${fmt(pa)}`+(pa!==pr?` <span class="dn">▼${(pr-pa).toFixed(1).replace('.',',')}</span>`:'')+`<br><span class="cov${cov<70?' lo':''}">diperiksa ${fmt(cov)}</span>`;
      }
      h+=`<div class="cn">${esc(row.label)}<small>${sub}</small></div>${trk}</div><div class="cv">${val}</div>`;
    });
  });
  $('gap-cmp').innerHTML=h;
}
function renderG3(){
  const v=vis().filter(isTem),f=S.gap.f;
  $('gap-g3').innerHTML=GC.GTYPES.map(t=>{
    const os=v.filter(o=>gtype(o)===t.k),nc=os.filter(o=>eff(o)==='NON-COMPLY').length,fl=os.length-nc;
    const by={};os.forEach(o=>{by[o.site]=(by[o.site]||0)+1});
    return `<button class="gc t${t.k}${f.gt===t.k?' on':''}" data-gt="${t.k}" type="button"><div class="gh"><span class="tp">${t.k.toUpperCase()}</span><span class="gn">${esc(t.n)}</span><span class="gv">${os.length}<small>temuan</small></span></div>
     <p>${esc(t.d)}</p><dl><dt>NON-COMPLY</dt><dd class="mono">${nc}</dd><dt>Ada catatan atau N/A</dt><dd class="mono">${fl}</dd><dt>Per cabang</dt><dd>${Object.entries(by).map(([k,n])=>k+' '+n).join(' · ')||'-'}</dd><dt>Penanggung jawab (usulan)</dt><dd>${esc(t.own)}</dd><dt>Tindakan</dt><dd>${esc(t.act)}</dd></dl></button>`}).join('');
  $('gap-g3').querySelectorAll('.gc').forEach(b=>b.onclick=()=>setF('gt',b.dataset.gt));
}

/* matriks langkah x cabang (template HO) */
function mxCell(site,sheet,no){
  const os=OBS.filter(o=>o.site===site&&o.tpl==='HO'&&o.sheet===sheet&&o.no===no&&o.loc!=='DOKUMEN');
  if(!os.length)return {s:null,os};
  const ss=os.map(eff);
  const s=ss.includes('NON-COMPLY')?'NON-COMPLY':ss.includes('COMPLY')?'COMPLY':ss.includes('PENDING')?'PENDING':'N/A';
  return {s,os};
}
function renderMx(){
  const mx=S.gap.mx,hoSites=SITES.filter(s=>tplOfSite(s.code)==='HO');
  mkSeg($('gap-mx-sheet'),['EXPORT','IMPORT','DC','TRUCKING'].map(c=>[c,PROCN[c].replace(' (Distribution Center)','')]),mx.sheet,v=>{mx.sheet=v;renderMx()});
  $('gap-mx-opt').innerHTML=`<label class="chk"><input type="checkbox" id="mx-nc" ${mx.onlyNc?'checked':''}> Hanya langkah ber-NC</label><label class="chk"><input type="checkbox" id="mx-sort" ${mx.sort?'checked':''}> Urutkan dari NC terbanyak</label>`;
  $('mx-nc').onchange=e=>{mx.onlyNc=e.target.checked;renderMx()};$('mx-sort').onchange=e=>{mx.sort=e.target.checked;renderMx()};
  const base=DATA.sheets.find(s=>s.sheet===mx.sheet&&s.site==='JKT');
  let items=base.items.filter(i=>i.section!=='T2').map(i=>({it:i,cells:hoSites.map(s=>mxCell(s.code,mx.sheet,i.no))}));
  items.forEach(r=>r.nc=r.cells.filter(c=>c.s==='NON-COMPLY').length);
  if(mx.onlyNc)items=items.filter(r=>r.nc>0);
  if(mx.sort)items=items.slice().sort((a,b)=>b.nc-a.nc||a.it.no-b.it.no);
  const mkc=(site,no,c)=>{
    if(!c.s)return '<td class="n"><span class="mc none" title="Sheet ini tidak diaudit di cabang ini">–</span></td>';
    const tip=c.os.map(o=>`${o.loc?LOCN[o.loc]+': ':''}${eff(o)}${o.flag?' ⚑ '+(FLAGTXT[o.flag]||o.flag):''}`).join(' | ');
    const code={'COMPLY':'C','NON-COMPLY':'NC','N/A':'NA','PENDING':'–'}[c.s];
    return `<td class="n"><button type="button" class="mc ${CLS[c.s]}${c.os.some(o=>isDash(o.flag))?' fl':''}${c.os.some(o=>o.flag===NA_OTHER)?' otr':''}" data-site="${site}" data-no="${no}" title="${esc(tip)}">${code}</button></td>`};
  const mdnCell=no=>{
    const ms=HOIDX[mx.sheet+'-'+no]||[];
    if(!ms.length)return '<td class="n"><span class="mc none" title="Tidak ada di SOP Medan">–</span></td>';
    const os=ms.flatMap(m=>OBS.filter(o=>o.site==='MDN'&&o.sheet===m.sheet&&o.no===m.no)),ss=os.map(eff);
    const st=ss.includes('NON-COMPLY')?'NON-COMPLY':ss.includes('COMPLY')?'COMPLY':'N/A',code={'COMPLY':'C','NON-COMPLY':'NC','N/A':'NA'}[st];
    const tip=ms.map(m=>`Medan ${SHN[m.sheet]} ${m.no} (${REL[m.rel]}, kecocokan ${CONF[m.conf]}): ${eff(OBS.find(o=>o.site==='MDN'&&o.sheet===m.sheet&&o.no===m.no))}`).join(' | ');
    return `<td class="n"><button type="button" class="mc ${CLS[st]} map" data-mdn="${ms[0].sheet}|${ms[0].no}" title="${esc(tip)}">${code}*</button></td>`;
  };
  $('gap-mx').innerHTML=`<thead><tr><th>Langkah (template HO)</th>${hoSites.map(s=>`<th class="n" title="${esc(s.name)}">${s.code}</th>`).join('')}<th class="n" title="Medan, lewat pemetaan draf ke SOP HO">MDN*</th><th class="n">Σ NC</th></tr></thead><tbody>`+
    items.map(r=>`<tr><td><span class="sid">${r.it.no}</span>${esc(r.it.criterion)}<small class="sec">${esc(r.it.section)} · ${esc(r.it.actor)}</small></td>${r.cells.map((c,i)=>mkc(hoSites[i].code,r.it.no,c)).join('')}${mdnCell(r.it.no)}<td class="n">${r.nc||'·'}</td></tr>`).join('')+'</tbody>';
  $('gap-mx').querySelectorAll('button.mc:not(.map)').forEach(b=>b.onclick=()=>go('peta',{site:b.dataset.site,proc:mx.sheet,sel:+b.dataset.no}));
  $('gap-mx').querySelectorAll('button.mc.map').forEach(b=>b.onclick=()=>{const [sh2,no2]=b.dataset.mdn.split('|');go('peta',{site:'MDN',proc:sh2,sel:+no2})});
  $('gap-mx-n').textContent=`${items.length} langkah`;
}
/* pemetaan Medan -> HO */
function renderMap(){
  const sec=$('gap-smap'),show=S.site==='ALL'||S.site==='MDN';
  sec.hidden=!show;if(!show)return;
  const cnt=(sh,k)=>MAP.filter(m=>m.sheet===sh&&(!k||m.rel===k)).length;
  const cf=(sh,k)=>MAP.filter(m=>m.sheet===sh&&m.conf===k).length;
  $('gap-map1').innerHTML='<thead><tr><th>Proses Medan</th><th class="n">Langkah</th><th class="n">Sama</th><th class="n">Mirip</th><th class="n">Hanya di Medan</th><th class="n">Kecocokan tinggi · sedang · rendah</th></tr></thead><tbody>'+
    ['EXPORT','IMPORT','DC'].map(sh=>`<tr><td>${SHN[sh]} (${sh==='EXPORT'?'SOP-OPS-EXP-003':sh==='IMPORT'?'SOP-OPS-IMP-004':'SOP-OPS-DC-002'})</td><td class="n">${cnt(sh)}</td><td class="n">${cnt(sh,'S')}</td><td class="n">${cnt(sh,'P')}</td><td class="n">${cnt(sh,'M')}</td><td class="n">${cf(sh,'T')} · ${cf(sh,'S')} · ${cf(sh,'R')}</td></tr>`).join('')+'</tbody>';
  const hoItems=sh=>(DATA.sheets.find(s=>s.site==='JKT'&&s.sheet===sh)||{items:[]}).items;
  const covered=sh=>new Set(MAP.flatMap(m=>m.ho.filter(h=>h.sheet===sh).map(h=>h.no)));
  const hoOnly=[];
  $('gap-map2').innerHTML='<thead><tr><th>Proses SOP HO</th><th class="n">Langkah HO</th><th class="n">Ada di SOP Medan</th><th class="n">Tidak ada di SOP Medan</th></tr></thead><tbody>'+
    ['EXPORT','IMPORT','DC','TRUCKING'].map(sh=>{const its=hoItems(sh),cv=covered(sh),un=its.filter(i=>!cv.has(i.no));un.forEach(i=>hoOnly.push({sh,i}));
      return `<tr><td>${PROCN[sh].replace(' (Distribution Center)','')}</td><td class="n">${its.length}</td><td class="n">${its.length-un.length}</td><td class="n">${un.length}</td></tr>`}).join('')+'</tbody>';
  const mOnly=MAP.filter(m=>m.rel==='M');
  const crit=(site,sh,no)=>{const it=(DATA.sheets.find(s=>s.site===site&&s.sheet===sh)||{items:[]}).items.find(i=>i.no===no);return it?it.criterion:''};
  $('gap-map3').innerHTML=`<summary>Langkah Medan yang tidak ada di SOP HO (${mOnly.length})</summary><table class="hm"><thead><tr><th>Langkah Medan</th><th>Alasan</th></tr></thead><tbody>`+
    mOnly.map(m=>`<tr><td><button type="button" class="lnk" data-mdn="${m.sheet}|${m.no}">${SHN[m.sheet]} ${m.no}</button> ${esc(crit('MDN',m.sheet,m.no))}</td><td>${esc(m.note)}</td></tr>`).join('')+'</tbody></table>';
  $('gap-map4').innerHTML=`<summary>Langkah SOP HO yang tidak ada di SOP Medan (${hoOnly.length})</summary><table class="hm"><thead><tr><th>Langkah HO</th></tr></thead><tbody>`+
    hoOnly.map(({sh,i})=>`<tr><td><button type="button" class="lnk" data-ho="${sh}|${i.no}">${SHN[sh]} ${i.no}</button> ${esc(i.criterion)} <small class="fgl">${esc(i.actor)}</small></td></tr>`).join('')+'</tbody></table>';
  sec.querySelectorAll('[data-mdn]').forEach(b=>{const [sh2,no2]=b.dataset.mdn.split('|');b.onclick=()=>go('peta',{site:'MDN',proc:sh2,sel:+no2})});
  sec.querySelectorAll('[data-ho]').forEach(b=>{const [sh2,no2]=b.dataset.ho.split('|');b.onclick=()=>go('peta',{site:'JKT',proc:sh2,sel:+no2})});
}
/* heatmap tahap x status */
function renderHm(){
  const v=vis(),tpls=scopeTpls();
  const groups=[['EXPORT','HO'],['IMPORT','HO'],['DC','HO'],['TRUCKING','HO'],['EXPORT','MDN'],['IMPORT','MDN'],['DC','MDN']].filter(([sh,tp])=>tpls.has(tp));
  let h='<thead><tr><th>Tahap</th><th class="n">COMPLY</th><th class="n">NON-COMPLY</th><th class="n">N/A</th><th class="n">Belum diaudit</th><th class="n">NC %</th></tr></thead><tbody>';
  groups.forEach(([sh,tp])=>{
    const sheet=DATA.sheets.find(s=>s.sheet===sh&&(s.template==='MDN_TEMPLATE'?'MDN':'HO')===tp);if(!sheet)return;
    if(tp==='MDN'&&tpls.has('HO')&&sh==='EXPORT')h+='<tr class="sh med"><td colspan="6">Medan: SOP berbeda, di luar template HO</td></tr>';
    h+=`<tr class="sh"><td colspan="6">${SHN[sh]}${tp==='MDN'?' · Medan':''}${sh==='DC'&&tp==='HO'&&S.dcloc!=='ALL'?' · '+LOCN[S.dcloc]:''}</td></tr>`;
    sheet.sections.forEach(sec=>{
      const os=v.filter(o=>o.sheet===sh&&o.tpl===tp&&o.sec===sec.id),n=os.length,c={};os.forEach(o=>{const s=eff(o);c[s]=(c[s]||0)+1});
      if(!n)return;
      const cell=(k,col)=>{const x=c[k]||0,p=n?x/n:0;return `<td class="n${k==='PENDING'&&x?' pe':''}" style="${k!=='PENDING'&&x?`background:color-mix(in srgb,var(${col}) ${Math.round(p*55)}%,var(--surface))`:''}" title="${x} dari ${n} (${Math.round(p*100)}%)">${x||'·'}</td>`};
      const rate=pct(c['COMPLY']||0,c['NON-COMPLY']||0);
      const st=tp==='HO'?STAGES.find(s=>s.sheet===sh&&s.from<=sec.from_no&&sec.from_no<=s.to):null;
      h+=`<tr data-sec="${tp}|${sh}|${sec.id}"><td><span class="sid">${sec.id}</span><span class="sn">${esc(sec.name)}</span>${st?`<button type="button" class="lnk" data-alur="${st.id}">Alur</button>`:''}</td>${cell('COMPLY','--ok')}${cell('NON-COMPLY','--nc')}${cell('N/A','--na')}${cell('PENDING','--na')}<td class="n">${rate==null?'-':fmt(100-rate)}</td></tr>`;
    });
  });
  $('gap-hm').innerHTML=h+'</tbody>';
  $('gap-hm').querySelectorAll('tr[data-sec]').forEach(r=>r.onclick=()=>setF('sec',r.dataset.sec));
  $('gap-hm').querySelectorAll('[data-alur]').forEach(b=>b.onclick=e=>{e.stopPropagation();const st=STAGES.find(x=>x.id===b.dataset.alur);go('alur',{proc:st.sheet,stage:st.id})});
}
function rankPanel(title,keyFn,labelFn,fkey,limit){
  const v=vis().filter(o=>eff(o)==='COMPLY'||eff(o)==='NON-COMPLY'),tot={},nc={};
  v.forEach(o=>{const k=keyFn(o);tot[k]=(tot[k]||0)+1;if(eff(o)==='NON-COMPLY')nc[k]=(nc[k]||0)+1});
  const list=Object.keys(nc).sort((a,b)=>nc[b]-nc[a]||tot[b]-tot[a]).slice(0,limit),mx=Math.max(1,...list.map(k=>nc[k]));
  return `<div class="panel"><div class="rkh">${title}</div>`+(list.length?list.map(k=>`<button class="br" type="button" data-k="${esc(fkey)}" data-v="${esc(k)}"><span class="bn">${esc(labelFn(k))}</span><span class="bt"><span class="bf" style="width:${nc[k]/mx*100}%"></span><span class="bv" style="${nc[k]/mx<.18?`left:${nc[k]/mx*100}%`:'color:#fff'}">${nc[k]}</span></span><span class="bs">dari ${tot[k]} langkah diperiksa (${fmt(nc[k]/tot[k]*100)})</span></button>`).join(''):'<div class="lead">Tidak ada temuan NON-COMPLY.</div>')+'</div>';
}
function renderRk(){
  $('gap-rk').innerHTML=rankPanel('Per aktor SOP (12 teratas)',o=>o.actor,x=>x,'actor',12)+rankPanel('Per kategori',o=>o.cat,x=>CATN[x]||x,'cat',4)+rankPanel('Per tahap (10 teratas)',o=>o.tpl+'|'+o.sec,x=>SECNAME[x]||x,'sec2',10)+rankPanel('Per acuan SOP (10 teratas)',o=>o.sop,x=>x,'sop',10);
  $('gap-rk').querySelectorAll('.br').forEach(b=>b.onclick=()=>{
    if(b.dataset.k==='sec2'){const [tp,id]=b.dataset.v.split('|');const sh=[...new Set(vis().filter(o=>o.tpl===tp&&o.sec===id).map(o=>o.sheet))][0];setF('sec',`${tp}|${sh}|${id}`)}
    else setF(b.dataset.k,b.dataset.v)});
}
/* tema */
function chipFor(ref,no){
  const [tp,sh]=ref.includes(':')?ref.split(':'):['HO',ref];
  const os=siteObs().filter(o=>o.tpl===tp&&o.sheet===sh&&o.no===no&&o.loc!=='DOKUMEN');
  if(!os.length)return '';
  const sites=[...new Set(os.map(o=>o.site))];
  const dots=(sites.length>1||sh==='DC')?os.map(o=>`<i class="${CLS[eff(o)]}" title="${siteInfo(o.site).name}${o.loc?' '+LOCN[o.loc]:''}: ${eff(o)}"></i>`).join(''):'';
  const main=dots?'':CLS[eff(os[0])],fl=os.some(o=>isDash(o.flag)),target=(os.find(o=>eff(o)==='NON-COMPLY')||os[0]).site;
  return `<button type="button" class="rc ${main}${fl?' fl':''}" data-peta="${target}|${sh}|${no}" title="${esc(os[0].crit)}. Klik untuk membuka di Peta.">${tp==='MDN'?'Medan ':''}${SHN[sh]} ${no}${dots}</button>`;
}
function renderThemes(){
  const open=[...document.querySelectorAll('details.th[open]')].map(d=>d.dataset.id),tpls=scopeTpls();
  $('gap-themes').innerHTML=GC.THEMES.filter(t=>tpls.has(t.tpl||'HO')).map(t=>{
    const os=siteObs().filter(o=>locOk(o)&&themeHit(t,o)),nc=os.filter(o=>eff(o)==='NON-COMPLY').length;
    const per=scopeSites().map(c=>{const k=os.filter(o=>o.site===c);return k.length?`<span class="rc ${k.some(o=>eff(o)==='NON-COMPLY')?'nc':'ok'}">${c} ${k.filter(o=>eff(o)==='NON-COMPLY').length} NC / ${k.length}</span>`:''}).join('');
    const refChips=t.refs.map(([s,ns])=>ns.map(n=>chipFor(s,n)).join('')).join('');
    return `<details class="th" data-id="${t.id}"${open.includes(t.id)?' open':''}><summary><span class="tt">${esc(t.t)}</span><span class="tps">${t.ty.map(k=>`<span class="tp s t${k}" title="Jenis gap ${k.toUpperCase()}">${k.toUpperCase()}</span>`).join('')}</span><span class="tcnt"><b>${nc}</b> NC dari ${os.length} temuan</span></summary>
    <div class="tb2">${per?`<div class="gchips"><span class="lab">Per cabang</span>${per}</div>`:''}${refChips?`<div class="gchips">${refChips}</div>`:''}
    <dl><dt>Hasil cek data</dt><dd>${esc(t.ver)}</dd><dt>Akar masalah</dt><dd>${esc(t.root)}</dd><dt>Penanggung jawab (usulan)</dt><dd>${esc(t.own)}</dd><dt>Tindakan (usulan)</dt><dd>${esc(t.act)}</dd></dl>
    ${os.length?`<button class="btn" type="button" data-th="${t.id}">Lihat temuan tema ini</button>`:''}</div></details>`}).join('');
  $('gap-themes').querySelectorAll('.btn').forEach(b=>b.onclick=()=>setF('theme',b.dataset.th));
  $('gap-themes').querySelectorAll('.rc[data-peta]').forEach(b=>b.onclick=()=>{const [site,sh,no]=b.dataset.peta.split('|');go('peta',{site,proc:sh,sel:+no})});
}
/* daftar temuan */
const THEME_OF=id=>GC.THEMES.find(t=>t.id===id);
function matches(o){
  const f=S.gap.f;
  if(f.gt&&gtype(o)!==f.gt)return false;
  if(f.sec){const[tp,s,i]=f.sec.split('|');if(o.tpl!==tp||o.sheet!==s||o.sec!==i)return false}
  if(f.actor&&o.actor!==f.actor)return false;
  if(f.cat&&o.cat!==f.cat)return false;
  if(f.sop&&o.sop!==f.sop)return false;
  if(f.range){const r=f.range;if(o.tpl!==(r.tpl||'HO')||o.sheet!==r.sheet||o.no<r.a||o.no>r.b)return false;if(r.site&&o.site!==r.site)return false}
  if(f.mapStage){const stg=STAGES.find(x=>x.id===f.mapStage),m=MAPBY[o.sheet+'-'+o.no];if(o.tpl!=='MDN'||!m||!m.ho.some(h=>h.sheet===stg.sheet&&h.no>=stg.from&&h.no<=stg.to))return false}
  if(f.theme&&!themeHit(THEME_OF(f.theme),o))return false;
  if(!f.all&&!isTem(o))return false;
  return true;
}
const FN={gt:'Jenis',sec:'Tahap',actor:'Aktor',cat:'Kategori',sop:'SOP',theme:'Tema',range:'Langkah',mapStage:'Tahap HO (via pemetaan Medan)'};
function fval(k,v){return k==='gt'?'Jenis '+v.toUpperCase():k==='cat'?CATN[v]:k==='theme'?THEME_OF(v).t:k==='sec'?(SECNAME[v.split('|')[0]+'|'+v.split('|')[2]]||v):k==='range'?v.label:k==='mapStage'?STAGES.find(x=>x.id===v).name:v}
function setF(k,v){const f=S.gap.f;f[k]=f[k]===v?'':v;renderGap();$('gap-s7').scrollIntoView({behavior:'smooth',block:'start'})}
const k0=k=>k==='range'?null:'';
function renderList(){
  const f=S.gap.f,order=Object.fromEntries(SITES.map((s,i)=>[s.code,i])),rows=vis().filter(matches).sort((a,b)=>order[a.site]-order[b.site]||PROCS.indexOf(a.sheet)-PROCS.indexOf(b.sheet)||a.no-b.no),shown=rows.slice(0,400);
  let fb=Object.keys(FN).filter(k=>f[k]).map(k=>`<span class="fc">${FN[k]}: ${esc(fval(k,f[k]))}<button type="button" data-clear="${k}" aria-label="Hapus filter">×</button></span>`).join('');
  fb+=`<label class="chk"><input type="checkbox" id="gap-allchk" ${f.all?'checked':''}> Tampilkan semua langkah (bukan hanya temuan)</label><span class="lead mono">${rows.length} baris${rows.length>shown.length?', 400 pertama':''}</span>`;
  $('gap-fb').innerHTML=fb;
  $('gap-fb').querySelectorAll('[data-clear]').forEach(b=>b.onclick=()=>{f[b.dataset.clear]=k0(b.dataset.clear);renderGap()});
  $('gap-allchk').onchange=e=>{f.all=e.target.checked;renderGap()};
  $('gap-lt').innerHTML='<thead><tr><th>Cabang</th><th>Proses</th><th>No</th><th>Tahap</th><th>Aktor</th><th>Kat</th><th>Status</th><th>Jenis</th><th>Langkah dan temuan</th></tr></thead><tbody>'+
   shown.map(o=>{const s=eff(o),g=gtype(o),stg=o.tpl==='HO'?stageOf(o.sheet,o.no):null;
     return `<tr><td>${o.site}</td><td>${esc(procOf(o))}</td><td class="mono"><a href="#peta" data-peta="${o.site}|${o.sheet}|${o.no}|${o.loc||''}" title="Buka di Peta">${o.no}</a>${o.orig?`<br><small style="color:var(--muted)">${o.orig}</small>`:''}</td><td>${stg?`<a href="#alur" data-alur="${stg.id}" title="${esc(stg.name)}">${esc(o.sec)}</a>`:esc(o.sec)}</td><td>${esc(o.actor)}${o.actual&&o.actual!==o.actor?`<br><small class="fgl">aktual: ${esc(o.actual)}</small>`:''}</td><td>${o.cat}</td><td><span class="st ${CLS[s]}">${s}</span>${S.view==='adj'&&s!==o.raw?`<br><small class="fgl">awal ${o.raw}</small>`:''}</td><td>${g?`<span class="tp s t${g}">${g.toUpperCase()}</span>`:''}</td>
     <td>${esc(o.crit)}${o.finding?`<br><b>Temuan:</b> ${esc(o.finding)}`:''}${o.note&&o.loc!=='MARCEN'?`<br><small style="color:var(--muted)">Auditor: ${esc(o.note)}</small>`:''}${o.flag?`<br><span class="fgl">⚑ ${esc(FLAGTXT[o.flag]||o.flag)}</span>`:''}</td></tr>`}).join('')+'</tbody>';
  $('gap-lt').querySelectorAll('a[data-peta]').forEach(a=>a.onclick=e=>{e.preventDefault();const [site,sh,no,loc]=a.dataset.peta.split('|');go('peta',{site,proc:sh,sel:+no,...(loc&&loc!=='null'?{loc}:{})})});
  $('gap-lt').querySelectorAll('a[data-alur]').forEach(a=>a.onclick=e=>{e.preventDefault();const st=STAGES.find(x=>x.id===a.dataset.alur);go('alur',{proc:st.sheet,stage:st.id})});
}

/* ===================== MULAI ===================== */
[...$('viewSeg').children].forEach(b=>b.onclick=()=>{S.view=b.dataset.v;render()});
[...$('tabs').children].forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;if(S.tab==='peta'&&S.site==='ALL')setSite(S.lastSite||'JKT');render();window.scrollTo({top:0})});
const modes=[null,'light','dark'],mn=['otomatis','terang','gelap'];let mi=0;
$('themeBtn').onclick=()=>{mi=(mi+1)%3;const r=document.documentElement;modes[mi]?r.setAttribute('data-theme',modes[mi]):r.removeAttribute('data-theme');$('themeBtn').textContent='Tema: '+mn[mi]};
const h0=(location.hash||'').slice(1);if(['alur','peta','gap'].includes(h0))S.tab=h0;
render();
