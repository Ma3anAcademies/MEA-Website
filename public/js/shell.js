'use strict';
/* =====================================================================
   MEA – shells (public site, parent portal, teacher/admin), render(), events
   ===================================================================== */
const Actions = {}, Forms = {}, Changes = {};
Actions.carScroll = t => {
  const track = document.querySelector('#' + CSS.escape(t.dataset.target) + ' .car-track'); if (!track) return;
  track.scrollBy({ left: track.clientWidth * 0.8 * Number(t.dataset.dir), behavior: 'smooth' });
};
const homeFor = u => !u ? '/' : u.role === 'parent' ? '/my-mea' : u.role === 'teacher' ? '/teacher' : '/admin';
const isAct = (path, p) => p === '/' ? path === '/' : (path === p || path.startsWith(p + '/'));

const NAV = [
  { l: 'Home', p: '/' }, { l: 'About MEA', p: '/about' }, { l: 'Courses & Subjects', p: '/courses', dd: 'courses' },
  { l: 'Timetable', p: '/timetables-fees' }, { l: 'Student Success', p: '/student-success' }, { l: 'Resources', p: '/resources', dd: 'resources' },
  { l: 'FAQs', p: '/faqs' }, { l: 'Contact Us', p: '/contact' }
];
function ddContent(k, mobile) {
  if (k === 'courses') return h`<div class="${mobile ? '' : 'dd-cols'}">${Object.values(SYS).map(s => h`<div><h4>${s.short}</h4>${activeLevels(s.id).map(l => h`<a href="#/courses${qs({ system: s.id, level: l.id })}">${l.name}</a>`)}</div>`)}</div><a href="#/courses${qs({ at: 'course-finder' })}"><strong>Course Finder</strong> – find the right class</a>`;
  return h`<div>${GUIDE_CATS.map(c => h`<a href="#/resources${qs({ cat: c.id })}">${c.name}</a>`)}</div>`;
}
function authButtons(u, mobile) {
  if (!u) return h`<a class="btn btn-outline btn-sm" href="#/account/sign-in">Sign In</a><a class="btn btn-pink btn-sm" href="#/account/create">Create Account</a>`;
  const label = u.role === 'parent' ? 'My MEA' : u.role === 'teacher' ? 'Teacher Portal' : 'Admin Portal';
  if (mobile) return h`<a class="btn btn-primary" href="#${homeFor(u)}">${label}</a><button class="btn btn-outline" data-act="signOut">Sign Out</button>`;
  return h`<a class="btn btn-primary btn-sm" href="#${homeFor(u)}">${ic('home')}${label}</a>
  <div class="menu"><button class="who-btn" data-act="toggleMenu" aria-haspopup="true" aria-expanded="false" aria-label="Account menu for ${u.name}">${avatar(u.name, 0, 'sm')}${ic('chevron-down')}</button>
  <div class="menu-pop"><div class="who"><strong>${u.name}</strong><div class="small muted">${u.email}</div></div><a href="#${homeFor(u)}">${ic('home')}${label}</a><button data-act="signOut">${ic('log-out')}Sign out</button></div></div>`;
}
function headerHTML(path, u) {
  const cur = n => isAct(path, n.p) ? raw('aria-current="page"') : '';
  const item = n => n.dd
    ? h`<li class="has-dd"><a class="nl" href="#${n.p}" ${cur(n)}>${n.l}</a><button class="dd-btn" data-act="toggleDD" aria-expanded="false" aria-label="Open ${n.l} menu">${ic('chevron-down')}</button><div class="dd">${ddContent(n.dd)}</div></li>`
    : h`<li><a class="nl" href="#${n.p}" ${cur(n)}>${n.l}</a></li>`;
  const ditem = n => n.dd
    ? h`<li><div class="dr-row"><a class="nl" href="#${n.p}" ${cur(n)}>${n.l}</a><button class="dd-btn" data-act="toggleSub" aria-expanded="false" aria-label="Show ${n.l} links">${ic('chevron-down')}</button></div><div class="sub">${ddContent(n.dd, true)}</div></li>`
    : h`<li><a class="nl" href="#${n.p}" ${cur(n)}>${n.l}</a></li>`;
  return h`<header class="hdr" id="hdr">
  <div class="topbar topbar-wrap"><div class="wrap"><span class="tb-msg row" style="gap:8px">${ic('heart')}${SITE.tagline}</span>
    <div class="tb-links"><a href="tel:${SITE.phoneHref}">${ic('phone')}${SITE.phone}</a><a href="mailto:${SITE.email}">${ic('mail')}${SITE.email}</a><span>${ic('clock')}${SITE.hours}</span></div></div></div>
  <div class="wrap navbar"><a class="logo" href="#/" aria-label="Ma3an Education Academies – home"><img src="${IMG.logo_nav}" alt="Ma3an Education Academies – Together" width="137" height="60"></a>
    <nav class="nav" aria-label="Main"><ul>${NAV.map(item)}</ul></nav>
    <div class="nav-cta desk">${authButtons(u)}</div>
    <button class="burger" data-act="toggleDrawer" aria-expanded="false" aria-controls="drawer" aria-label="Open menu">${ic('menu')}</button></div>
  <div class="drawer" id="drawer"><nav aria-label="Mobile main"><ul>${NAV.map(ditem)}</ul></nav><div class="d-cta">${authButtons(u, true)}</div></div>
</header>`;
}
function footerHTML() {
  const soc = Object.entries(SITE.social).filter(([, v]) => v);
  return h`<footer class="ftr"><div class="wrap cols">
  <div><a class="logo" href="#/"><img src="${IMG.logo_nav}" alt="Ma3an Education Academies"></a><p class="desc">High-quality online tuition and academic support for Primary to A-Level across the UK. Together, we learn, grow and succeed.</p>
    ${soc.length ? h`<div class="socials">${soc.map(([k, v]) => h`<a href="${v}" target="_blank" rel="noopener noreferrer" aria-label="MEA on ${cap(k)}">${ic(k)}</a>`)}</div>` : ''}</div>
  <div><h4>Explore</h4><ul><li><a href="#/about">About MEA</a></li><li><a href="#/courses">Courses &amp; Subjects</a></li><li><a href="#/timetables-fees">Timetable</a></li><li><a href="#/student-success">Student Success</a></li></ul></div>
  <div><h4>Parents</h4><ul><li><a href="#/resources">Resources</a></li><li><a href="#/faqs">FAQs</a></li><li><a href="#/account/create">Create Account</a></li><li><a href="#/account/sign-in">Sign In</a></li></ul></div>
  <div><h4>Contact &amp; legal</h4>
    <div class="cline">${ic('phone')}<a href="tel:${SITE.phoneHref}">${SITE.phone}</a></div><div class="cline">${ic('mail')}<a href="mailto:${SITE.email}">${SITE.email}</a></div>
    <div class="cline">${ic('clock')}<span>${SITE.hours}</span></div><div class="cline">${ic('globe')}<span>Online across the UK</span></div>
    <ul><li><a href="#/privacy">Privacy Policy</a></li><li><a href="#/terms">Terms &amp; Conditions</a></li><li><a href="#/cookies">Cookies Policy</a></li><li><a href="#/safeguarding">Safeguarding</a></li></ul></div>
  </div>
  <div class="bar"><div class="wrap"><span>© ${new Date().getFullYear()} ${SITE.name}. All rights reserved.</span>${SITE.previewBuild ? h`<span>Preview build with sample content · <button data-act="resetDemo">Reset demo data</button></span>` : ''}</div></div></footer>`;
}
function shellPublic(out, u, path) {
  return h`<a class="skip" href="#main" data-act="skipMain">Skip to main content</a>${headerHTML(path, u)}<main id="main" tabindex="-1">${out.body}</main>${out.nofooter ? '' : footerHTML()}`;
}

/* ---------- parent portal ---------- */
const PNAV = [['/my-mea', 'Dashboard', 'home'], ['/my-mea/children', 'My Children', 'users'], ['/my-mea/courses', 'My Courses', 'book-open'], ['/my-mea/timetable', 'Timetable', 'calendar'], ['/my-mea/learning', 'Learning Hub', 'folder'], ['/my-mea/homework', 'Homework', 'pencil'], ['/my-mea/progress', 'Progress', 'bar-chart'], ['/my-mea/payments', 'Payments', 'credit-card'], ['/my-mea/messages', 'Messages', 'message-square'], ['/my-mea/settings', 'Account Settings', 'settings']];
const TNAV = [['/teacher', 'Dashboard', 'home'], ['/teacher/classes', 'My Classes', 'calendar'], ['/teacher/timetable', 'Timetable', 'clock'], ['/teacher/students', 'Students', 'users'], ['/teacher/resources', 'Teaching Resources', 'folder'], ['/teacher/assignments', 'Assignments', 'clipboard-list'], ['/teacher/attendance', 'Attendance', 'check-square'], ['/teacher/messages', 'Messages', 'message-square'], ['/teacher/announcements', 'Announcements', 'megaphone'], ['/teacher/settings', 'Profile & Settings', 'settings']];
const ANAV = [['/admin', 'Dashboard', 'home'], ['/admin/enrolments', 'Enrolments', 'check-square'], ['/admin/classes', 'Classes', 'calendar'], ['/admin/courses', 'Courses', 'book-open'], ['/admin/families', 'Parents & Children', 'users'], ['/admin/invoices', 'Invoices & Payments', 'credit-card'], ['/admin/resources', 'Learning Resources', 'folder'], ['/admin/announcements', 'Announcements', 'megaphone'], ['/admin/content', 'Content', 'file-text'], ['/admin/support', 'Support Queue', 'headset'], ['/admin/reports', 'Reports & Export', 'bar-chart'], ['/admin/setup', 'Setup & Integrations', 'key']];
function sidebar(nav, path, u, tag, badges = {}) {
  const on = (p) => p === nav[0][0] ? path === p : isAct(path, p);
  return h`<aside class="side" id="side" aria-label="${tag} navigation"><a class="brand" href="#${nav[0][0]}" aria-label="MEA – ${nav[0][1]}"><img src="${IMG.logo_side}" alt="Ma3an Education Academies"></a><div class="tag">${tag}</div>
  <nav><ul style="display:contents">${nav.map(([p, l, i]) => h`<li style="display:contents"><a href="#${p}" ${on(p) ? raw('aria-current="page"') : ''}>${ic(i)}<span>${l}</span>${badges[p] ? h`<span class="bd">${badges[p]}</span>` : ''}</a></li>`)}</ul></nav>
  <div class="out"><button data-act="signOut">${ic('log-out')}Sign Out</button></div></aside><div class="scrim" id="scrim" data-act="toggleSide"></div>`;
}
function topbar(out, u, kind) {
  const nn = kind === 'parent' ? unreadNotifs(u.id) : 0, mm = unreadThreads(u);
  const msgP = kind === 'parent' ? '/my-mea/messages' : kind === 'teacher' ? '/teacher/messages' : '/admin/support';
  return h`<header class="tb"><button class="ibtn burger" data-act="toggleSide" aria-expanded="false" aria-label="Open navigation menu">${ic('menu')}</button>
  <div class="ptitle"><h1 id="main-h">${out.picon ? ic(out.picon) : ''}${out.ptitle}</h1>${out.psub ? h`<p>${out.psub}</p>` : ''}</div>
  ${kind === 'parent' ? h`<a class="ibtn" href="#/my-mea/notifications" aria-label="Notifications${nn ? ', ' + nn + ' unread' : ''}">${ic('bell')}${nn ? h`<span class="b">${nn}</span>` : ''}</a>` : ''}
  <a class="ibtn" href="#${msgP}" aria-label="Messages${mm ? ', ' + mm + ' unread' : ''}">${ic('mail')}${mm ? h`<span class="b">${mm}</span>` : ''}</a>
  ${kind === 'parent' ? h`<a class="ibtn" href="#/my-mea/support" aria-label="Help and support">${ic('help-circle')}</a>` : ''}
  <div class="menu"><button class="who-btn" data-act="toggleMenu" aria-haspopup="true" aria-expanded="false">${avatar(u.name, 0)}<span class="nm"><small>${kind === 'parent' ? 'Welcome,' : cap(kind)}</small><b>${u.name}</b></span>${ic('chevron-down')}</button>
  <div class="menu-pop">${kind === 'parent' ? h`<a href="#/my-mea/settings">${ic('settings')}Account Settings</a><a href="#/my-mea/support">${ic('help-circle')}Help &amp; Support</a>` : h`<a href="#/">${ic('globe')}View public website</a>`}<button data-act="signOut">${ic('log-out')}Sign out</button></div></div></header>`;
}
function shellApp(out, u, path, kind) {
  const nav = kind === 'parent' ? PNAV : kind === 'teacher' ? TNAV : ANAV;
  const tag = kind === 'parent' ? 'My MEA' : kind === 'teacher' ? 'Teacher Portal' : 'Admin Portal';
  const badges = {};
  if (kind === 'parent') { const m = unreadThreads(u); if (m) badges['/my-mea/messages'] = m; }
  if (kind === 'admin') { const p = S.enrolments.filter(e => ['Pending Confirmation', 'Waitlisted'].includes(e.status) && e.status === 'Pending Confirmation').length; if (p) badges['/admin/enrolments'] = p; const q = S.enquiries.filter(e => e.status === 'New').length; if (q) badges['/admin/support'] = q; }
  return h`<a class="skip" href="#main" data-act="skipMain">Skip to main content</a><div class="app ${kind !== 'parent' ? 'staff' : ''}">${sidebar(nav, path, u, tag, badges)}<div class="main">${topbar(out, u, kind)}<main class="content" id="main" tabindex="-1">${out.body}</main>
  <div class="pfoot"><span>© ${new Date().getFullYear()} ${SITE.name} (MEA). All rights reserved.</span><span><a href="#/privacy">Privacy Policy</a> &nbsp;|&nbsp; <a href="#/terms">Terms &amp; Conditions</a> &nbsp;|&nbsp; <a href="#/safeguarding">Safeguarding</a></span></div></div></div>`;
}
const SHELLS = { public: shellPublic, parent: (o, u, p) => shellApp(o, u, p, 'parent'), teacher: (o, u, p) => shellApp(o, u, p, 'teacher'), admin: (o, u, p) => shellApp(o, u, p, 'admin') };

/* ---------- render ---------- */
let lastPath = null;
let lastAfterKey = null;
function notFoundView() {
  return { title: 'Page not found', shell: 'public', body: h`<section class="sec"><div class="wrap center"><div class="ico c-pink lg" style="margin:0 auto 16px">${ic('search')}</div><h1>We couldn’t find that page</h1><p class="muted">The link may be out of date. Try one of these instead.</p><div class="row" style="justify-content:center">${btn('Go to homepage', '/', 'btn-primary')}${btn('Find a Course', '/courses', 'btn-outline')}${btn('Contact MEA', '/contact', 'btn-outline')}</div></div></section>` };
}
function render(opts = {}) {
  const { path, q } = parseHash(); Q = q;
  let r = null, params = {};
  for (const rt of Routes) { const m = path.match(rt.re); if (m) { r = rt; rt.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); }); break; } }
  const u = me();
  if (r && r.opt.role) {
    if (!u) { go('/account/sign-in' + qs({ return: path + qs(q) }), true); return; }
    if (!r.opt.role.includes(u.role)) { go(homeFor(u), true); return; }
  }
  let out;
  try { out = r ? r.fn(params, q, u) : notFoundView(); }
  catch (e) { console.error(e); out = { title: 'Something went wrong', shell: 'public', body: h`<section class="sec"><div class="wrap"><h1>Something went wrong</h1><p class="muted">Please refresh the page. If the problem continues, contact MEA support.</p><pre class="small">${e.message}</pre></div></section>` }; }
  if (out.redirect) { go(out.redirect, true); return; }
  const act = document.activeElement, keepId = act && act.id && act.matches('input,textarea,select') ? act.id : null, selStart = keepId && act.selectionStart != null ? act.selectionStart : null;
  const sy = window.scrollY;
  $('#app').innerHTML = val((SHELLS[out.shell || 'public'])(out, u, path));
  document.title = (out.title ? out.title + ' | ' : '') + 'Ma3an Education Academies (MEA)';
  const changed = path !== lastPath; lastPath = path;
  if (changed || !opts.keepScroll) {
    if (q.at && $('#' + q.at)) { setTimeout(() => $('#' + q.at).scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); }
    else { window.scrollTo(0, 0); }
    if (changed) { const m = $('#main'); if (m) m.focus({ preventScroll: true }); }
  } else window.scrollTo(0, sy);
  if (keepId) { const el = document.getElementById(keepId); if (el) { el.focus({ preventScroll: true }); try { if (selStart != null) el.setSelectionRange(selStart, selStart); } catch (e) { } } }
  onScroll();
  // Route "after" hooks (used to kick off live-data fetches) should run once per
  // navigation to a given address, not on every re-render — including the very
  // re-render that a live-data fetch itself triggers once it resolves. Without this
  // guard, a fetch-then-render hook re-fires itself forever. Compares the full
  // hash (path + query), since some routes change meaningfully by query alone
  // (e.g. ?class=, ?tab=) without the path itself changing.
  if (out.after) { const key = location.hash; if (key !== lastAfterKey) { lastAfterKey = key; out.after(); } }
}
function onScroll() { const hd = $('#hdr'); if (hd) hd.classList.toggle('scrolled', window.scrollY > 40); }

/* ---------- global events ---------- */
function closePops(except) {
  $$('.menu-pop.open').forEach(x => { if (x !== except) { x.classList.remove('open'); const b = x.previousElementSibling; if (b) b.setAttribute('aria-expanded', 'false'); } });
  $$('.dd.open').forEach(x => { if (x !== except) { x.classList.remove('open'); const b = x.previousElementSibling; if (b) b.setAttribute('aria-expanded', 'false'); } });
}
Actions.toggleMenu = t => { const p = t.nextElementSibling, o = !p.classList.contains('open'); closePops(p); p.classList.toggle('open', o); t.setAttribute('aria-expanded', o); };
Actions.toggleDD = t => { const p = t.nextElementSibling, o = !p.classList.contains('open'); closePops(p); p.classList.toggle('open', o); t.setAttribute('aria-expanded', o); };
Actions.toggleSub = t => { const p = t.closest('li').querySelector('.sub'), o = !p.classList.contains('open'); p.classList.toggle('open', o); t.setAttribute('aria-expanded', o); };
Actions.toggleDrawer = t => { const d = $('#drawer'), o = !d.classList.contains('open'); d.classList.toggle('open', o); t.setAttribute('aria-expanded', o); t.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); };
Actions.toggleSide = () => { const s = $('#side'), o = !s.classList.contains('open'); s.classList.toggle('open', o); $('#scrim').classList.toggle('open', o); const b = $('.tb .burger'); if (b) b.setAttribute('aria-expanded', o); };
Actions.skipMain = (t, e) => { e.preventDefault(); const m = $('#main'); if (m) m.focus(); };
Actions.closeModal = () => closeModal();
Actions.signOut = () => { if (LIVE_BACKEND) api('logout', { method: 'POST' }); S.session = null; save(); toast('You have been signed out.'); go('/account/sign-in', true); };
Actions.resetDemo = () => { resetStore(); toast('Demo data reset.'); go('/', true); };
Actions.acc = t => { const a = document.getElementById(t.getAttribute('aria-controls')), o = t.getAttribute('aria-expanded') !== 'true'; t.setAttribute('aria-expanded', o); a.hidden = !o; };
Actions.toggleFilters = t => { const b = $('#fbody'), o = !b.classList.contains('open'); b.classList.toggle('open', o); t.setAttribute('aria-expanded', o); };

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (!e.target.closest('.menu') && !e.target.closest('.has-dd')) closePops();
  if (t && Actions[t.dataset.act]) Actions[t.dataset.act](t, e);
  const a = e.target.closest('a[href^="#/"]');
  if (a) { const d = $('#drawer'); if (d) d.classList.remove('open'); const s = $('#side'); if (s) { s.classList.remove('open'); $('#scrim').classList.remove('open'); } closePops(); }
});
document.addEventListener('submit', e => { const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault(); const fn = Forms[f.dataset.form]; if (fn) fn(f, formVals(f), e); });
function onChange(e) {
  const el = e.target.closest('[data-on]'); if (!el) return; const isText = el.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]),textarea');
  if ((e.type === 'input') !== isText) return;
  const fn = Changes[el.dataset.on]; if (fn) fn(el, e);
}
document.addEventListener('input', onChange); document.addEventListener('change', onChange);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePops(); const d = $('#drawer'); if (d) d.classList.remove('open'); } });
window.addEventListener('hashchange', () => render());
window.addEventListener('scroll', onScroll, { passive: true });
