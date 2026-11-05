/* HANYA untuk pratinjau lokal/Artifact: meniru google.script.run (Code.gs) dengan penyimpanan browser. Tidak dipakai di Apps Script. */
(function(){
  const K = 'mkt-audit-preview-v1';
  const T = {C:'COMPLY', NC:'NON-COMPLY', NA:'N/A'};
  let db = null; try { db = JSON.parse(localStorage.getItem(K)); } catch(e){}
  const save = () => { try { localStorage.setItem(K, JSON.stringify(db)); } catch(e){} };
  const user = {email:'auditor@kantor (contoh)', nama:'Auditor Contoh', peran:'auditor'};
  function parts(doc){ const s = DATA.sites.find(x => x.code === doc.site), out = [];
    s.sheets.forEach(sh => { if (sh === 'CY' && !doc.cy) return; const u = (s.units||{})[sh];
      if (u && u.length) u.forEach(x => out.push({key: sh+'|'+x, sheet: sh})); else out.push({key: sh, sheet: sh}); }); return out; }
  function items(doc, p){ const sh = DATA.sheets.find(x => x.site === doc.site && x.sheet === p.sheet), ids = {};
    sh.sections.forEach(x => { if (!(x.opt && !(p.sheet === 'CY' ? doc.cy : doc.full))) ids[x.id] = 1; }); return sh.items.filter(i => ids[i.s]); }
  function sum(doc){ const t = {total:0,done:0,C:0,NC:0,NA:0,need:0,ncd:0}, ans = db.res[doc.id] || {};
    parts(doc).forEach(p => items(doc,p).forEach(i => { const a = (ans[p.key]||{})[i.n] || {}; t.total++;
      if (a.d && a.g) t.done++; if (a.g) t[a.g]++; if (a.d === 'NC') t.ncd++; if ((a.d==='NC'||a.g==='NC') && !(a.f||'').trim()) t.need++; })); return t; }
  function newDoc(site, date, partner, cy, full){ const no = 'FRM-OPS-001-' + String(db.next++).padStart(4,'0');
    const d = {id: Math.random().toString(36).slice(2,10), no, site, date, lead: user.email, leadName: user.nama, partner, cy, full, status:'draft', created: Date.now(), upd: Date.now()};
    db.docs.push(d); db.res[d.id] = {}; return d; }
  if (!db){ db = {docs:[], res:{}, next:6};
    const d = newDoc('JKT', '2026-12-08', '', false, false), r = db.res[d.id].EXPORT = {};
    [[1,'C','C',''],[2,'C','C',''],[3,'C','NC','Jam tiba tidak dicatat di logbook pos'],[4,'C','C',''],[5,'NA','NA',''],[6,'C','C','']]
      .forEach(([n,dd,g,f]) => r[n] = {d:dd, g, f, a:'', ph:[], t: Date.now(), by:'auditor2@kantor (contoh)'});
    save(); }
  const clone = o => JSON.parse(JSON.stringify(o));
  const find = id => { const d = db.docs.find(x => x.id === id); if (!d) throw new Error('Dokumen tidak ditemukan.'); return d; };
  const api = {
    apiBootstrap: () => ({user, docs: db.docs.map(d => Object.assign(clone(d), {sum: sum(d)})), nextNo: 'FRM-OPS-001-' + String(db.next).padStart(4,'0')}),
    apiGetDoc: id => ({doc: clone(find(id)), ans: clone(db.res[id] || {})}),
    apiCreateDoc: f => { if (!f.date) throw new Error('Tanggal audit belum diisi.'); const d = newDoc(f.site, f.date, f.partner, f.cy, f.full); save(); return api.apiGetDoc(d.id); },
    apiSave: (id, list) => { const d = find(id); if (d.status === 'final') throw new Error('Dokumen ' + d.no + ' sudah dikunci.');
      list.forEach(x => { const r = (db.res[id][x.part] = db.res[id][x.part] || {}); const a = r[x.no] = r[x.no] || {};
        ['d','g','f','a','ph'].forEach(k => { if (k in x) a[k] = x[k]; }); a.t = Date.now(); a.by = user.email; });
      d.upd = Date.now(); save(); return {t: d.upd}; },
    apiUploadPhoto: (id, part, no, full, th) => ({id: 'foto' + Date.now(), url: full, th}),
    apiLock: id => { const d = find(id), t = sum(d), why = [];
      if (t.need) why.push(t.need + ' langkah NC belum ada temuan'); if (t.done < t.total) why.push((t.total - t.done) + ' langkah belum lengkap');
      if (why.length) throw new Error('Belum bisa dikunci: ' + why.join('; ') + '.');
      d.status = 'final'; d.locked = Date.now(); d.lockedBy = user.email; save(); return api.apiGetDoc(id); },
    apiExport: id => { throw new Error('Pratinjau: ekspor ke Drive hanya berjalan di Apps Script.'); }
  };
  function runner(ok, fail){ return new Proxy({}, {get: (_, k) => {
    if (k === 'withSuccessHandler') return f => runner(f, fail);
    if (k === 'withFailureHandler') return f => runner(ok, f);
    return (...args) => setTimeout(() => { try { const r = api[k](...clone(args)); ok && ok(r); } catch(e){ fail && fail(e); } }, 350); }}); }
  window.google = {script: {run: runner(), history: {push(){}, setChangeHandler(){}}}};
})();
