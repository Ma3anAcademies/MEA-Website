'use strict';
/* =====================================================================
   MEA – bridge to the site's own backend (Netlify Functions + Blobs).
   No third-party account needed: this talks only to /api/* on this same
   site. If those functions aren't running (e.g. a plain static preview),
   every call below fails safely and the site carries on in demo mode
   exactly as before — nothing here can break the page.
   ===================================================================== */
let LIVE_BACKEND = false;
let EMAIL_CONFIGURED = false;
let PAYMENTS_CONFIGURED = false;

async function api(path, opts = {}) {
  try {
    const res = await fetch('/api/' + path, {
      method: opts.method || 'GET',
      credentials: 'same-origin',
      headers: opts.body ? { 'Content-Type': 'application/json' } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    let data = null; try { data = await res.json(); } catch (e) { }
    return { ok: res.ok, status: res.status, data: data || {} };
  } catch (e) { return { ok: false, status: 0, data: {}, offline: true }; }
}

/** Called once at boot. Cheap GET that also tells us whether the backend exists at all. */
async function detectBackend() {
  const r = await api('session');
  LIVE_BACKEND = r.ok || r.status === 401;
  EMAIL_CONFIGURED = !!(r.data && r.data.emailConfigured);
  PAYMENTS_CONFIGURED = !!(r.data && r.data.paymentsConfigured);
  return { connected: LIVE_BACKEND, user: r.data && r.data.user };
}

/** Mirrors a real account into the local S.users/S.session so the rest of the
    already-built app (which reads S.users synchronously) keeps working
    unchanged, while the password check and persistence are genuinely real. */
function mirrorSignedInUser(u) {
  let local = S.users.find(x => x.id === u.id);
  const extra = u.role === 'teacher' ? { subjects: u.subjects || '', levels: u.levels || '', boards: u.boards || '', qual: u.qual || '', bio: u.bio || '', publish: !!u.publish } : {};
  if (!local) { local = { id: u.id, role: u.role, name: u.name, email: u.email || '', phone: u.phone || '', verified: true, notify: { email: true, messages: true, reminders: true, announcements: true }, created: todayISO(), live: true, ...extra }; S.users.push(local); }
  else Object.assign(local, { name: u.name, email: u.email || local.email, phone: u.phone || local.phone, live: true, ...extra });
  S.session = local.id; save();
  return local;
}
async function mirrorChildrenFromServer(parentId) {
  const r = await api('children');
  if (!r.ok) return;
  const serverIds = new Set((r.data.children || []).map(c => c.id));
  S.children = S.children.filter(c => c.parentId !== parentId || !c.live || serverIds.has(c.id));
  (r.data.children || []).forEach(c => {
    let local = S.children.find(x => x.id === c.id);
    const row = { id: c.id, parentId, first: c.first, last: c.last, sys: c.sys, stage: c.stage, dob: c.dob || '', school: c.school || '', status: c.status || 'Active', live: true };
    if (local) Object.assign(local, row); else S.children.push(row);
  });
  save();
}

/** Merges server records into a local array without disturbing demo/local-only rows
    (used for things that stay shared with the rich preview data, like enrolments). */
function mergeLive(localArray, serverItems, mapRow) {
  const keep = new Set(serverItems.map(x => x.id));
  const filtered = localArray.filter(x => !x.live || keep.has(x.id));
  serverItems.forEach(item => {
    const row = mapRow(item);
    const idx = filtered.findIndex(x => x.id === row.id);
    if (idx >= 0) Object.assign(filtered[idx], row); else filtered.push(row);
  });
  return filtered;
}

/** The shared course/class catalog. Runs for every visitor once a backend is connected,
    logged in or not, since the public Course Finder needs the real catalog too. The very
    first time an admin visits a freshly-connected (empty) backend, this seeds it from the
    existing demo catalog, keeping the same ids, so all the existing demo homework, resources
    and messages (still local for now) keep matching up correctly. */
async function syncCatalog(user) {
  let [co, cl] = await Promise.all([api('courses'), api('classes')]);
  if (!co.ok || !cl.ok) return;
  if (!co.data.courses.length && !cl.data.classes.length && user && user.role === 'admin') {
    // Courses first (classes reference them), each stage run in parallel rather than
    // one-by-one — this is what keeps a first admin sign-in from taking several
    // seconds while ~90 sample rows get created.
    await Promise.all(S.courses.map(c => api('courses', { method: 'POST', body: c })));
    await Promise.all(S.classes.map(c => api('classes', { method: 'POST', body: c })));
    [co, cl] = await Promise.all([api('courses'), api('classes')]);
  }
  if (co.data.courses.length) S.courses = co.data.courses.map(c => ({ ...c, live: true }));
  if (cl.data.classes.length) S.classes = cl.data.classes.map(c => ({ ...c, live: true }));
  // Real teachers are public data too: a class's assigned teacher is shown on public
  // course pages and to any signed-in family, not just admin, so every visitor needs
  // to know about them — not only the admin session that manages them.
  const t = await api('teachers');
  if (t.ok) S.users = mergeAdditive(S.users, t.data.teachers, x => ({ id: x.id, role: 'teacher', name: x.name, email: x.email || '', subjects: x.subjects || '', levels: x.levels || '', boards: x.boards || '', qual: x.qual || '', bio: x.bio || '', publish: !!x.publish, notify: { email: true, messages: true, reminders: true, announcements: true }, created: new Date(x.createdAt || Date.now()).toISOString().slice(0, 10), live: true }));
  save();
}

/** Real enrolment requests, merged alongside the existing demo/preview ones. */
async function mirrorEnrolments(user) {
  const r = await api('enrolments');
  if (!r.ok) return;
  S.enrolments = mergeLive(S.enrolments, r.data.enrolments, e => ({ id: e.id, childId: e.childId, classId: e.classId, status: e.status, created: new Date(e.created).toISOString().slice(0, 10), live: true }));
  save();
}

/** Real contact-form / support-request enquiries — admin only. */
async function mirrorEnquiries(user) {
  if (!user || user.role !== 'admin') return;
  const r = await api('contact');
  if (!r.ok) return;
  S.enquiries = mergeLive(S.enquiries, r.data.enquiries, q => ({ id: q.id, ref: q.ref, date: new Date(q.createdAt).toISOString().slice(0, 10), name: q.name, email: q.email, phone: q.phone, role: q.role, topic: q.topic, team: q.team, message: q.message, status: q.status, portal: q.portal, live: true }));
  save();
}

/** Adds/updates from the server without ever removing existing rows — used for S.users,
    where over-pruning is dangerous (it must never remove the admin's own signed-in record,
    which the parents-only directory list doesn't include). */
function mergeAdditive(localArray, serverItems, mapRow) {
  const out = [...localArray];
  serverItems.forEach(item => {
    const row = mapRow(item);
    const idx = out.findIndex(x => x.id === row.id);
    if (idx >= 0) Object.assign(out[idx], row); else out.push(row);
  });
  return out;
}

/** Admin only: every real parent and child, across every family — needed so the
    Enrolments, Families and Support Queue screens can show real names, not gaps.
    Each parent is mirrored the same shape a signed-in session uses, but without a
    password, so admin can see them without ever being able to sign in as them. */
async function mirrorDirectory(user) {
  if (!user || user.role !== 'admin') return;
  const r = await api('admin-directory');
  if (!r.ok) return;
  S.users = mergeAdditive(S.users, r.data.parents, p => ({ id: p.id, role: 'parent', name: p.name, email: p.email || '', phone: p.phone || '', verified: true, notify: { email: true, messages: true, reminders: true, announcements: true }, created: new Date(p.createdAt || Date.now()).toISOString().slice(0, 10), live: true }));
  S.users = mergeAdditive(S.users, r.data.teachers || [], t => ({ id: t.id, role: 'teacher', name: t.name, email: t.email || '', subjects: t.subjects || '', levels: t.levels || '', boards: t.boards || '', qual: t.qual || '', bio: t.bio || '', publish: !!t.publish, notify: { email: true, messages: true, reminders: true, announcements: true }, created: new Date(t.createdAt || Date.now()).toISOString().slice(0, 10), live: true }));
  S.children = mergeLive(S.children, r.data.children, c => ({ id: c.id, parentId: c.parentId, first: c.first, last: c.last, sys: c.sys, stage: c.stage, dob: c.dob || '', school: c.school || '', status: c.status || 'Active', live: true }));
  save();
}

/** Re-fetches something and re-renders once it resolves — but only if the person
    hasn't since navigated elsewhere, and never mid-typing (see the boot-time comment
    for why). Used for anything scoped to a specific class/thread/child, which can't
    be fetched once at login the way the catalog and enrolments are. */
function liveRefresh(promise) {
  const hashAtCall = location.hash;
  promise.then(() => {
    if (location.hash !== hashAtCall) return;
    const active = document.activeElement;
    if (!active || !/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) render({ keepScroll: true });
  });
}

async function mirrorHomeworkForClass(classId) {
  const r = await api('homework?classId=' + encodeURIComponent(classId));
  if (!r.ok) return;
  S.homework = mergeLive(S.homework, r.data.homework, x => ({ id: x.id, classId: x.classId, week: 0, title: x.title, desc: x.description, assigned: new Date(x.createdAt).toISOString().slice(0, 10), due: x.dueDate, resourceId: '', live: true }));
  save();
}
async function mirrorResourcesForClass(classId) {
  const r = await api('resources?classId=' + encodeURIComponent(classId));
  if (!r.ok) return;
  const cl = classById(classId), co = cl && clsCourse(cl);
  S.resources = mergeLive(S.resources, r.data.resources, x => ({ id: x.id, classId: x.classId, week: x.week || 1, topic: co ? co.topics[((x.week || 1) - 1) % co.topics.length] : '', title: x.title, type: x.type, date: new Date(x.createdAt).toISOString().slice(0, 10), link: x.url, live: true }));
  save();
}
/** Teacher-side: the real students actually enrolled in their own classes. */
async function mirrorMyStudents() {
  const r = await api('children');
  if (!r.ok) return;
  S.children = mergeAdditive(S.children, r.data.children, c => ({ id: c.id, parentId: c.parentId || '', first: c.first, last: c.last, sys: c.sys, stage: c.stage, status: c.status || 'Active', live: true }));
  save();
}
async function mirrorMySubmissions() {
  const r = await api('submissions');
  if (!r.ok) return;
  S.submissions = mergeLive(S.submissions, r.data.submissions, x => ({ id: x.homeworkId + ':' + x.childId, hwId: x.homeworkId, childId: x.childId, fileName: x.fileName, fileUrl: x.fileUrl || '', submittedAt: new Date(x.submittedAt).toISOString().slice(0, 16).replace('T', 'T'), score: x.score, max: x.maxScore, feedback: x.feedback, markedAt: x.markedAt ? new Date(x.markedAt).toISOString().slice(0, 10) : null, live: true }));
  save();
}
/** Every active class's homework, for a parent — run once at sign-in (not just when the
    Learning Hub happens to be visited first), so a deep link straight to a specific
    homework item (e.g. from a notification) doesn't 404 before the data has arrived. */
async function mirrorAllMyHomework(parentId) {
  const ids = [...new Set(S.enrolments.filter(e => e.status === 'Active' && childById(e.childId) && childById(e.childId).parentId === parentId).map(e => e.classId).filter(id => { const cl = classById(id); return cl && cl.live; }))];
  await Promise.all(ids.map(id => mirrorHomeworkForClass(id)));
  await mirrorMySubmissions();
}
/** Teacher-side: submissions for one piece of homework, for marking. */
async function mirrorSubmissionsForHomework(classId, homeworkId) {
  const r = await api(`submissions?classId=${encodeURIComponent(classId)}&homeworkId=${encodeURIComponent(homeworkId)}`);
  if (!r.ok) return;
  S.submissions = mergeLive(S.submissions, r.data.submissions, x => ({ id: x.homeworkId + ':' + x.childId, hwId: x.homeworkId, childId: x.childId, fileName: x.fileName, fileUrl: x.fileUrl || '', submittedAt: new Date(x.submittedAt).toISOString().slice(0, 16), score: x.score, max: x.maxScore, feedback: x.feedback, markedAt: x.markedAt ? new Date(x.markedAt).toISOString().slice(0, 10) : null, live: true }));
  save();
}
async function mirrorMyThreads(user) {
  const r = await api('messages');
  if (!r.ok) return;
  S.threads = mergeLive(S.threads, r.data.threads, t => ({ id: t.id, parentId: t.parentId, staffId: t.staffId, subject: t.subject, childId: t.childId, classId: t.classId, unreadParent: t.unreadParent, unreadStaff: t.unreadStaff, messages: (S.threads.find(x => x.id === t.id) || {}).messages || [], live: true }));
  save();
}
async function mirrorThreadMessages(threadId) {
  const r = await api('messages?thread=' + encodeURIComponent(threadId));
  if (!r.ok) return;
  const th = S.threads.find(x => x.id === threadId);
  if (th) { th.unreadParent = r.data.thread.unreadParent; th.unreadStaff = r.data.thread.unreadStaff; th.messages = r.data.messages.map(m => ({ from: m.from, text: m.body, at: new Date(m.at).toISOString().slice(0, 16) })); }
  save();
}
const mapInvoice = x => ({ id: x.id, parentId: x.parentId, period: x.period, issued: x.issuedDate, due: x.dueDate, status: x.status, paidOn: x.paidOn, discountPct: x.discountPct, lines: (x.lines || []).map(l => ({ child: l.child, desc: l.desc, amt: l.amount })), live: true });
/** Reads a real <input type=file>'s chosen file and uploads it through whichever
    storage provider admin has active (Netlify by default, or Drive/OneDrive/GitHub
    once connected in Admin → Setup & Integrations) — the caller never needs to know
    which one is active. */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function uploadRealFile(file) {
  if (!file) return { ok: false, error: 'Choose a file first.' };
  if (file.size > 15 * 1024 * 1024) return { ok: false, error: 'That file is too large (15MB limit).' };
  const base64 = await readFileAsBase64(file);
  return api('upload', { method: 'POST', body: { filename: file.name, mime: file.type, base64 } });
}

async function mirrorMyInvoices() {
  const r = await api('invoices');
  if (!r.ok) return;
  S.invoices = mergeLive(S.invoices, r.data.invoices, mapInvoice);
  save();
}
async function mirrorAllInvoices(user) {
  if (!user || user.role !== 'admin') return;
  const r = await api('invoices');
  if (!r.ok) return;
  S.invoices = mergeLive(S.invoices, r.data.invoices, mapInvoice);
  save();
}

async function mirrorAttendanceForChild() {
  const r = await api('attendance');
  if (!r.ok) return;
  S.attendance = S.attendance.filter(a => !a.live).concat(r.data.attendance.map(x => ({ classId: x.classId, date: x.date, childId: x.childId, status: x.status, live: true })));
  save();
}
/** Parent-side: every assessment score recorded for their own children. */
async function mirrorMyAssessments() {
  const r = await api('assessments');
  if (!r.ok) return;
  S.assessments = mergeLive(S.assessments, r.data.assessments, x => ({ id: x.id, childId: x.childId, classId: x.classId, title: x.title, date: x.date, score: x.score, max: x.maxScore, comment: x.comment || '', live: true }));
  save();
}
/** Teacher-side: assessment scores they've recorded for one student (for the class Students tab). */
async function mirrorAssessmentsForChild(childId) {
  const r = await api('assessments?childId=' + encodeURIComponent(childId));
  if (!r.ok) return;
  S.assessments = mergeLive(S.assessments, r.data.assessments, x => ({ id: x.id, childId: x.childId, classId: x.classId, title: x.title, date: x.date, score: x.score, max: x.maxScore, comment: x.comment || '', live: true }));
  save();
}
async function mirrorAttendanceForSession(classId, date) {
  const r = await api(`attendance?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(date)}`);
  if (!r.ok) return;
  S.attendance = S.attendance.filter(a => !(a.classId === classId && a.date === date && a.live)).concat(r.data.attendance.map(x => ({ classId: x.classId, date: x.date, childId: x.childId, status: x.status, live: true })));
  save();
}
