const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage();
await p.goto('file:///tmp/claude-0/-home-user/05ab2ce3-8507-5197-b8bd-312cc2cd866f/scratchpad/peta_alur_umum.html');
const out=await p.evaluate(()=>{
  const r=[];
  for(const k of Object.keys(FLOWS)){let idx=0;
    for(const ph of FLOWS[k].phases){const seq=!ph.name.startsWith('Proses pendukung');
      for(const c of ph.cards){
        const lc=locOf(c);const pe=pend(c);
        let nc=null;if(!pe){const x=counts(c);nc=Array.isArray(x)?x:x}
        r.push({flow:FLOWS[k].label,phase:ph.name,phmeta:ph.meta,no:seq?++idx:null,name:c.n,cond:c.cond||'',pic:c.pic,
          main:AREAS[lc[0]],others:lc.slice(1).map(a=>AREAS[a]),sop:c.sop,ref:c.ref,
          in:c.in.map(d=>typeof d==='string'?{t:d,sig:0}:d),out:c.out.map(d=>typeof d==='string'?{t:d,sig:0}:d),
          sys:(c.sys||'').replace(/<[^>]+>/g,''),pending:pe,nc})}}}
  return r});
fs.writeFileSync('flow_rows.json',JSON.stringify(out,null,1));console.log(out.length);await b.close()})();
