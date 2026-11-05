/**
 * MKT Audit SOP — web app form audit di HP.
 * Data: Google Sheets (DOKUMEN, HASIL, PENGGUNA, MASTER_LANGKAH). Foto & ekspor: folder Google Drive.
 * Master langkah ada di Data.html (dibangun dari repo: apps/audit-mobile/build_gas.py). Jangan edit Data.html manual.
 *
 * Pertama kali: jalankan setup() dari editor Apps Script, lalu Deploy > New deployment > Web app.
 */
var APP_TITLE = 'MKT Audit SOP';
var FORM_PREFIX = 'FRM-OPS-001-';
var FIRST_NO = 6; // 0001–0005 dipakai audit Agustus–September 2026
var COLS = {
  DOKUMEN: ['id', 'no_formulir', 'cabang', 'tanggal', 'lead_email', 'lead_nama', 'pendamping', 'ikut_cy', 'ikut_full',
            'status', 'dibuat', 'diubah', 'dikunci', 'dikunci_oleh'],
  HASIL: ['key', 'doc_id', 'no_formulir', 'cabang', 'bagian', 'layanan', 'unit', 'tahap', 'no_langkah',
          'status_dokumen', 'status_lapangan', 'temuan', 'pelaksana_aktual', 'foto', 'diubah', 'diubah_oleh', 'foto_meta'],
  PENGGUNA: ['email', 'nama', 'peran', 'aktif'],
  MASTER_LANGKAH: ['cabang', 'layanan', 'tahap', 'nama_tahap', 'sop_tahap', 'disiapkan_belum_diaudit', 'no', 'kategori',
                   'kriteria', 'pic', 'ref_sop', 'sebelumnya_dokumen', 'sebelumnya_lapangan', 'sebelumnya_temuan']
};
var CODE2TXT = { C: 'COMPLY', NC: 'NON-COMPLY', NA: 'N/A' };
var TXT2CODE = { 'COMPLY': 'C', 'NON-COMPLY': 'NC', 'N/A': 'NA' };

/* ================= web app ================= */
function doGet(e) {
  var page = e && e.parameter && e.parameter.page;
  var base = ScriptApp.getService().getUrl();
  var t = HtmlService.createTemplateFromFile(page === 'alur' ? 'Alur' : 'Index');
  t.appUrl = base; t.alurUrl = base + '?page=alur';
  return t.evaluate()
    .setTitle(page === 'alur' ? 'MKT Business Process' : APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}
function include(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }

/* ================= setup (jalankan sekali dari editor) ================= */
function setup() {
  var p = PropertiesService.getScriptProperties();
  var ss = p.getProperty('SS_ID') ? SpreadsheetApp.openById(p.getProperty('SS_ID')) : null;
  if (!ss) { ss = SpreadsheetApp.create('MKT Audit SOP – Data'); p.setProperty('SS_ID', ss.getId()); }
  Object.keys(COLS).forEach(function (n) {
    var sh = ss.getSheetByName(n) || ss.insertSheet(n);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, COLS[n].length).setValues([COLS[n]]).setFontWeight('bold').setBackground('#FFFBEB').setFontColor('#461902');
      sh.setFrozenRows(1);
    }
  });
  ss.getSheetByName('DOKUMEN').getRange('D:D').setNumberFormat('@');
  var def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  if (!p.getProperty('FOLDER_ID')) p.setProperty('FOLDER_ID', DriveApp.createFolder('MKT Audit SOP – Foto & Ekspor').getId());
  if (!p.getProperty('NEXT_NO')) p.setProperty('NEXT_NO', String(FIRST_NO));
  var me = Session.getEffectiveUser().getEmail();
  var u = ss.getSheetByName('PENGGUNA');
  var emails = u.getLastRow() > 1 ? u.getRange(2, 1, u.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]).toLowerCase(); }) : [];
  if (emails.indexOf(me.toLowerCase()) < 0) u.appendRow([me, 'Admin', 'admin', true]);
  writeMaster_(ss);
  importHistory_(ss);
  Logger.log('Spreadsheet data: ' + ss.getUrl());
  Logger.log('Folder Drive: ' + DriveApp.getFolderById(p.getProperty('FOLDER_ID')).getUrl());
}
/** Tulis ulang sheet MASTER_LANGKAH dari Data.html (untuk dibaca manusia / dashboard). */
function writeMaster_(ss) {
  var D = getData_(), rows = [];
  D.sheets.forEach(function (s) {
    var secs = {}; s.sections.forEach(function (x) { secs[x.id] = x; });
    s.items.forEach(function (i) {
      var x = secs[i.s], pv = i.p.g !== undefined ? i.p : (i.p.semper || {});
      rows.push([s.site, s.sheet, i.s, x.name, x.sop, x.opt ? 'YA' : '', i.n, i.k, i.c, i.a, i.r,
                 CODE2TXT[pv.d] || (pv.d === 'P' ? 'PENDING' : ''), CODE2TXT[pv.g] || (pv.g === 'P' ? 'PENDING' : ''), pv.f || '']);
    });
  });
  var sh = ss.getSheetByName('MASTER_LANGKAH');
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, COLS.MASTER_LANGKAH.length).clearContent();
  sh.getRange(2, 1, rows.length, COLS.MASTER_LANGKAH.length).setValues(rows);
}

/** Cek nama file di project. Jalankan dari editor bila muncul "No HTML file named ... was found". */
function cekPemasangan() {
  ['Index', 'App', 'Data', 'Alur'].forEach(function (n) {
    try { HtmlService.createHtmlOutputFromFile(n); Logger.log('OK      ' + n + '.html'); }
    catch (e) { Logger.log('HILANG  ' + n + '.html  -> buat file HTML bernama persis "' + n + '" (huruf besar-kecil berpengaruh, tanpa .html)'); }
  });
  var p = PropertiesService.getScriptProperties();
  Logger.log('SS_ID: ' + (p.getProperty('SS_ID') || 'belum ada, jalankan setup()'));
}

/** Masukkan hasil audit Juli–September 2026 (FRM-OPS-001-0001 s.d. 0005) sebagai dokumen final. Aman diulang. */
function importHistory_(ss) {
  var D = getData_(), have = rows_('DOKUMEN').map(function (r) { return String(r.id); });
  var shD = ss.getSheetByName('DOKUMEN'), shH = ss.getSheetByName('HASIL'), W = COLS.HASIL.length;
  D.sites.forEach(function (s) {
    var id = 'hist-' + s.code; if (have.indexOf(id) >= 0) return;
    var cy = D.sheets.some(function (x) { return x.site === s.code && x.sheet === 'CY' && x.items.some(function (i) { return i.p.g && i.p.g !== 'P'; }); });
    var doc = { id: id, site: s.code, cy: cy, full: false };
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s.date), when = m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : new Date();
    var rows = [];
    partsOf_(doc).forEach(function (p) {
      itemsOf_(doc, p).forEach(function (i) {
        var pv = p.unit ? (i.p[p.unit.toLowerCase()] || {}) : i.p;
        if (!pv.g || pv.g === 'P') return;
        rows.push([id + '|' + p.key + '|' + i.n, id, s.audit_no, s.code, p.key, p.sheet, p.unit || '', i.s, i.n,
                   CODE2TXT[pv.d] || '', CODE2TXT[pv.g] || '', pv.f || '', pv.aa || '', '', when, 'impor data audit 2026', '[]']);
      });
    });
    shD.appendRow([id, s.audit_no, s.code, s.date, '', s.lead || D.lead || '', '', cy, false, 'final', when, when, when, 'impor data audit 2026']);
    if (rows.length) shH.getRange(shH.getLastRow() + 1, 1, rows.length, W).setValues(rows);
  });
}

/* ================= helper ================= */
var DATA_CACHE_ = null;
function getData_() {
  if (DATA_CACHE_) return DATA_CACHE_;
  var c = HtmlService.createHtmlOutputFromFile('Data').getContent();
  DATA_CACHE_ = JSON.parse(c.slice(c.indexOf('{'), c.lastIndexOf('}') + 1));
  return DATA_CACHE_;
}
function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty('SS_ID');
  if (!id) throw new Error('Aplikasi belum disiapkan. Admin perlu menjalankan setup() di editor Apps Script.');
  return SpreadsheetApp.openById(id);
}
function sheet_(n) { return ss_().getSheetByName(n); }
function rows_(n) {
  var sh = sheet_(n), v = sh.getDataRange().getValues(), h = v.shift();
  return v.map(function (r, ix) { var o = { _row: ix + 2 }; h.forEach(function (k, j) { o[k] = r[j]; }); return o; });
}
function ms_(v) { return v instanceof Date ? v.getTime() : (v ? Number(v) || null : null); }
function user_() {
  var email = Session.getActiveUser().getEmail();
  if (!email) throw new Error('Email akun tidak terbaca. Buka aplikasi dengan akun Google kantor.');
  var u = rows_('PENGGUNA').filter(function (r) { return String(r.email).toLowerCase() === email.toLowerCase(); })[0];
  var active = u && (u.aktif === true || String(u.aktif).toUpperCase() === 'TRUE');
  return { email: email, nama: (u && u.nama) || email.split('@')[0], peran: active ? String(u.peran || 'auditor').toLowerCase() : 'viewer' };
}
function mustWrite_(u) {
  if (u.peran !== 'admin' && u.peran !== 'auditor')
    throw new Error('Akun ' + u.email + ' belum terdaftar sebagai auditor. Minta admin menambahkan email ini di sheet PENGGUNA.');
}
function docFromRow_(r) {
  return { id: String(r.id), no: r.no_formulir, site: r.cabang, date: String(r.tanggal), lead: r.lead_email, leadName: r.lead_nama,
    partner: r.pendamping, cy: r.ikut_cy === true || r.ikut_cy === 'TRUE', full: r.ikut_full === true || r.ikut_full === 'TRUE',
    status: r.status, created: ms_(r.dibuat), upd: ms_(r.diubah), locked: ms_(r.dikunci), lockedBy: r.dikunci_oleh, _row: r._row };
}
function findDoc_(id) {
  var r = rows_('DOKUMEN').filter(function (x) { return String(x.id) === String(id); })[0];
  if (!r) throw new Error('Dokumen tidak ditemukan.');
  return docFromRow_(r);
}
function ansFromRow_(r) {
  var meta = []; try { meta = r.foto_meta ? JSON.parse(r.foto_meta) : []; } catch (e) {}
  return { d: TXT2CODE[r.status_dokumen] || null, g: TXT2CODE[r.status_lapangan] || null, f: r.temuan || '', a: r.pelaksana_aktual || '',
           ph: meta, t: ms_(r.diubah), by: r.diubah_oleh || '' };
}
function partsOf_(doc) {
  var D = getData_(), s = D.sites.filter(function (x) { return x.code === doc.site; })[0], out = [];
  s.sheets.forEach(function (sh) {
    if (sh === 'CY' && !doc.cy) return;
    var units = (s.units || {})[sh];
    if (units && units.length) units.forEach(function (u) { out.push({ key: sh + '|' + u, sheet: sh, unit: u }); });
    else out.push({ key: sh, sheet: sh, unit: null });
  });
  return out;
}
function itemsOf_(doc, p) {
  var D = getData_(), sh = D.sheets.filter(function (x) { return x.site === doc.site && x.sheet === p.sheet; })[0], ids = {};
  sh.sections.forEach(function (x) { if (!(x.opt && !(p.sheet === 'CY' ? doc.cy : doc.full))) ids[x.id] = true; });
  return sh.items.filter(function (i) { return ids[i.s]; });
}
function summarize_(doc, ans) {
  var t = { total: 0, done: 0, C: 0, NC: 0, NA: 0, need: 0, ncd: 0 };
  partsOf_(doc).forEach(function (p) {
    itemsOf_(doc, p).forEach(function (i) {
      var a = (ans[p.key] || {})[i.n] || {};
      t.total++; if (a.d && a.g) t.done++;
      if (a.g === 'C') t.C++; if (a.g === 'NC') t.NC++; if (a.g === 'NA') t.NA++; if (a.d === 'NC') t.ncd++;
      if ((a.d === 'NC' || a.g === 'NC') && !String(a.f || '').trim()) t.need++;
    });
  });
  return t;
}
function answersOf_(docId, all) {
  var ans = {};
  (all || rows_('HASIL')).forEach(function (r) {
    if (String(r.doc_id) !== String(docId)) return;
    (ans[r.bagian] = ans[r.bagian] || {})[r.no_langkah] = ansFromRow_(r);
  });
  return ans;
}
function withLock_(fn) {
  var l = LockService.getScriptLock();
  if (!l.tryLock(20000)) throw new Error('Server sedang sibuk. Coba lagi beberapa detik lagi.');
  try { return fn(); } finally { l.releaseLock(); }
}

/* ================= API untuk halaman ================= */
function apiBootstrap() {
  var u = user_(), all = rows_('HASIL');
  var docs = rows_('DOKUMEN').map(docFromRow_).map(function (d) { d.sum = summarize_(d, answersOf_(d.id, all)); delete d._row; return d; });
  return { user: u, docs: docs, nextNo: FORM_PREFIX + ('000' + (PropertiesService.getScriptProperties().getProperty('NEXT_NO') || FIRST_NO)).slice(-4) };
}
function apiGetDoc(id) {
  user_(); var d = findDoc_(id); delete d._row;
  return { doc: d, ans: answersOf_(id) };
}
function apiCreateDoc(f) {
  var u = user_(); mustWrite_(u);
  var D = getData_();
  if (!D.sites.some(function (s) { return s.code === f.site; })) throw new Error('Cabang tidak dikenal.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date || '')) throw new Error('Tanggal audit belum diisi.');
  return withLock_(function () {
    var p = PropertiesService.getScriptProperties(), n = Number(p.getProperty('NEXT_NO') || FIRST_NO);
    var no = FORM_PREFIX + ('000' + n).slice(-4), id = Utilities.getUuid().slice(0, 8), now = new Date();
    sheet_('DOKUMEN').appendRow([id, no, f.site, f.date, u.email, u.nama, String(f.partner || '').slice(0, 120), !!f.cy, !!f.full, 'draft', now, now, '', '']);
    p.setProperty('NEXT_NO', String(n + 1));
    return apiGetDoc(id);
  });
}
/** list: [{part, no, d, g, f, a, ph}] — hanya field yang dikirim yang diubah. */
function apiSave(docId, list) {
  var u = user_(); mustWrite_(u);
  return withLock_(function () {
    var doc = findDoc_(docId);
    if (doc.status === 'final') throw new Error('Dokumen ' + doc.no + ' sudah dikunci.');
    var sh = sheet_('HASIL'), last = sh.getLastRow(), now = new Date(), W = COLS.HASIL.length;
    var keys = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
    var parts = {}; partsOf_(doc).forEach(function (p) { parts[p.key] = p; });
    var appends = [];
    list.forEach(function (x) {
      var p = parts[x.part]; if (!p) return;
      var item = itemsOf_(doc, p).filter(function (i) { return String(i.n) === String(x.no); })[0]; if (!item) return;
      var key = docId + '|' + x.part + '|' + x.no, ix = keys.indexOf(key), row;
      if (ix >= 0) row = sh.getRange(ix + 2, 1, 1, W).getValues()[0];
      else { var pend = appends.filter(function (a) { return a[0] === key; })[0];
        row = pend || [key, docId, doc.no, doc.site, x.part, p.sheet, p.unit || '', item.s, item.n, '', '', '', '', '', '', '', '']; }
      if ('d' in x) row[9] = CODE2TXT[x.d] || '';
      if ('g' in x) row[10] = CODE2TXT[x.g] || '';
      if ('f' in x) row[11] = String(x.f || '').slice(0, 2000);
      if ('a' in x) row[12] = String(x.a || '').slice(0, 200);
      if ('ph' in x) { var ph = (x.ph || []).slice(0, 3); row[13] = ph.map(function (q) { return q.url; }).join('\n'); row[16] = JSON.stringify(ph); }
      row[14] = now; row[15] = u.email;
      if (ix >= 0) sh.getRange(ix + 2, 1, 1, W).setValues([row]);
      else if (appends.indexOf(row) < 0) appends.push(row);
    });
    if (appends.length) sh.getRange(sh.getLastRow() + 1, 1, appends.length, W).setValues(appends);
    sheet_('DOKUMEN').getRange(doc._row, COLS.DOKUMEN.indexOf('diubah') + 1).setValue(now);
    return { t: now.getTime() };
  });
}
function apiUploadPhoto(docId, part, no, dataUrl, thumb) {
  var u = user_(); mustWrite_(u);
  var doc = findDoc_(docId);
  if (doc.status === 'final') throw new Error('Dokumen sudah dikunci.');
  var root = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('FOLDER_ID'));
  var it = root.getFoldersByName(doc.no), folder = it.hasNext() ? it.next() : root.createFolder(doc.no);
  var b64 = String(dataUrl).split(',')[1];
  var name = [doc.no, part.replace('|', '-'), 'langkah' + no, Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss')].join('_') + '.jpg';
  var file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', name));
  return { id: file.getId(), url: file.getUrl(), th: String(thumb || '').slice(0, 20000) };
}
function apiLock(docId) {
  var u = user_(); mustWrite_(u);
  return withLock_(function () {
    var doc = findDoc_(docId);
    if (doc.status === 'final') return apiGetDoc(docId);
    var t = summarize_(doc, answersOf_(docId));
    var why = [];
    if (t.need) why.push(t.need + ' langkah NC belum ada temuan');
    if (t.done < t.total) why.push((t.total - t.done) + ' langkah belum lengkap');
    if (why.length) throw new Error('Belum bisa dikunci: ' + why.join('; ') + '.');
    var sh = sheet_('DOKUMEN'), now = new Date();
    sh.getRange(doc._row, COLS.DOKUMEN.indexOf('status') + 1).setValue('final');
    sh.getRange(doc._row, COLS.DOKUMEN.indexOf('diubah') + 1, 1, 3).setValues([[now, now, u.email]]);
    return apiGetDoc(docId);
  });
}
/** Simpan hasil dokumen sebagai JSON di Drive (untuk diarsipkan ke repo Warehouse-Operation). */
function apiExport(docId) {
  var u = user_(); mustWrite_(u);
  var doc = findDoc_(docId), ans = answersOf_(docId), out = [];
  partsOf_(doc).forEach(function (p) {
    itemsOf_(doc, p).forEach(function (i) {
      var a = (ans[p.key] || {})[i.n] || {};
      out.push({ part: p.key, sheet: p.sheet, unit: p.unit, section: i.s, no: i.n, criterion: i.c, actor: i.a, sop_ref: i.r,
        doc_status: CODE2TXT[a.d] || null, status: CODE2TXT[a.g] || null, finding: a.f || '', actor_actual: a.a || '',
        photos: (a.ph || []).map(function (q) { return q.url; }), updated_by: a.by || '' });
    });
  });
  delete doc._row;
  var json = JSON.stringify({ exported: new Date().toISOString(), exported_by: u.email, doc: doc, summary: summarize_(doc, ans), items: out }, null, 1);
  var root = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('FOLDER_ID'));
  var f = root.createFile(doc.no + '_' + doc.site + '.json', json, 'application/json');
  return { url: f.getUrl(), name: f.getName() };
}
