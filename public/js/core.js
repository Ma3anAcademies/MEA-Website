'use strict';
/* =====================================================================
   MEA – core helpers (templating, dates, store, router, forms, UI)
   ===================================================================== */

/* ---- Site configuration: edit these once launch details are confirmed ---- */
const SITE = {
  name: 'Ma3an Education Academies',
  short: 'MEA',
  tagline: 'Together, we help every child learn, grow and succeed.',
  phone: '020 1234 5678',          // placeholder from design mockups – replace with approved number
  phoneHref: '+442012345678',
  email: 'hello@ma3anacademies.co.uk', // placeholder from design mockups – confirm before launch
  whatsapp: '442012345678',        // international format, no +; leave '' to hide WhatsApp buttons
  hours: 'Mon – Fri: 8:00am – 6:00pm',
  social: {},                      // e.g. { facebook:'https://…', instagram:'https://…', youtube:'…', linkedin:'…', tiktok:'…' }
  siblingDiscount: 10,             // % – set to 0 to hide until officially approved
  previewBuild: true               // shows the "sample content" note in the footer
};
/* Every field above is a fallback default only. Once the site loads, Admin → Setup &
   Integrations → Site Details overwrites these from saved settings (S.settings), so
   changes made there apply everywhere immediately with no code edit or redeploy. */
function applySiteSettings() { if (S && S.settings) Object.assign(SITE, S.settings); }


/* ---- tiny template engine: auto-escapes, nest with h`` ---- */
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
const raw = s => new Raw(String(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function val(v) {
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(val).join('');
  if (v === false || v == null) return '';
  return esc(v);
}
function h(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => { out += s; if (i < vals.length) out += val(vals[i]); });
  return new Raw(out);
}
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n, a, b) => `${n} ${n === 1 ? a : (b || a + 's')}`;
const uid = p => p + '_' + Math.random().toString(36).slice(2, 9);
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashPw(pw, salt = '') { /* PROTOTYPE ONLY – real build must hash server-side (bcrypt/argon2) */
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57; const s = salt + '|' + pw;
  for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/* ---- UK time helpers (all times shown as UK time) ---- */
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MS = MONTHS.map(m => m.slice(0, 3));
function ukNow() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const g = t => p.find(x => x.type === t).value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, min: (+g('hour')) * 60 + (+g('minute')) };
}
const todayISO = () => ukNow().date;
const isoAdd = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dowOf = iso => new Date(iso + 'T12:00:00Z').getUTCDay();
const mondayOf = iso => { const d = dowOf(iso); return isoAdd(iso, d === 0 ? -6 : 1 - d); };
/** Last day (as ISO) of the calendar month containing iso — e.g. 2026-02-10 -> 2026-02-28. */
const endOfMonthISO = iso => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1, 0); return d.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5);
function fmtDate(iso, style = 'short') {
  const d = new Date(iso + 'T12:00:00Z'), w = DS[d.getUTCDay()], dd = d.getUTCDate(), m = d.getUTCMonth(), y = d.getUTCFullYear();
  if (style === 'long') return `${DAYS[d.getUTCDay()]} ${dd} ${MONTHS[m]} ${y}`;
  if (style === 'dm') return `${dd} ${MS[m]}`;
  if (style === 'dmy') return `${dd} ${MS[m]} ${y}`;
  if (style === 'my') return `${MONTHS[m]} ${y}`;
  return `${w} ${dd} ${MS[m]}`;
}
function relDay(iso) { const t = todayISO(), n = daysBetween(t, iso); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : fmtDate(iso); }
function fmtTime(t) { const [hh, mm] = t.split(':').map(Number); const ap = hh >= 12 ? 'pm' : 'am'; return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')}${ap}`; }
const fmtRange = (a, b) => `${fmtTime(a)} – ${fmtTime(b)}`;
const toMin = t => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
const money = n => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
function ago(iso) { const n = daysBetween(iso, todayISO()); return n <= 0 ? 'Today' : n === 1 ? 'Yesterday' : n < 7 ? `${n} days ago` : fmtDate(iso, 'dm'); }

/* ---- persistent store (localStorage, guarded – falls back to memory) ---- */
const STORE_KEY = 'mea_prototype_v4';
let S = null;
function loadStore() { try { const r = localStorage.getItem(STORE_KEY); if (r) return JSON.parse(r); } catch (e) { } return null; }
let saveTimer = 0;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { } }, 60); }
function resetStore() { try { localStorage.removeItem(STORE_KEY); } catch (e) { } S = buildSeed(); save(); }

/* ---- session helpers ---- */
const me = () => S && S.session ? S.users.find(u => u.id === S.session) : null;
const initials = n => n.replace(/^(Mr|Ms|Mrs|Dr|Miss)\.?\s+/i, '').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const AVCOL = ['av-blue', 'av-pink', 'av-yellow', 'av-green', 'av-purple'];
function avatar(name, i = 0, size = '') { return h`<span class="avatar ${size} ${AVCOL[i % AVCOL.length]}" aria-hidden="true">${initials(name)}</span>`; }
const kidColor = i => ['blue', 'pink', 'yellow', 'green', 'purple'][i % 5];

/* ---- router ---- */
const Routes = [];
function R(pattern, fn, opt = {}) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:[a-zA-Z]+/g, m => { keys.push(m.slice(1)); return '([^/]+)'; }) + '/?$');
  Routes.push({ re, keys, fn, opt });
}
function parseHash() {
  let hh = location.hash.replace(/^#/, ''); if (!hh) hh = '/';
  const i = hh.indexOf('?'); const p = i < 0 ? hh : hh.slice(0, i); const qs = i < 0 ? '' : hh.slice(i + 1);
  const q = {}; new URLSearchParams(qs).forEach((v, k) => { q[k] = v; });
  return { path: p.startsWith('/') ? p : '/' + p, q };
}
function qs(obj) { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v != null && v !== false) p.set(k, v); }); const s = p.toString(); return s ? '?' + s : ''; }
function go(path, replace) {
  if (replace) { history.replaceState(null, '', '#' + path); render(); return; }
  if (location.hash === '#' + path) render(); else location.hash = '#' + path;
}
let Q = {};          // current query
function setQuery(patch, keepScroll = true) {
  const { path, q } = parseHash(); const nq = { ...q, ...patch };
  Object.keys(nq).forEach(k => { if (nq[k] === '' || nq[k] == null) delete nq[k]; });
  history.replaceState(null, '', '#' + path + qs(nq)); render({ keepScroll });
}

/* ---- UI helpers ---- */
const UI = {};       // transient view state (tabs, filters, steps…)
let toastTimer = 0;
function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.innerHTML = ic('check-circle').s + '<span></span>'; $('span', t).textContent = msg;
  t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3400);
}
function openModal({ title, body, foot }) {
  const d = $('#modal'); d.innerHTML = val(h`<div class="dh"><h2 id="modal-t">${title}</h2><button class="ibtn" data-act="closeModal" aria-label="Close dialog">${ic('x')}</button></div><div class="db">${body}</div>${foot ? h`<div class="df">${foot}</div>` : ''}`);
  d.setAttribute('aria-labelledby', 'modal-t'); if (!d.open) d.showModal();
}
function closeModal() { const d = $('#modal'); if (d && d.open) d.close(); }

/* ---- reusable components ---- */
const btn = (label, href, cls = 'btn-primary', icon) => h`<a class="btn ${cls}" href="#${href}">${label}${icon ? ic(icon) : ''}</a>`;
const chip = (text, cls = 'chip-grey', icon) => h`<span class="chip ${cls}">${icon ? ic(icon) : ''}${text}</span>`;
/** A horizontally-scrolling row with arrow buttons either side. `id` must be
    unique on the page; `itemsHtml` is the already-built row of card markup. */
function carousel(id, itemsHtml, label) {
  return h`<div class="car" id="${id}" role="group" ${label ? raw(`aria-label="${esc(label)}"`) : ''}>
    <button class="car-btn" type="button" data-act="carScroll" data-target="${id}" data-dir="-1" aria-label="Scroll left">${ic('chevron-left')}</button>
    <div class="car-track">${itemsHtml}</div>
    <button class="car-btn" type="button" data-act="carScroll" data-target="${id}" data-dir="1" aria-label="Scroll right">${ic('chevron-right')}</button>
  </div>`;
}
/** A grid of icon+title+paragraph cards where the paragraph only shows on hover
    or keyboard focus. `items` is [[icon, title, desc, color], ...]. */
function featHov(items, gridClass = 'g3') {
  return h`<div class="grid ${gridClass}">${items.map(([i, t, d, c]) => h`<div class="card feat feat-hov" tabindex="0"><span class="ico c-${c}">${ic(i)}</span><div><h3>${t}</h3><p>${d}</p></div></div>`)}</div>`;
}
function statusChip(st) {
  const M = {
    'Active': ['chip-green', 'check-circle'], 'Pending Confirmation': ['chip-yellow', 'clock'], 'Waitlisted': ['chip-purple', 'clock'], 'Completed': ['chip-grey', 'check'],
    'Cancelled': ['chip-red', 'x'], 'Withdrawn': ['chip-red', 'x'], 'Declined': ['chip-red', 'x'],
    'To do': ['chip-yellow', 'clock'], 'Due soon': ['chip-pink', 'alert-triangle'], 'Overdue': ['chip-red', 'alert-triangle'], 'Submitted': ['chip-blue', 'check'], 'Marked': ['chip-green', 'check-circle'],
    'Paid': ['chip-green', 'check-circle'], 'Due': ['chip-yellow', 'clock'], 'Open': ['chip-blue', 'circle'], 'Resolved': ['chip-green', 'check-circle'], 'New': ['chip-pink', 'sparkles'],
    'Present': ['chip-green', 'check'], 'Absent': ['chip-red', 'x'], 'Late': ['chip-yellow', 'clock'], 'Excused': ['chip-grey', 'info']
  };
  const [c, i] = M[st] || ['chip-grey', 'info']; return chip(st, c, i);
}
function emptyState({ icon = 'info', title, text, action }) {
  return h`<div class="empty"><div class="ico c-blue lg">${ic(icon)}</div><h3>${title}</h3><p>${text}</p>${action || ''}</div>`;
}
function fld(o) {
  const id = 'f_' + o.name, req = o.req ? ' <span aria-hidden="true">*</span>' : '';
  const common = `id="${id}" name="${o.name}" ${o.req ? 'aria-required="true"' : ''} aria-describedby="err_${o.name}${o.hint ? ' hint_' + o.name : ''}"`;
  let ctl;
  if (o.type === 'select') ctl = h`<select class="sel" ${raw(common)} ${o.attrs ? raw(o.attrs) : ''}>${o.ph !== undefined ? h`<option value="">${o.ph}</option>` : ''}${(o.options || []).map(x => { const [v, l] = Array.isArray(x) ? x : [x, x]; return h`<option value="${v}" ${String(v) === String(o.value) ? raw('selected') : ''}>${l}</option>`; })}</select>`;
  else if (o.type === 'textarea') ctl = h`<textarea class="txt" ${raw(common)} placeholder="${o.ph || ''}" rows="${o.rows || 5}">${o.value || ''}</textarea>`;
  else ctl = h`<input class="inp" ${raw(common)} type="${o.type || 'text'}" value="${o.value ?? ''}" placeholder="${o.ph || ''}" ${o.auto ? raw(`autocomplete="${o.auto}"`) : ''} ${o.attrs ? raw(o.attrs) : ''}>`;
  return h`<div class="field ${o.full ? 'full' : ''}"><label for="${id}">${o.label}${raw(req)}</label>${ctl}${o.hint ? h`<div class="hint" id="hint_${o.name}">${o.hint}</div>` : ''}<div class="err" id="err_${o.name}" aria-live="polite" hidden></div></div>`;
}
function chk(name, label, checked, req) { return h`<div class="field"><label class="check"><input type="checkbox" name="${name}" ${checked ? raw('checked') : ''} ${req ? raw('aria-required="true"') : ''}><span>${label}</span></label><div class="err" id="err_${name}" aria-live="polite" hidden></div></div>`; }
function showErrors(form, errs) {
  $$('.err', form).forEach(e => { e.hidden = true; e.textContent = ''; });
  $$('[aria-invalid]', form).forEach(e => e.removeAttribute('aria-invalid'));
  let first = null;
  Object.entries(errs).forEach(([k, msg]) => {
    const el = form.elements[k], er = $('#err_' + k, form); if (er) { er.textContent = msg; er.hidden = false; }
    if (el) { if (el.setAttribute) el.setAttribute('aria-invalid', 'true'); if (!first) first = el; }
  });
  if (first && first.focus) first.focus();
  return Object.keys(errs).length === 0;
}
function formVals(form) {
  const o = {};
  [...form.elements].forEach(el => { if (!el.name) return; if (el.type === 'checkbox') o[el.name] = el.checked; else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; } else if (el.type === 'file') o[el.name] = el.files && el.files[0] ? el.files[0].name : ''; else if (el.type === 'select-multiple') o[el.name] = [...el.selectedOptions].map(x => x.value).join(', '); else o[el.name] = el.value.trim(); });
  return o;
}
/** A <select multiple> field: options is an array of strings, csv is the
    stored comma-separated value ("Mathematics, Physics") to pre-select. */
function multiSelectField(o) {
  const id = 'f_' + o.name, selected = new Set((o.value || '').split(',').map(s => s.trim()).filter(Boolean));
  return h`<div class="field ${o.full ? 'full' : ''}"><label for="${id}">${o.label}</label><select class="sel" id="${id}" name="${o.name}" multiple size="${Math.min(o.options.length, o.size || 6)}" aria-describedby="${o.hint ? 'hint_' + o.name : ''}">${o.options.map(v => h`<option value="${v}" ${selected.has(v) ? raw('selected') : ''}>${v}</option>`)}</select>${o.hint ? h`<div class="hint" id="hint_${o.name}">${o.hint}</div>` : ''}<div class="err" id="err_${o.name}" aria-live="polite" hidden></div></div>`;
}
const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const isUKPhone = s => /^(?:\+44|0044|0)\s?\d[\d\s]{8,12}$/.test(s.replace(/[()-]/g, ''));
function tableHTML(cols, rows, { stack = true, plain = false, empty = 'Nothing to show yet.' } = {}) {
  if (!rows.length) return h`<div class="panel center muted">${empty}</div>`;
  return h`<div class="tbl-wrap"><table class="tbl ${stack ? 'stack' : ''} ${plain ? 'plain' : ''}"><thead><tr>${cols.map(c => h`<th scope="col">${c.replace(/^~/, '')}</th>`)}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
const td = (label, content, cls = '') => h`<td data-l="${label}" class="${cls}">${content}</td>`;
