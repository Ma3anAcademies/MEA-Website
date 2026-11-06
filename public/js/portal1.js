'use strict';
/* =====================================================================
   MEA – parent portal (My MEA), part 1
   ===================================================================== */
const PR = { role: ['parent'] };
const myKids = u => childrenOf(u.id);
const kidIdx = k => childrenOf(k.parentId).findIndex(x => x.id === k.id);
function kidSel(u, allowAll) { const ks = myKids(u), v = UI.kid; if (allowAll && v === 'all') return 'all'; if (v && ks.find(k => k.id === v)) return v; return allowAll ? 'all' : (ks[0] ? ks[0].id : null); }
function kidPicker(u, allowAll) {
  const sel = kidSel(u, allowAll), ks = myKids(u);
  return h`<div class="kidpick" role="group" aria-label="Select child">${allowAll ? h`<button type="button" data-act="pickKid" data-id="all" aria-pressed="${sel === 'all'}"><span class="avatar sm av-blue" aria-hidden="true">${ic('users')}</span><b>All children</b></button>` : ''}${ks.map((k, i) => h`<button type="button" data-act="pickKid" data-id="${k.id}" aria-pressed="${sel === k.id}">${avatar(k.first, i, 'sm')}<span><b>${k.first}</b><small>${k.stage}</small></span></button>`)}</div>`;
}
Actions.pickKid = t => { UI.kid = t.dataset.id; render({ keepScroll: true }); };
const liveStatuses = ['Active', 'Pending Confirmation', 'Awaiting Payment', 'Waitlisted'];
const courseCount = k => enrolsOf(k.id, liveStatuses).length;
function familySessions(u, kidId, from, to) {
  const out = []; const now = ukNow();
  S.enrolments.filter(e => e.status === 'Active').forEach(e => {
    const k = childById(e.childId); if (!k || k.parentId !== u.id || (kidId && kidId !== 'all' && k.id !== kidId)) return;
    const cl = classById(e.classId); classSessions(cl, from, to).forEach(s => out.push({ s, k, cl, co: clsCourse(cl), e }));
  });
  return out.sort((a, b) => (a.s.date + a.s.start).localeCompare(b.s.date + b.s.start));
}
const isFuture = (s, now = ukNow()) => s.date > now.date || (s.date === now.date && toMin(s.end) > now.min);
const whenText = s => `${relDay(s.date)} · ${fmtRange(s.start, s.end)}`;
function sessLink(x) { return x.cl.meetingUrl ? h`<a class="btn btn-primary btn-sm" href="#/my-mea/timetable/session/${x.s.id}">Join class</a>` : h`<a class="btn btn-outline btn-sm" href="#/my-mea/timetable/session/${x.s.id}">View class</a>`; }
const svcIcon = sid => h`<span class="ico c-${grpOf(sid)}">${ic(subj(sid).icon)}</span>`;
const invoiceForEnrolment = e => S.invoices.find(i => i.status === 'Due' && (i.enrolmentIds || []).includes(e.id));
const payLink = e => { const inv = invoiceForEnrolment(e); return inv ? '/my-mea/payments/invoices/' + inv.id : '/my-mea/payments'; };

/* ---------------- Dashboard ---------------- */
R('/my-mea', (p, q, u) => {
  const ks = myKids(u), now = ukNow();
  const up = familySessions(u, 'all', now.date, isoAdd(now.date, 13)).filter(x => isFuture(x.s, now)).slice(0, 4);
  const cls = new Set(S.enrolments.filter(e => e.status === 'Active' && ks.some(k => k.id === e.childId)).map(e => e.classId));
  const latest = S.resources.filter(r => cls.has(r.classId)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const notes = myNotifs(u.id).slice(0, 3);
  const pending = S.enrolments.filter(e => e.status === 'Pending Confirmation' && ks.some(k => k.id === e.childId)).length;
  const due = S.invoices.find(i => i.parentId === u.id && i.status === 'Due');
  const hwPending = S.homework.filter(hw => cls.has(hw.classId)).flatMap(hw => S.enrolments.filter(e => e.classId === hw.classId && e.status === 'Active' && ks.some(k => k.id === e.childId)).map(e => ({ hw, k: childById(e.childId) }))).filter(x => ['To do', 'Due soon', 'Overdue'].includes(hwStatus(x.hw, x.k.id))).sort((a, b) => a.hw.due.localeCompare(b.hw.due)).slice(0, 3);
  if (!ks.length) return { title: 'Dashboard', shell: 'parent', ptitle: 'My MEA', psub: 'Dashboard', body: h`${emptyState({ icon: 'user-plus', title: `Welcome, ${u.name.split(' ')[0]}. Add your first child`, text: 'Add your child’s year and stage so we can show the classes that suit them.', action: btn('Add Your First Child', '/my-mea/children/add?first=1', 'btn-pink', 'plus') })}` };
  return {
    title: 'Dashboard', shell: 'parent', ptitle: 'My MEA', psub: 'Dashboard', body: h`
    <div class="kids"><div class="welcome"><h2>Welcome back, ${u.name.split(' ')[0]}!</h2><p class="muted mb0">Here’s what’s happening with your children today.</p></div>
      ${ks.map((k, i) => h`<div class="kid kc-${kidColor(i)}"><div class="top">${avatar(k.first, i)}<div><h3>${k.first}</h3><div class="yr">${k.stage}</div></div></div><div class="cnt">${plural(courseCount(k), 'course')}</div><div class="foot"><a class="btn btn-outline btn-sm btn-block" href="#/my-mea/children/${k.id}">View Profile</a></div></div>`)}
      <a class="kid-add" href="#/my-mea/children/add"><span class="ico">${ic('plus')}</span>Add Child</a></div>
    ${pending || due ? h`<div class="stack" style="margin-bottom:20px">${pending ? h`<div class="alert alert-warn">${ic('clock')}<span><strong>${plural(pending, 'enrolment')} awaiting confirmation.</strong> We’ll notify you as soon as your place is confirmed. <a href="#/my-mea/courses">View My Courses</a></span></div>` : ''}${due ? h`<div class="alert alert-info">${ic('credit-card')}<span><strong>${due.period} invoice due ${fmtDate(due.due, 'dmy')}.</strong> <a href="#/my-mea/payments">View Payments</a></span></div>` : ''}</div>` : ''}
    <div class="cols-2"><div class="stack">
      <section class="panel" aria-labelledby="d-up"><h2 id="d-up"><span class="l">${ic('calendar')}This week</span><a href="#/my-mea/timetable">View Full Timetable</a></h2>
        ${up.length ? h`<div class="list">${up.map(x => h`<div class="li">${svcIcon(x.co.subject)}<div class="grow"><div class="t">${x.co.title}</div><div class="s">${x.k.first} · ${x.k.stage}</div></div><div class="w"><strong>${relDay(x.s.date)}</strong><br>${fmtRange(x.s.start, x.s.end)}</div>${sessLink(x)}</div>`)}</div>` : emptyState({ icon: 'calendar', title: 'No classes coming up', text: 'Once your child is enrolled in an active class, it will appear here.', action: btn('Find a Course', '/my-mea/courses/find', 'btn-primary') })}</section>
      <section class="panel" aria-labelledby="d-lat"><h2 id="d-lat"><span class="l">${ic('folder')}Latest learning</span><a href="#/my-mea/learning">Open Learning Hub</a></h2>
        ${latest.length ? h`<div class="list">${latest.map(r => { const cl = classById(r.classId), co = clsCourse(cl); return h`<div class="li">${svcIcon(co.subject)}<div class="grow"><div class="t">${r.title}</div><div class="s">${co.title} · ${r.type}</div></div><div class="w">${ago(r.date)}</div><a class="btn btn-outline btn-sm" href="#/my-mea/learning/resource/${r.id}">Open</a></div>`; })}</div>` : raw('<p class="muted">New lesson resources will appear here.</p>')}</section>
      <section class="panel" aria-labelledby="d-qa"><h2 id="d-qa"><span class="l">${ic('zap')}Quick actions</span></h2><div class="qa"><a href="#/my-mea/children/add">${ic('user-plus')}Add Child</a><a href="#/my-mea/courses/find">${ic('search')}Find a Course</a><a href="#/my-mea/timetable">${ic('calendar')}My Timetable</a><a href="#/my-mea/learning">${ic('folder')}Learning Hub</a><a href="#/my-mea/support">${ic('help-circle')}Contact Support</a></div></section></div>
    <div class="stack">
      <section class="panel" aria-labelledby="d-nt"><h2 id="d-nt"><span class="l">${ic('bell')}Notifications</span><a href="#/my-mea/notifications">View All</a></h2>${notes.length ? h`<div class="list">${notes.map(n => h`<a class="li" href="#/my-mea/notifications" style="text-decoration:none;color:inherit"><div class="grow"><div class="t" style="font-weight:${n.read ? 500 : 700}">${n.text}</div><div class="s">${ago(n.date)}${n.read ? '' : ' · New'}</div></div></a>`)}</div>` : raw('<p class="muted">You’re all caught up.</p>')}</section>
      <section class="panel" aria-labelledby="d-hw"><h2 id="d-hw"><span class="l">${ic('pencil')}Homework to do</span><a href="#/my-mea/homework">View Homework</a></h2>${hwPending.length ? h`<div class="list">${hwPending.map(x => { const st = hwStatus(x.hw, x.k.id); return h`<a class="li" href="#/my-mea/homework/${x.hw.id}${qs({ child: x.k.id })}" style="text-decoration:none;color:inherit"><div class="grow"><div class="t">${x.hw.title}</div><div class="s">${x.k.first} · due ${fmtDate(x.hw.due)}</div></div>${statusChip(st)}</a>`; })}</div>` : raw('<p class="muted">No homework due right now.</p>')}</section></div></div>`
  };
}, PR);

/* ---------------- My Children ---------------- */
R('/my-mea/children', (p, q, u) => {
  const ks = myKids(u);
  return {
    title: 'My Children', shell: 'parent', ptitle: 'My Children', psub: 'Manage all your children in one place', body: h`
    <div class="panel row between" style="margin-bottom:20px;background:var(--blue-50)"><div><strong style="font-size:1.15rem;color:var(--blue-d)">One account. All your children.</strong><div class="muted">Manage each child’s courses, timetable and homework.</div></div>${btn('Add Child', '/my-mea/children/add', 'btn-pink', 'plus')}</div>
    ${ks.length ? h`<div class="grid g3">${ks.map((k, i) => h`<div class="kid kc-${kidColor(i)}"><div class="top">${avatar(k.first, i)}<div class="grow"><h3>${k.first}</h3><div class="yr">${k.stage}</div></div>${chip(k.status, 'chip-green', 'check-circle')}</div>
      <dl class="kv" style="margin:8px 0"><dt>Education system</dt><dd>${SYS[k.sys].short}</dd><dt>School year</dt><dd>${k.stage} (${levelName(levelOfStage(k.sys, k.stage))})</dd><dt>Courses</dt><dd>${courseCount(k)}</dd><dt>Upcoming classes</dt><dd>${familySessions(u, k.id, todayISO(), isoAdd(todayISO(), 7)).filter(x => isFuture(x.s)).length} this week</dd></dl>
      <div class="foot row"><a class="btn btn-outline btn-sm grow" href="#/my-mea/children/${k.id}">View Profile</a><a class="btn btn-ghost btn-sm" href="#/my-mea/courses/find${qs({ child: k.id })}">Find courses</a></div></div>`)}<a class="kid-add" href="#/my-mea/children/add"><span class="ico">${ic('plus')}</span>Add Another Child<span class="small muted" style="font-weight:400">Add a new child in a few steps.</span></a></div>` : emptyState({ icon: 'users', title: 'No children added yet', text: 'Add your child’s year and stage to see suitable classes.', action: btn('Add Your First Child', '/my-mea/children/add?first=1', 'btn-pink') })}
    <div class="panel row between" style="margin-top:22px;background:var(--yellow-50)"><div><strong>Need help?</strong><div class="muted">If you need help adding a child or linking to an existing course, contact our support team.</div></div>${btn('Contact Support', '/my-mea/support', 'btn-outline')}</div>`
  };
}, PR);

/* Add child stepper */
const AC_STEPS = ['Education system', 'Year / stage', 'Child details', 'Subject / exam board', 'Review'];
function acState() { return UI.ac || (UI.ac = { step: 1, sys: '', stage: '', first: '', last: '', dob: '', school: '', board: '', subject: '' }); }
R('/my-mea/children/add', (p, q, u) => {
  const a = acState(), first = q.first === '1' || !myKids(u).length;
  const st = a.step, l = a.sys ? SYS[a.sys] : null;
  const stepper = h`<ol class="stepper" aria-label="Progress">${AC_STEPS.map((s, i) => h`<li class="${i + 1 === st ? 'on' : i + 1 < st ? 'done' : ''}" ${i + 1 === st ? raw('aria-current="step"') : ''}><b>${i + 1 < st ? '✓' : i + 1}</b>${s}</li>`)}</ol>`;
  let body;
  if (st === 1) body = h`<h2>Which education system is your child in?</h2><div class="pick" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">${Object.values(SYS).map(s => h`<button type="button" data-act="acSys" data-sys="${s.id}" aria-pressed="${a.sys === s.id}">${s.name}<small>${s.blurb}</small></button>`)}</div>`;
  else if (st === 2) body = h`<h2>What is ${a.first || 'your child'}’s current school year?</h2>${l.levels.map(lv => h`<h3 class="small muted" style="margin:14px 0 8px">${lv.name} · ages ${lv.ages}</h3><div class="pick">${lv.years.map(y => h`<button type="button" data-act="acStage" data-stage="${y}" aria-pressed="${a.stage === y}">${y}</button>`)}</div>`)}`;
  else if (st === 3) body = h`<h2>Child details</h2><form data-form="acDetails" novalidate><div class="form-grid">${fld({ name: 'first', label: 'Child’s first name', req: 1, value: a.first })}${fld({ name: 'last', label: 'Surname', req: 1, value: a.last || u.name.split(' ').slice(-1)[0] })}${fld({ name: 'dob', label: 'Date of birth', type: 'date', value: a.dob, hint: 'Optional. Only add this if you are comfortable doing so.' })}${fld({ name: 'school', label: 'School name', value: a.school, hint: 'Optional.' })}</div><div class="row" style="margin-top:18px"><button class="btn btn-outline" type="button" data-act="acBack">Back</button><button class="btn btn-primary" type="submit">Next</button></div></form>`;
  else if (st === 4) { const lv = levelOfStage(a.sys, a.stage), subs = subjectsAt(a.sys, lv), boards = [...new Set(findClasses({ sys: a.sys, level: lv }).map(c => clsCourse(c).board).filter(Boolean))];
    body = h`<h2>Subjects and exam board (optional)</h2><p class="muted">This helps us show the most relevant classes. You can skip this step.</p><form data-form="acExtra" novalidate><div class="form-grid">${fld({ name: 'subject', label: 'Main subject of interest', type: 'select', ph: 'No preference', options: subs.map(s => [s.id, s.name]), value: a.subject })}${boards.length ? fld({ name: 'board', label: 'Exam board', type: 'select', ph: 'Not sure / not applicable', options: boards, value: a.board }) : ''}</div><div class="row" style="margin-top:18px"><button class="btn btn-outline" type="button" data-act="acBack">Back</button><button class="btn btn-primary" type="submit">Next</button></div></form>`; }
  else body = h`<h2>Review and save</h2><dl class="kv card"><dt>Name</dt><dd>${a.first} ${a.last}</dd><dt>Education system</dt><dd>${SYS[a.sys].name}</dd><dt>Year / stage</dt><dd>${a.stage} (${levelName(levelOfStage(a.sys, a.stage))})</dd>${a.dob ? h`<dt>Date of birth</dt><dd>${fmtDate(a.dob, 'dmy')}</dd>` : ''}${a.school ? h`<dt>School</dt><dd>${a.school}</dd>` : ''}${a.subject ? h`<dt>Subject of interest</dt><dd>${subj(a.subject).name}</dd>` : ''}${a.board ? h`<dt>Exam board</dt><dd>${a.board}</dd>` : ''}</dl><div class="row" style="margin-top:18px"><button class="btn btn-outline" data-act="acBack">Back</button><button class="btn btn-pink" data-act="acSave">Save Child</button></div>`;
  return { title: 'Add Child', shell: 'parent', ptitle: first ? 'Add your first child' : 'Add Child', psub: first ? 'Tell us about your child so we can show the right classes.' : 'Add a new child in a few steps.', body: h`<div class="panel" style="max-width:820px">${stepper}${body}</div>` };
}, PR);
Actions.acSys = t => { const a = acState(); if (a.sys !== t.dataset.sys) { a.stage = ''; a.board = ''; a.subject = ''; } a.sys = t.dataset.sys; a.step = 2; render(); };
Actions.acStage = t => { const a = acState(); a.stage = t.dataset.stage; a.step = 3; render(); };
Actions.acBack = () => { const a = acState(); a.step = Math.max(1, a.step - 1); render(); };
Forms.acDetails = (f, v) => { const e = {}; if (!v.first) e.first = 'Enter your child’s first name.'; if (!v.last) e.last = 'Enter your child’s surname.'; if (!showErrors(f, e)) return; Object.assign(acState(), { first: v.first, last: v.last, dob: v.dob, school: v.school, step: 4 }); render(); };
Forms.acExtra = (f, v) => { Object.assign(acState(), { subject: v.subject || '', board: v.board || '', step: 5 }); render(); };
Actions.acSave = async () => {
  const u = me(), a = acState();
  let id = uid('c'), live = false;
  if (LIVE_BACKEND && u.live) {
    const r = await api('children', { method: 'POST', body: { first: a.first, last: a.last, sys: a.sys, stage: a.stage, dob: a.dob, school: a.school } });
    if (r.ok) { id = r.data.child.id; live = true; } else { toast((r.data && r.data.error) || 'Could not save — please try again.'); return; }
  }
  S.children.push({ id, parentId: u.id, first: a.first, last: a.last, sys: a.sys, stage: a.stage, dob: a.dob, school: a.school, board: a.board, subject: a.subject, status: 'Active', live });
  UI.kid = id; UI.ac = null; save(); toast(`${a.first} has been added.`); go(`/my-mea/children/${id}?new=1`);
};

R('/my-mea/children/:id/edit', (p, q, u) => {
  const k = childById(p.id); if (!k || k.parentId !== u.id) return notFoundView();
  const l = SYS[k.sys];
  return { title: 'Edit ' + k.first, shell: 'parent', ptitle: 'Edit ' + k.first, psub: 'Update your child’s details', body: h`<div class="panel" style="max-width:720px"><form data-form="editChild" data-id="${k.id}" novalidate><div class="form-grid">${fld({ name: 'first', label: 'First name', req: 1, value: k.first })}${fld({ name: 'last', label: 'Surname', req: 1, value: k.last })}
    <div class="field"><span class="lbl">Education system</span><div class="inp" style="background:var(--bg-soft)">${l.name}</div></div>${fld({ name: 'stage', label: 'Year / stage', type: 'select', req: 1, value: k.stage, options: l.levels.flatMap(x => x.years) })}${fld({ name: 'dob', label: 'Date of birth', type: 'date', value: k.dob || '', hint: 'Optional.' })}${fld({ name: 'school', label: 'School name', value: k.school || '', hint: 'Optional.' })}</div>
    <div class="row" style="margin-top:18px"><button class="btn btn-primary" type="submit">Save changes</button><a class="btn btn-outline" href="#/my-mea/children/${k.id}">Cancel</a></div></form></div>` };
}, PR);
Forms.editChild = async (f, v) => {
  const k = childById(f.dataset.id), e = {}; if (!v.first) e.first = 'Enter a first name.'; if (!v.last) e.last = 'Enter a surname.'; if (!showErrors(f, e)) return;
  if (LIVE_BACKEND && k.live) {
    const r = await api('children', { method: 'PATCH', body: { id: k.id, first: v.first, last: v.last, stage: v.stage, dob: v.dob, school: v.school } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not save — please try again.'); return; }
  }
  Object.assign(k, { first: v.first, last: v.last, stage: v.stage, dob: v.dob, school: v.school }); save(); toast('Changes saved.'); go('/my-mea/children/' + k.id);
};
R('/my-mea/children/:id', (p, q, u) => {
  const k = childById(p.id); if (!k || k.parentId !== u.id) return notFoundView();
  const i = kidIdx(k), en = enrolsOf(k.id).filter(e => !['Withdrawn', 'Cancelled'].includes(e.status)), lv = levelOfStage(k.sys, k.stage);
  const rec = findClasses({ sys: k.sys, level: lv, subject: k.subject || '', board: k.board || '' }).filter(cl => !en.some(e => e.classId === cl.id)).slice(0, 3);
  UI.kid = k.id;
  return {
    title: k.first, shell: 'parent', ptitle: k.first, psub: `${k.stage} · ${SYS[k.sys].short}`, body: h`
    ${q.new ? h`<div class="alert alert-ok" style="margin-bottom:20px">${ic('check-circle')}<span><strong>${k.first} has been added.</strong> Next, find classes that suit ${k.first}’s year and subjects.</span><a class="btn btn-pink btn-sm" style="margin-left:auto" href="#/my-mea/courses/find${qs({ child: k.id })}">Find Available Courses</a></div>` : ''}
    <div class="cols-2b"><div class="panel"><h2><span class="l">${avatar(k.first, i)}Profile</span><a href="#/my-mea/children/${k.id}/edit">Edit</a></h2><dl class="kv"><dt>Name</dt><dd>${k.first} ${k.last}</dd><dt>Education system</dt><dd>${SYS[k.sys].name}</dd><dt>School year</dt><dd>${k.stage} (${levelName(lv)})</dd>${k.dob ? h`<dt>Date of birth</dt><dd>${fmtDate(k.dob, 'dmy')}</dd>` : ''}${k.school ? h`<dt>School</dt><dd>${k.school}</dd>` : ''}<dt>Status</dt><dd>${statusChip(k.status)}</dd></dl></div>
      <div class="panel"><h2><span class="l">${ic('book-open')}Courses</span><a href="#/my-mea/courses/find${qs({ child: k.id })}">Find courses</a></h2>${en.length ? h`<div class="list">${en.map(e => { const cl = classById(e.classId), co = clsCourse(cl); return h`<div class="li">${svcIcon(co.subject)}<div class="grow"><div class="t">${co.title}</div><div class="s">${schedText(cl).short}</div></div>${statusChip(e.status)}</div>`; })}</div>` : raw('<p class="muted">No courses yet.</p>')}</div></div>
    ${rec.length ? h`<section style="margin-top:22px"><h2 style="font-size:1.25rem">Available courses for ${k.first}</h2><div class="grid g3">${rec.map(cl => classCard(cl, u))}</div><p style="margin-top:14px"><a class="btn btn-outline" href="#/my-mea/courses/find${qs({ child: k.id })}">See all courses for ${k.first}</a></p></section>` : ''}`
  };
}, PR);

/* ---------------- My Courses ---------------- */
R('/my-mea/courses', (p, q, u) => {
  const sel = kidSel(u, true), status = UI.cstatus || '', ks = myKids(u).filter(k => sel === 'all' || k.id === sel);
  const visible = e => !status ? true : status === 'Live' ? ['Active', 'Pending Confirmation', 'Awaiting Payment', 'Waitlisted'].includes(e.status) : e.status === status;
  const row = e => { const cl = classById(e.classId), co = clsCourse(cl), k = childById(e.childId), t = teacherOf(cl), lv = ['Active', 'Completed'].includes(e.status);
    return h`<div class="li">${svcIcon(co.subject)}<div class="grow"><div class="t">${co.title}</div><div class="s">${k.first} (${k.stage})${co.board ? ' · ' + co.board : ''} · ${schedText(cl).short}${t.publish ? ' · ' + t.name : ''}</div></div><div class="row" style="gap:8px">${e.status === 'Active' && startsLater(cl) ? chip('Starts ' + fmtDate(cl.startDate), 'chip-blue', 'calendar') : statusChip(e.status)}</div><div class="row" style="gap:8px">${lv && e.status === 'Active' ? h`<a class="btn btn-ghost btn-sm" href="#/my-mea/learning/${e.id}">Learning Hub</a>` : ''}${e.status === 'Awaiting Payment' ? h`<a class="btn btn-pink btn-sm" href="#${payLink(e)}">${ic('credit-card')}Pay Now</a>` : ''}<a class="btn btn-outline btn-sm" href="#/my-mea/courses/${e.id}${e.status === 'Completed' ? '?view=summary' : ''}">${e.status === 'Completed' ? 'View Summary' : 'View Details'}</a></div></div>`; };
  const groups = ks.map(k => ({ k, en: S.enrolments.filter(e => e.childId === k.id && !['Withdrawn', 'Cancelled'].includes(e.status) && visible(e)) })).filter(g => g.en.length);
  return {
    title: 'My Courses', shell: 'parent', ptitle: 'My Courses', psub: 'All your children’s courses in one place', body: h`
    <div class="toolbar">${kidPicker(u, true)}<div class="field"><label for="cst">Filter by status</label><select class="sel" id="cst" data-on="cStatus"><option value="">All courses</option>${['Live', 'Active', 'Pending Confirmation', 'Awaiting Payment', 'Waitlisted', 'Completed'].map(s => h`<option value="${s}" ${status === s ? raw('selected') : ''}>${s === 'Live' ? 'Current (not completed)' : s}</option>`)}</select></div><div class="grow"></div><a class="btn btn-outline btn-sm" href="#/my-mea/children/add" title="Add another child">${ic('user-plus')}Add Child</a>${btn('Find a Course', '/my-mea/courses/find', 'btn-pink', 'search')}</div>
    ${(() => { const mine = (S.o2o || []).filter(x => x.status !== 'Withdrawn' && ks.some(k => k.id === x.childId)); return mine.length ? h`<section class="panel" style="margin-bottom:18px"><h2><span class="l">${ic('user')}One-to-one requests</span></h2><div class="list">${mine.map(x => h`<div class="li"><div class="grow"><div class="t">${subj(x.subject).name} · ${childById(x.childId).first}</div><div class="s">${o2oSummary(x.slots)}${x.note ? ' · ' + x.note : ''}</div></div>${chip(x.status === 'Requested' ? 'Awaiting arrangement' : x.status, x.status === 'Arranged' ? 'chip-green' : x.status === 'Declined' ? 'chip-red' : 'chip-yellow')}${x.status === 'Requested' ? h`<button class="btn btn-ghost btn-sm" data-act="o2oCancel" data-id="${x.id}">Cancel</button>` : ''}</div>`)}</div></section>` : ''; })()}
    ${groups.length ? groups.map(g => h`<section class="panel" style="margin-bottom:18px"><h2><span class="l">${avatar(g.k.first, kidIdx(g.k), 'sm')}${g.k.first} · ${g.k.stage}</span></h2><div class="list">${g.en.map(row)}</div></section>`) : emptyState({ icon: 'book-open', title: 'No courses yet', text: 'Find a class that suits your child’s year and subject.', action: btn('Find a Course', '/my-mea/courses/find', 'btn-primary') })}`
  };
}, PR);
Changes.cStatus = el => { UI.cstatus = el.value; render({ keepScroll: true }); };

/* Find a course (portal) */
R('/my-mea/courses/find', (p, q, u) => {
  const ks = myKids(u); if (!ks.length) return { redirect: '/my-mea/children/add?first=1' };
  if (q.child && childById(q.child) && childById(q.child).parentId === u.id) UI.kid = q.child;
  const kid = childById(kidSel(u, false)), lv = levelOfStage(kid.sys, kid.stage);
  // Filters belong to one child: switching child starts clean (state AND what's shown), because
  // the old child's subject/board may not even exist at the new child's level.
  let F = UI.fc || (UI.fc = {}); if (F.forKid !== kid.id) F = UI.fc = { forKid: kid.id };
  const base = findClasses({ sys: kid.sys, level: F.all ? '' : lv });
  const subs = [...new Set(base.map(c => clsCourse(c).subject))].map(subj), boards = [...new Set(base.map(c => clsCourse(c).board).filter(Boolean))];
  if (F.subject && !subs.some(s => s.id === F.subject)) { F.subject = ''; F.mode = ''; }
  if (F.board && !boards.includes(F.board)) F.board = '';
  const list = findClasses({ sys: kid.sys, level: F.all ? '' : lv, subject: F.subject || '', board: F.board || '', day: F.day ?? '', trial: F.trial || '', q: F.q || '' });
  const gPrice = levelPrice(lv, 'group'), oPrice = levelPrice(lv, 'one2one');
  return {
    title: 'Find a Course', shell: 'parent', ptitle: 'Find a Course', psub: `Classes for ${kid.first} (${kid.stage})`, body: h`
    <div class="toolbar">${kidPicker(u, false)}<div class="grow"></div>${btn('Add Child', '/my-mea/children/add', 'btn-outline', 'plus')}</div>
    <div class="filters" style="margin-bottom:20px"><div class="fgrid" style="grid-template-columns:repeat(5,minmax(0,1fr))">
      <div class="field"><label for="fc_s">Subject</label><select class="sel" id="fc_s" data-on="fc" data-k="subject"><option value="">All subjects</option>${subs.map(s => h`<option value="${s.id}" ${F.subject === s.id ? raw('selected') : ''}>${s.name}</option>`)}</select></div>
      ${boards.length ? h`<div class="field"><label for="fc_b">Exam board</label><select class="sel" id="fc_b" data-on="fc" data-k="board"><option value="">Any board</option>${boards.map(b => h`<option ${F.board === b ? raw('selected') : ''}>${b}</option>`)}</select></div>` : ''}
      <div class="field"><label for="fc_d">Day</label><select class="sel" id="fc_d" data-on="fc" data-k="day"><option value="">Any day</option>${[1, 2, 3, 4, 5, 6, 0].map(d => h`<option value="${d}" ${String(F.day) === String(d) ? raw('selected') : ''}>${DAYS[d]}</option>`)}</select></div>
      <div class="field"><label for="fc_t">Trial lessons</label><select class="sel" id="fc_t" data-on="fc" data-k="trial"><option value="">Any</option><option value="1" ${F.trial === '1' ? raw('selected') : ''}>Trial lessons available</option></select></div>
      <div class="field"><label for="fc_q">Search</label><input class="inp" id="fc_q" type="search" value="${F.q || ''}" data-on="fc" data-k="q" placeholder="Course or subject"></div></div>
      <label class="check" style="margin-top:12px"><input type="checkbox" data-on="fcAll" ${F.all ? raw('checked') : ''}><span>Also show other stages in ${SYS[kid.sys].short}</span></label></div>
    <section style="margin-bottom:20px"><h2 style="font-size:1.1rem;margin:0 0 4px">1. Choose a subject</h2><p class="muted" style="margin:0 0 10px">Then pick group sessions or one-to-one.</p>
      <div class="pick" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">${subs.map(s => h`<button type="button" data-act="subjPick" data-s="${s.id}" aria-pressed="${F.subject === s.id}">${ic(s.icon)} ${s.name}<small>${F.subject === s.id && F.mode === 'group' ? 'Group sessions' : 'Group or one-to-one'}</small></button>`)}</div></section>
    ${F.subject && F.mode === 'group' ? h`<div class="alert alert-info" style="margin-bottom:14px">${ic('users')}<span><strong>Group sessions for ${subj(F.subject).name}</strong> (${money(gPrice)} per lesson). Pick one of the available time slots below. <button type="button" class="btn btn-ghost btn-sm" data-act="subjClear">Show all subjects</button></span></div>` : ''}
    <p class="muted"><strong>${plural(list.length, 'class', 'classes')}</strong> available for ${kid.first}. Select more than one to enrol in several at once${SITE.multiCourseLessons ? ` — select ${SITE.multiCourseLessons}+ lessons in total and get ${SITE.multiCourseDiscount}% off` : ''}.</p>
    ${list.length ? h`<div class="grid g3">${list.map(cl => classCard(cl, u, null, null, { select: true }))}</div>` : emptyState({ icon: 'search', title: 'No classes match', text: 'Try changing the filters, or contact us and we will help you find a suitable class.', action: btn('Contact Support', '/my-mea/support', 'btn-primary') })}
    ${(UI.basket || []).length ? h`<div class="panel row between" style="position:sticky;bottom:12px;margin-top:20px;background:var(--blue-d);color:#fff;box-shadow:0 6px 24px rgba(0,0,0,.25)"><div><strong>${plural((UI.basket || []).length, 'course')} selected</strong><div class="small" style="opacity:.85">Review children, billing and any discount before confirming.</div></div><div class="row" style="gap:8px"><button class="btn btn-ghost" data-act="basketClear" style="color:#fff">Clear</button><a class="btn btn-pink" href="#/my-mea/courses/basket">Review Selection</a></div></div>` : ''}`
  };
}, PR);
Changes.fc = el => { const F = UI.fc = UI.fc || {}; F[el.dataset.k] = el.value; if (el.dataset.k === 'subject') F.mode = ''; render({ keepScroll: true }); };
Actions.subjPick = t => {
  const u = me(), kid = childById(kidSel(u, false)), lv = levelOfStage(kid.sys, kid.stage), s = subj(t.dataset.s);
  openModal({ title: `${s.name} for ${kid.first}`, body: h`<p>How would ${kid.first} like to learn ${s.name}?</p>
    <div class="stack"><button type="button" class="btn btn-outline btn-block" style="text-align:left;height:auto;padding:14px" data-act="subjGroup" data-s="${s.id}"><strong>${ic('users')} Group sessions</strong><br><span class="small muted">Live small-group classes · ${money(levelPrice(lv, 'group'))} per lesson. You will see every current time slot to choose from.</span></button>
    <button type="button" class="btn btn-outline btn-block" style="text-align:left;height:auto;padding:14px" data-act="subjOne" data-s="${s.id}"><strong>${ic('user')} One-to-one</strong><br><span class="small muted">A tutor just for ${kid.first} · ${money(levelPrice(lv, 'one2one'))} per lesson. You tick the times you are free and we arrange it.</span></button></div>` });
};
Actions.subjGroup = t => { const F = UI.fc = UI.fc || {}; F.subject = t.dataset.s; F.mode = 'group'; closeModal(); render(); };
Actions.subjOne = t => { closeModal(); go('/my-mea/courses/one-to-one' + qs({ subject: t.dataset.s })); };
Actions.subjClear = () => { const F = UI.fc = UI.fc || {}; F.subject = ''; F.mode = ''; render({ keepScroll: true }); };
Changes.fcAll = el => { (UI.fc = UI.fc || {}).all = el.checked; render({ keepScroll: true }); };
Actions.basketToggle = t => {
  const u = me(), id = t.dataset.id; UI.basket = UI.basket || [];
  const i = UI.basket.findIndex(b => b.classId === id);
  if (i >= 0) UI.basket.splice(i, 1);
  else UI.basket.push({ classId: id, child: kidSel(u, false), period: 'month', customMode: 'lessons', customLessons: 4, customUntil: '' });
  render({ keepScroll: true });
};
Actions.basketClear = () => { UI.basket = []; render({ keepScroll: true }); };

/* One-to-one lessons: the parent ticks every weekly slot they could do (Mon-Fri + Sun,
   5pm-10pm) and MEA arranges a time that fits one of them. */
R('/my-mea/courses/one-to-one', (p, q, u) => {
  const ks = myKids(u); if (!ks.length) return { redirect: '/my-mea/children/add?first=1' };
  const kid = childById(kidSel(u, false)), lv = levelOfStage(kid.sys, kid.stage);
  if (q.subject && subj(q.subject)) { if (!UI.o2o || UI.o2o.subject !== q.subject || UI.o2o.child !== kid.id) UI.o2o = { child: kid.id, subject: q.subject, board: '', slots: [] }; if (q.board) UI.o2o.board = q.board; }
  const O = UI.o2o; if (!O || !O.subject) return { redirect: '/my-mea/courses/find' };
  if (O.child !== kid.id) { O.child = kid.id; O.board = ''; }
  const s = subj(O.subject), boards = [...new Set(findClasses({ sys: kid.sys, level: lv, subject: O.subject }).map(c => clsCourse(c).board).filter(Boolean))];
  const on = k => O.slots.includes(k);
  return { title: 'One-to-one lessons', shell: 'parent', ptitle: 'One-to-one ' + s.name, psub: `For ${kid.first} (${kid.stage}) · ${money(levelPrice(lv, 'one2one'))} per lesson`, body: h`
    <div class="toolbar">${kidPicker(u, false)}<div class="grow"></div><a class="btn btn-outline btn-sm" href="#/my-mea/courses/find">${ic('arrow-left')}Back to Find a Course</a></div>
    <div class="panel"><h2>Tick every time ${kid.first} is free each week</h2><p class="muted">Lessons are one hour. Tick as many slots as you can: the more you tick, the easier it is for us to match a tutor. Saturdays are not available.</p>
      ${boards.length ? h`<div class="field" style="max-width:260px;margin-bottom:14px"><label for="o2o_b">Exam board (optional)</label><select class="sel" id="o2o_b" data-on="o2oBoard"><option value="">No preference</option>${boards.map(b => h`<option ${O.board === b ? raw('selected') : ''}>${b}</option>`)}</select></div>` : ''}
      <div style="overflow-x:auto"><table class="tbl" style="min-width:520px"><thead><tr><th>Time</th>${O2O_DAYS.map(d => h`<th>${DS[d]}</th>`)}</tr></thead>
        <tbody>${O2O_HOURS.map(hr => h`<tr><th scope="row">${o2oHourLabel(hr)}</th>${O2O_DAYS.map(d => { const k = d + '-' + hr; return h`<td style="text-align:center"><input type="checkbox" data-on="o2oSlot" data-k="${k}" ${on(k) ? raw('checked') : ''} aria-label="${DAYS[d]} ${o2oHourLabel(hr)}"></td>`; })}</tr>`)}</tbody></table></div>
      <p class="small muted" style="margin-top:10px">${O.slots.length ? `${plural(O.slots.length, 'slot')} ticked: ${o2oSummary(O.slots)}` : 'Nothing ticked yet.'}</p>
      <div class="row" style="margin-top:14px"><button class="btn btn-pink" data-act="o2oSubmit" ${O.slots.length ? '' : raw('disabled')}>Request one-to-one lessons</button><button class="btn btn-ghost" data-act="o2oClear">Clear all</button></div>
      <p class="form-note" style="margin-top:10px">This is a request, not a booking: MEA will confirm a time that suits and contact you.</p></div>` };
}, PR);
Changes.o2oSlot = el => { const O = UI.o2o, k = el.dataset.k; O.slots = el.checked ? [...new Set([...O.slots, k])] : O.slots.filter(x => x !== k); render({ keepScroll: true }); };
Changes.o2oBoard = el => { UI.o2o.board = el.value; };
Actions.o2oClear = () => { UI.o2o.slots = []; render({ keepScroll: true }); };
Actions.o2oSubmit = async () => {
  const u = me(), O = UI.o2o, kid = childById(O.child); if (!O.slots.length) { toast('Tick at least one time first.'); return; }
  const lv = levelOfStage(kid.sys, kid.stage); let id = uid('o2o'), live = false, price = levelPrice(lv, 'one2one');
  if (LIVE_BACKEND && u.live && kid.live) {
    const r = await api('onetoone', { method: 'POST', body: { childId: kid.id, subject: O.subject, board: O.board, level: lv, slots: O.slots } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not send that request — please try again.'); return; }
    id = r.data.request.id; live = true;
  }
  (S.o2o = S.o2o || []).push({ id, childId: kid.id, parentId: u.id, subject: O.subject, level: lv, board: O.board, slots: [...O.slots], pricePerLesson: price, status: 'Requested', note: '', created: todayISO(), live });
  addNotif(u.id, 'Enrolments', kid.id, `One-to-one ${subj(O.subject).name} requested for ${kid.first}. We will be in touch to arrange a time.`, '/my-mea/courses');
  UI.o2o = null; save(); toast('One-to-one request sent.'); go('/my-mea/courses');
};
Actions.o2oCancel = async t => {
  const r0 = (S.o2o || []).find(x => x.id === t.dataset.id); if (!r0) return;
  if (LIVE_BACKEND && r0.live) { const r = await api('onetoone', { method: 'PATCH', body: { id: r0.id, status: 'Withdrawn' } }); if (!r.ok) { toast((r.data && r.data.error) || 'Could not cancel — please try again.'); return; } }
  r0.status = 'Withdrawn'; save(); toast('Request cancelled.'); render({ keepScroll: true });
};

/* Review Selection — confirm several courses (possibly for different children)
   in one go. Each item picks its own child + billing; the multi-course discount
   (admin-set in Setup & Integrations → Site Details) is worked out from the
   combined lesson count across every item here, and shown live as items change. */
function basketItemTotal(b, cl) {
  return b.period === 'custom'
    ? customPeriodTotal(cl, { lessons: b.customMode === 'until' ? undefined : b.customLessons, until: b.customMode === 'until' ? b.customUntil : undefined })
    : periodTotal(cl, b.period);
}
R('/my-mea/courses/basket', (p, q, u) => {
  const ks = myKids(u); if (!ks.length) return { redirect: '/my-mea/children/add?first=1' };
  UI.basket = (UI.basket || []).filter(b => classById(b.classId));
  if (!UI.basket.length) return { redirect: '/my-mea/courses/find' };
  const items = UI.basket.map((b, i) => { const cl = classById(b.classId), co = clsCourse(cl); return { i, b, cl, co, t: basketItemTotal(b, cl) }; });
  const totalLessons = items.reduce((a, x) => a + x.t.lessons, 0), discountPct = multiCourseDiscountPct(totalLessons);
  const grossTotal = items.reduce((a, x) => a + x.t.total, 0), discountAmt = discountPct ? Math.round(grossTotal * discountPct) / 100 : 0, netTotal = grossTotal - discountAmt;
  return {
    title: 'Review Selection', shell: 'parent', ptitle: 'Review Selection', psub: `${plural(items.length, 'course')} selected — review each one, then confirm together`, body: h`
    <div class="cols-2" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div class="stack">
    ${items.map(x => h`<div class="panel"><div class="row between"><h2 style="margin:0;font-size:1.1rem">${x.co.title}</h2><button type="button" class="btn btn-ghost btn-sm" data-act="basketRemove" data-i="${x.i}">${ic('x')}Remove</button></div>
      <p class="small muted" style="margin:2px 0 10px">${schedText(x.cl).short}</p>
      <div class="field" style="max-width:260px"><label for="bk_child_${x.i}">Child</label><select class="sel" id="bk_child_${x.i}" data-on="basketChild" data-i="${x.i}">${ks.map(k => h`<option value="${k.id}" ${x.b.child === k.id ? raw('selected') : ''}>${k.first} (${k.stage})</option>`)}</select></div>
      <div class="pick" style="margin-top:10px">${[['month', 'Pay monthly', periodTotal(x.cl, 'month')], ['term', 'Pay termly', periodTotal(x.cl, 'term')]].map(([k, label, t]) => h`<button type="button" data-act="basketPeriod" data-i="${x.i}" data-p="${k}" aria-pressed="${x.b.period === k}">${label}<small>${t.lessons} lesson${t.lessons === 1 ? '' : 's'} × ${money(t.feePerLesson)} = ${money(t.total)}</small></button>`)}
        <button type="button" data-act="basketPeriod" data-i="${x.i}" data-p="custom" aria-pressed="${x.b.period === 'custom'}">Custom<small>Exact lessons, or until a date</small></button></div>
      ${x.b.period === 'custom' ? h`<div class="panel" style="margin-top:10px;background:var(--blue-50)">
        <div class="seg" role="group" aria-label="Custom billing type" style="margin-bottom:10px"><button type="button" data-act="basketCustomMode" data-i="${x.i}" data-m="lessons" aria-pressed="${x.b.customMode !== 'until'}">${ic('calculator')}Number of lessons</button><button type="button" data-act="basketCustomMode" data-i="${x.i}" data-m="until" aria-pressed="${x.b.customMode === 'until'}">${ic('calendar')}Until a date</button></div>
        ${x.b.customMode === 'until'
          ? h`<div class="field" style="max-width:220px"><label for="bk_until_${x.i}">Enrol until</label><input class="inp" id="bk_until_${x.i}" type="date" min="${todayISO()}" max="${x.cl.endDate}" value="${x.b.customUntil || ''}" data-on="basketUntil" data-i="${x.i}"></div>`
          : h`<div class="field" style="max-width:160px"><label for="bk_lessons_${x.i}">Exact number of lessons</label><input class="inp" id="bk_lessons_${x.i}" type="number" min="1" max="60" value="${x.b.customLessons || 4}" data-on="basketLessons" data-i="${x.i}"></div>`}
        <p class="small muted" style="margin-top:10px">${x.t.lessons} lesson${x.t.lessons === 1 ? '' : 's'} × ${money(x.t.feePerLesson)} = <strong>${money(x.t.total)}</strong>${x.b.customMode === 'until' && x.b.customUntil ? h` (through ${fmtDate(x.b.customUntil, 'dmy')})` : ''}</p></div>` : ''}
      </div>`)}
    </div>
    <aside class="panel" aria-label="Summary" style="position:sticky;top:20px;align-self:start"><h2>Summary</h2>
      <dl class="kv">${items.map(x => h`<dt>${x.co.title}</dt><dd>${money(x.t.total)}</dd>`)}<dt>Total lessons</dt><dd>${totalLessons}</dd></dl>
      ${discountPct ? h`<div class="alert alert-ok" style="margin:12px 0">${ic('sparkles')}<span><strong>${discountPct}% multi-course discount applied</strong> for selecting ${totalLessons} lessons in total.</span></div>`
        : (SITE.multiCourseLessons ? h`<div class="alert alert-info" style="margin:12px 0">${ic('info')}<span>Select ${Math.max(0, SITE.multiCourseLessons - totalLessons)} more lesson${SITE.multiCourseLessons - totalLessons === 1 ? '' : 's'} in total to unlock ${SITE.multiCourseDiscount}% off.</span></div>` : '')}
      <dl class="kv">${discountPct ? h`<dt>Subtotal</dt><dd>${money(grossTotal)}</dd><dt>Discount (${discountPct}%)</dt><dd>−${money(discountAmt)}</dd>` : ''}<dt><strong>Total</strong></dt><dd><strong>${money(netTotal)}</strong></dd></dl>
      <form data-form="basketConfirm" novalidate>${chk('terms', h`I have read the <a href="#/terms" target="_blank">key terms</a> and understand fees are charged per lesson.`, false, true)}
        <button class="btn btn-pink" type="submit" style="margin-top:14px;width:100%">Confirm ${plural(items.length, 'Enrolment')}</button>
        <a class="btn btn-outline" style="margin-top:8px;width:100%" href="#/my-mea/courses/find">Add another course</a></form></aside></div>`
  };
}, PR);
Actions.basketRemove = t => { UI.basket.splice(+t.dataset.i, 1); render({ keepScroll: true }); };
Changes.basketChild = el => { UI.basket[+el.dataset.i].child = el.value; render({ keepScroll: true }); };
Actions.basketPeriod = t => { UI.basket[+t.dataset.i].period = t.dataset.p; render({ keepScroll: true }); };
Actions.basketCustomMode = t => { UI.basket[+t.dataset.i].customMode = t.dataset.m; render({ keepScroll: true }); };
Changes.basketLessons = el => { UI.basket[+el.dataset.i].customLessons = Math.max(1, Math.min(60, +el.value || 1)); render({ keepScroll: true }); };
Changes.basketUntil = el => { UI.basket[+el.dataset.i].customUntil = el.value; render({ keepScroll: true }); };
Forms.basketConfirm = async (f, v) => {
  if (!showErrors(f, v.terms ? {} : { terms: 'Please confirm you have read the key terms.' })) return;
  const u = me(), items = UI.basket.map(b => { const cl = classById(b.classId); return { b, cl, t: basketItemTotal(b, cl) }; });
  const totalLessons = items.reduce((a, x) => a + x.t.lessons, 0), discountPct = multiCourseDiscountPct(totalLessons);
  let n = 0;
  for (const { b, cl, t } of items) {
    const co = clsCourse(cl), kid = childById(b.child);
    let status = avail(cl).k === 'full' ? 'Waitlisted' : 'Pending Confirmation', id = uid('en'), live = false;
    const billingPeriod = b.period === 'custom' ? 'custom' : b.period;
    const customLessons = b.period === 'custom' ? t.lessons : undefined;
    const customUntil = b.period === 'custom' && b.customMode === 'until' ? b.customUntil : undefined;
    if (LIVE_BACKEND && u.live && kid.live) {
      const r = await api('enrolments', { method: 'POST', body: { childId: kid.id, classId: cl.id, billingPeriod, customLessons, customUntil, bundleDiscountPct: discountPct } });
      if (!r.ok) { toast((r.data && r.data.error) || `Could not enrol ${kid.first} in ${co.title} — please try again.`); continue; }
      id = r.data.enrolment.id; status = r.data.enrolment.status; live = true;
    }
    S.enrolments.push({ id, childId: kid.id, classId: cl.id, status, billingPeriod, customLessons, customUntil, bundleDiscountPct: discountPct, created: todayISO(), live });
    addNotif(u.id, 'Enrolments', kid.id, status === 'Waitlisted' ? `${kid.first} has joined the waitlist for ${co.title}.` : `Enrolment requested: ${co.title} for ${kid.first} is waiting for confirmation.`, '/my-mea/courses');
    n++;
  }
  UI.basket = []; save(); toast(`${n} enrolment${n === 1 ? '' : 's'} requested.`); go('/my-mea/courses');
};

/* Enrol / waitlist confirmation */
// customPeriodTotal() expects { lessons, until } — UI.enrol stores customLessons/customUntil
// (so the fields can be edited in place), so this remaps one to the other. Without this
// remap, customPeriodTotal() never sees what the parent typed and silently treats every
// Custom selection as 1 lesson — which is exactly why the price and discount looked frozen.
const enrolCustomTotal = (cl, E) => customPeriodTotal(cl, { lessons: E.customMode === 'until' ? undefined : E.customLessons, until: E.customMode === 'until' ? E.customUntil : undefined });
function enrolView(mode) {
  return (p, q, u) => {
    const cl = classById(p.classId); if (!cl) return notFoundView();
    const co = clsCourse(cl), a = avail(cl), ks = myKids(u);
    if (mode === 'enrol' && a.k === 'full') return { redirect: '/my-mea/courses/waitlist/' + cl.id + (q.child ? qs({ child: q.child }) : '') };
    if (!ks.length) return { title: 'Enrol', shell: 'parent', ptitle: mode === 'waitlist' ? 'Join Waitlist' : 'Request Enrolment', psub: co.title, body: h`${emptyState({ icon: 'user-plus', title: 'Add your child first', text: 'We need your child’s year and stage to check this class is the right fit.', action: btn('Add Your First Child', '/my-mea/children/add?first=1', 'btn-pink') })}` };
    const E = UI.enrol && UI.enrol.classId === cl.id ? UI.enrol : (UI.enrol = { classId: cl.id, child: '', period: 'month', customMode: 'lessons', customLessons: 4, customUntil: '' });
    if (!E.period) E.period = 'month';
    if (q.child && childById(q.child) && childById(q.child).parentId === u.id) E.child = q.child;
    if (!E.child) E.child = ks.length === 1 ? ks[0].id : (ks.find(k => !stageMismatch(k, co)) || ks[0]).id;
    const kid = childById(E.child), mm = stageMismatch(kid, co), dup = S.enrolments.find(e => e.childId === kid.id && e.classId === cl.id && ['Active', 'Pending Confirmation', 'Awaiting Payment', 'Waitlisted'].includes(e.status));
    const sc = schedText(cl), title = mode === 'waitlist' ? 'Join Waitlist' : 'Request Enrolment';
    const periodT = E.period === 'custom' ? enrolCustomTotal(cl, E) : periodTotal(cl, E.period);
    const discountPct = multiCourseDiscountPct(periodT.lessons), discountAmt = discountPct ? Math.round(periodT.total * discountPct) / 100 : 0, netTotal = periodT.total - discountAmt;
    if (a.k === 'closed') return { title, shell: 'parent', ptitle: title, psub: co.title, body: h`${emptyState({ icon: 'lock', title: 'Enrolment is closed for this class', text: 'Please contact us if you would like to be told when it reopens.', action: btn('Contact Support', '/my-mea/support', 'btn-primary') })}` };
    return {
      title, shell: 'parent', ptitle: title, psub: `Review the details before you submit`, body: h`<div class="cols-2" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)"><div class="stack">
      <div class="panel"><h2>1. Choose child</h2><div class="pick">${ks.map(k => h`<button type="button" data-act="enrolKid" data-id="${k.id}" aria-pressed="${E.child === k.id}">${k.first}<small>${k.stage}${stageMismatch(k, co) ? ' · different stage' : ' · matches this class'}</small></button>`)}</div>
        ${mm ? h`<div class="alert alert-warn" style="margin-top:14px">${ic('alert-triangle')}<span><strong>Check the stage.</strong> ${kid.first} is recorded as ${kid.stage} (${SYS[kid.sys].short}), but this class is for ${levelName(co.level)} in ${SYS[co.sys].short}. You can still continue if you are sure it is right.</span></div>` : ''}${dup ? h`<div class="alert alert-info" style="margin-top:14px">${ic('info')}<span>${kid.first} already has a ${dup.status.toLowerCase()} request for this class.</span></div>` : ''}</div>
      <div class="panel"><h2>2. How do you want to pay?</h2><p class="muted" style="margin-top:-4px">Fees are charged per lesson. Choose how often you'd like to be billed — we'll work out the total from this class's real weekly schedule. Prefer a fixed block instead? Choose Custom.</p>
        <div class="pick">${[['month', 'Pay monthly', periodTotal(cl, 'month')], ['term', 'Pay termly', periodTotal(cl, 'term')]].map(([k, label, t]) => h`<button type="button" data-act="enrolPeriod" data-p="${k}" aria-pressed="${E.period === k}">${label}<small>${t.lessons} lesson${t.lessons === 1 ? '' : 's'} × ${money(t.feePerLesson)} = ${money(t.total)}</small></button>`)}
          <button type="button" data-act="enrolPeriod" data-p="custom" aria-pressed="${E.period === 'custom'}">Custom<small>Exact lessons, or until a date</small></button></div>
        ${E.period === 'custom' ? h`<div class="panel" style="margin-top:12px;background:var(--blue-50)">
          <div class="seg" role="group" aria-label="Custom billing type" style="margin-bottom:10px"><button type="button" data-act="enrolCustomMode" data-m="lessons" aria-pressed="${E.customMode !== 'until'}">${ic('calculator')}Number of lessons</button><button type="button" data-act="enrolCustomMode" data-m="until" aria-pressed="${E.customMode === 'until'}">${ic('calendar')}Until a date</button></div>
          ${E.customMode === 'until'
            ? h`<div class="field" style="max-width:220px"><label for="en_until">Enrol until</label><input class="inp" id="en_until" type="date" min="${todayISO()}" max="${cl.endDate}" value="${E.customUntil || ''}" data-on="enrolUntil"></div>`
            : h`<div class="field" style="max-width:160px"><label for="en_lessons">Exact number of lessons</label><input class="inp" id="en_lessons" type="number" min="1" max="60" value="${E.customLessons || 4}" data-on="enrolLessons"></div>`}
          <p class="small muted" style="margin-top:10px">${periodT.lessons} lesson${periodT.lessons === 1 ? '' : 's'} × ${money(classFee(cl))} = <strong>${money(periodT.total)}</strong>${E.customMode === 'until' && E.customUntil ? h` (through ${fmtDate(E.customUntil, 'dmy')})` : ''}</p></div>` : ''}
        ${discountPct ? h`<div class="alert alert-ok" style="margin-top:12px">${ic('sparkles')}<span><strong>${discountPct}% multi-course discount applied</strong> for selecting ${periodT.lessons} lessons.</span></div>`
          : (SITE.multiCourseLessons ? h`<div class="alert alert-info" style="margin-top:12px">${ic('info')}<span>Select ${Math.max(0, SITE.multiCourseLessons - periodT.lessons)} more lesson${SITE.multiCourseLessons - periodT.lessons === 1 ? '' : 's'} to unlock ${SITE.multiCourseDiscount}% off.</span></div>` : '')}</div>
      <div class="panel"><h2>3. Confirm</h2><form data-form="enrol" data-mode="${mode}" novalidate>${chk('terms', h`I have read the <a href="#/terms" target="_blank">key terms</a> and understand fees are charged per lesson${E.period === 'custom' ? ', for the exact lessons chosen above' : `, billed ${E.period === 'term' ? 'termly' : 'monthly'}`}.`, false, true)}<div class="row" style="margin-top:16px"><button class="btn btn-pink" type="submit" ${dup ? raw('disabled') : ''}>${mode === 'waitlist' ? 'Join Waitlist' : 'Request Enrolment'}</button><a class="btn btn-outline" href="#/courses/${co.slug}">Cancel</a></div></form>
        <p class="form-note" style="margin-top:12px">${mode === 'waitlist' ? 'You will be notified if a place becomes available.' : 'Your request will show as Pending Confirmation until MEA confirms your place.'}</p></div></div>
      <aside class="panel" aria-label="Summary"><h2>Summary</h2><dl class="kv"><dt>Child</dt><dd>${kid.first} (${kid.stage})</dd><dt>Course</dt><dd>${co.title}</dd><dt>Subject / level</dt><dd>${subj(co.subject).name} · ${levelName(co.level)}</dd><dt>Day / time</dt><dd>${sc.days}<br>${sc.time} (UK time)</dd><dt>Start / term</dt><dd>${startsLater(cl) ? fmtDate(cl.startDate, 'long') : cl.term}</dd><dt>Fee</dt><dd>${money(classFee(cl))} per lesson</dd><dt>${E.period === 'term' ? 'Termly total' : E.period === 'custom' ? 'Custom total' : 'Monthly total'}</dt><dd><strong>${money(periodT.total)}</strong></dd>${discountPct ? h`<dt>Discount (${discountPct}%)</dt><dd>−${money(discountAmt)}</dd><dt><strong>Total due</strong></dt><dd><strong>${money(netTotal)}</strong></dd>` : ''}<dt>Status</dt><dd>${chip(a.label, a.cls, a.icon)}</dd></dl></aside></div>`
    };
  };
}
R('/my-mea/courses/enrol/:classId', enrolView('enrol'), PR);
R('/my-mea/courses/waitlist/:classId', enrolView('waitlist'), PR);
Actions.enrolKid = t => { UI.enrol.child = t.dataset.id; render({ keepScroll: true }); };
Actions.enrolPeriod = t => { UI.enrol.period = t.dataset.p; render({ keepScroll: true }); };
Actions.enrolCustomMode = t => { UI.enrol.customMode = t.dataset.m; render({ keepScroll: true }); };
Changes.enrolLessons = el => { UI.enrol.customLessons = Math.max(1, Math.min(60, +el.value || 1)); render({ keepScroll: true }); };
Changes.enrolUntil = el => { UI.enrol.customUntil = el.value; render({ keepScroll: true }); };
Forms.enrol = async (f, v) => {
  const u = me(), E = UI.enrol, cl = classById(E.classId), co = clsCourse(cl), kid = childById(E.child), mode = f.dataset.mode, period = E.period || 'month';
  if (!showErrors(f, v.terms ? {} : { terms: 'Please confirm you have read the key terms.' })) return;
  const t = period === 'custom' ? enrolCustomTotal(cl, E) : periodTotal(cl, period);
  const customLessons = period === 'custom' ? t.lessons : undefined, customUntil = period === 'custom' && E.customMode === 'until' ? E.customUntil : undefined;
  const bundleDiscountPct = multiCourseDiscountPct(t.lessons);
  let status = mode === 'waitlist' || avail(cl).k === 'full' ? 'Waitlisted' : 'Pending Confirmation', id = uid('en'), live = false;
  if (LIVE_BACKEND && u.live && kid.live) {
    const r = await api('enrolments', { method: 'POST', body: { childId: kid.id, classId: cl.id, billingPeriod: period, customLessons, customUntil, bundleDiscountPct } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not send that request — please try again.'); return; }
    id = r.data.enrolment.id; status = r.data.enrolment.status; live = true;
  }
  S.enrolments.push({ id, childId: kid.id, classId: cl.id, status, billingPeriod: period, customLessons, customUntil, bundleDiscountPct, created: todayISO(), live });
  addNotif(u.id, 'Enrolments', kid.id, status === 'Waitlisted' ? `${kid.first} has joined the waitlist for ${co.title}.` : `Enrolment requested: ${co.title} for ${kid.first} is waiting for confirmation.`, '/my-mea/courses');
  UI.enrol = null; save(); toast(status === 'Waitlisted' ? 'You’re on the waitlist.' : 'Enrolment request sent.'); go('/my-mea/courses');
};
R('/my-mea/courses/:id', (p, q, u) => {
  const e = S.enrolments.find(x => x.id === p.id), k = e && childById(e.childId); if (!e || k.parentId !== u.id) return notFoundView();
  const cl = classById(e.classId), co = clsCourse(cl), t = teacherOf(cl), sc = schedText(cl), nx = e.status === 'Active' ? nextSession(cl) : null, sum = q.view === 'summary';
  return {
    title: co.title, shell: 'parent', ptitle: co.title, psub: `${k.first} (${k.stage})`, body: h`<div class="cols-2b"><div class="panel"><h2><span class="l">${svcIcon(co.subject)}${sum ? 'Course summary' : 'Course details'}</span>${statusChip(e.status)}</h2>
      <dl class="kv"><dt>Subject / level</dt><dd>${subj(co.subject).name} · ${levelName(co.level)}</dd>${co.board ? h`<dt>Exam board</dt><dd>${co.board}${co.tier ? ' · ' + co.tier : ''}</dd>` : ''}<dt>Class</dt><dd>${sc.days}, ${sc.time}</dd><dt>Term</dt><dd>${cl.term}</dd>${nx ? h`<dt>Next class</dt><dd>${whenText(nx)}</dd>` : ''}${t.publish ? h`<dt>Teacher</dt><dd>${t.name}</dd>` : ''}<dt>Fee</dt><dd>${money(classFee(cl))} per lesson</dd><dt>Billing</dt><dd>${e.billingPeriod === 'term' ? 'Termly' : e.billingPeriod === 'custom' ? `Custom — ${e.customLessons || customLessons(cl, e)} lessons${e.customUntil ? ' (through ' + fmtDate(e.customUntil, 'dmy') + ')' : ''}` : 'Monthly'}</dd>${e.bundleDiscountPct ? h`<dt>Multi-course discount</dt><dd>${e.bundleDiscountPct}%</dd>` : ''}${e.completedOn ? h`<dt>Completed</dt><dd>${fmtDate(e.completedOn, 'my')}</dd>` : ''}</dl>
      ${e.status === 'Awaiting Payment' ? h`<div class="alert alert-info" style="margin-top:4px">${ic('credit-card')}<span>${k.first}'s place is reserved. Pay the first invoice to confirm it and unlock access.</span></div>` : ''}
      <div class="row" style="margin-top:18px">${e.status === 'Active' ? btn('Learning Hub', '/my-mea/learning/' + e.id, 'btn-primary', 'folder') : ''}${e.status === 'Active' && t.publish ? btn('Message Teacher', '/my-mea/messages/new' + qs({ enrolment: e.id }), 'btn-outline', 'mail') : ''}${e.status === 'Awaiting Payment' ? btn('Pay Now', payLink(e), 'btn-pink', 'credit-card') : ''}${['Pending Confirmation', 'Waitlisted', 'Awaiting Payment'].includes(e.status) ? h`<button class="btn btn-danger" data-act="cancelEnrol" data-id="${e.id}">Cancel this request</button>` : ''}</div></div>
    <div class="panel"><h2><span class="l">${ic('book-open')}What ${k.first} will learn</span></h2><ul class="ticks">${co.topics.map(x => h`<li>${ic('check')}<span>${x}</span></li>`)}</ul><p style="margin-top:14px"><a href="#/courses/${co.slug}">View public course page</a></p></div></div>`
  };
}, PR);
Actions.cancelEnrol = t => openModal({ title: 'Cancel this request?', body: h`<p>This will remove the request from your account. You can request again later if places are available.</p>`, foot: h`<button class="btn btn-outline" data-act="closeModal">Keep request</button><button class="btn btn-danger" data-act="cancelEnrolYes" data-id="${t.dataset.id}">Cancel request</button>` });
Actions.cancelEnrolYes = async t => {
  const e = S.enrolments.find(x => x.id === t.dataset.id); if (!e) return;
  if (LIVE_BACKEND && e.live) {
    const r = await api('enrolments', { method: 'PATCH', body: { id: e.id, status: 'Withdrawn' } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not cancel — please try again.'); return; }
  }
  e.status = 'Withdrawn'; save(); closeModal(); toast('Request cancelled.'); go('/my-mea/courses');
};

/* ---------------- Timetable ---------------- */
R('/my-mea/timetable', (p, q, u) => {
  const sel = kidSel(u, true), today = todayISO();
  if (!UI.ttWeek) UI.ttWeek = mondayOf(today); if (!UI.ttView) UI.ttView = window.innerWidth < 800 ? 'list' : 'week';
  const mon = UI.ttWeek, sun = isoAdd(mon, 6), ev = familySessions(u, sel, mon, sun);
  const cal = (() => { const first = UI.ttWeek.slice(0, 7) + '-01', start = mondayOf(first), cells = []; for (let i = 0; i < 42; i++) cells.push(isoAdd(start, i)); const m = first.slice(0, 7);
    return h`<div class="row between" style="margin-bottom:6px"><strong>${fmtDate(first, 'my')}</strong><span class="row" style="gap:0"><button class="ibtn" data-act="ttMonth" data-d="-1" aria-label="Previous month">${ic('chevron-left')}</button><button class="ibtn" data-act="ttMonth" data-d="1" aria-label="Next month">${ic('chevron-right')}</button></span></div><table class="minical"><thead><tr>${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => h`<th scope="col">${d}</th>`)}</tr></thead><tbody>${[0, 1, 2, 3, 4, 5].map(r => h`<tr>${cells.slice(r * 7, r * 7 + 7).map(d => h`<td class="${d.slice(0, 7) !== m ? 'out' : ''} ${d === today ? 'today' : ''}"><button style="background:none;border:0;padding:0" data-act="ttGoto" data-d="${d}" aria-label="${fmtDate(d, 'long')}"><span>${+d.slice(8)}</span></button></td>`)}</tr>`)}</tbody></table>`; })();
  const legend = [...new Set(ev.map(x => grpOf(x.co.subject)))];
  let main;
  if (UI.ttView === 'week') main = weekGrid(ev, mon, today);
  else { const byDay = {}; ev.forEach(x => (byDay[x.s.date] = byDay[x.s.date] || []).push(x)); const days = Object.keys(byDay).sort();
    main = days.length ? h`<div class="daylist">${days.map(d => h`<h3>${fmtDate(d, 'long')}${d === today ? ' · Today' : ''}</h3><div class="panel list" style="padding:6px 16px">${byDay[d].map(x => h`<div class="li">${svcIcon(x.co.subject)}<div class="grow"><div class="t">${x.co.title}</div><div class="s"><strong>${x.k.first}</strong> · ${x.k.stage}${x.co.board ? ' · ' + x.co.board : ''}</div></div><div class="w">${fmtRange(x.s.start, x.s.end)}</div>${sessLink(x)}</div>`)}</div>`)}</div>` : emptyState({ icon: 'calendar', title: 'No classes this week', text: 'Use the arrows to look at other weeks, or find a new course.', action: btn('Find a Course', '/my-mea/courses/find', 'btn-primary') }); }
  return {
    title: 'Timetable', shell: 'parent', ptitle: 'Timetable', picon: 'calendar', psub: 'View all your children’s class schedule in one place', body: h`
    <div class="toolbar">${kidPicker(u, true)}<div class="field"><span class="lbl">View</span><div class="seg" role="group" aria-label="View"><button type="button" data-act="ttView" data-v="week" aria-pressed="${UI.ttView === 'week'}">${ic('calendar')}Week</button><button type="button" data-act="ttView" data-v="list" aria-pressed="${UI.ttView === 'list'}">${ic('list')}List</button></div></div>
      <div class="field"><span class="lbl">Week</span><div class="row" style="gap:6px"><button class="btn btn-outline btn-sm" data-act="ttWeek" data-d="-7" aria-label="Previous week">${ic('chevron-left')}</button><strong style="min-width:150px;text-align:center">${fmtDate(mon, 'dm')} – ${fmtDate(sun, 'dmy')}</strong><button class="btn btn-outline btn-sm" data-act="ttWeek" data-d="7" aria-label="Next week">${ic('chevron-right')}</button><button class="btn btn-primary btn-sm" data-act="ttGoto" data-d="${today}">Today</button></div></div></div>
    <div class="cols-2" style="grid-template-columns:minmax(0,1fr) 280px"><div><div style="overflow-x:auto">${main}</div><p class="small muted" style="margin-top:12px">${ic('info')} All times are UK time. Classes are online unless stated otherwise. Each class shows the child’s name.</p></div>
      <aside class="stack"><div class="panel"><h2 style="font-size:1rem">Calendar</h2>${cal}</div>${legend.length ? h`<div class="panel"><h2 style="font-size:1rem">Legend</h2><div class="legend" style="flex-direction:column;gap:6px">${legend.map(g => h`<span><i class="dot-${g}"></i>${GRP_LABEL[g]}</span>`)}</div></div>` : ''}<div class="panel" style="background:var(--yellow-50)"><h3 style="font-size:1rem">Need to change a class?</h3><p class="small muted">Contact our support team and we’ll be happy to help.</p><a class="btn btn-outline btn-sm" href="#/my-mea/support?topic=timetable">Contact Support</a></div></aside></div>`
  };
}, PR);
function weekGrid(ev, mon, today, link) {
  let minM = 15 * 60, maxM = 21 * 60; ev.forEach(x => { minM = Math.min(minM, Math.floor(toMin(x.s.start) / 60) * 60); maxM = Math.max(maxM, Math.ceil(toMin(x.s.end) / 60) * 60); });
  const PX = 1.2, H = (maxM - minM) * PX, hrs = []; for (let m = minM; m <= maxM; m += 60) hrs.push(m);
  const cols = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const d = isoAdd(mon, i), items = ev.filter(x => x.s.date === d).sort((a, b) => a.s.start.localeCompare(b.s.start)), lanes = [];
    items.forEach(x => { let l = lanes.findIndex(end => end <= toMin(x.s.start)); if (l < 0) { l = lanes.length; lanes.push(0); } lanes[l] = toMin(x.s.end); x._l = l; });
    return { d, items, n: Math.max(1, lanes.length) };
  });
  return h`<div class="wk" style="--wkh:${H}px;min-width:720px"><div class="hc"></div>${cols.map(c => h`<div class="hc ${c.d === today ? 'today' : ''}">${DS[dowOf(c.d)]}<small>${fmtDate(c.d, 'dm')}</small></div>`)}
  <div class="hrs">${hrs.map(m => h`<span style="top:${(m - minM) * PX}px">${fmtTime(String(Math.floor(m / 60)).padStart(2, '0') + ':00')}</span>`)}</div>
  ${cols.map(c => h`<div class="tcol ${c.d === today ? 'today' : ''}">${hrs.map(m => h`<i class="gl" style="top:${(m - minM) * PX}px"></i>`)}${c.items.map(x => h`<a class="ev sub-${grpOf(x.co.subject)} kc-${kidColor(kidIdx(x.k))}" style="top:${(toMin(x.s.start) - minM) * PX}px;height:${(toMin(x.s.end) - toMin(x.s.start)) * PX - 2}px;left:calc(${x._l * 100 / c.n}% + 2px);width:calc(${100 / c.n}% - 4px)" href="#${link ? link(x) : '/my-mea/timetable/session/' + x.s.id}"><b>${subj(x.co.subject).short} (${levelName(x.co.level)})</b>${x.k.first} · ${fmtRange(x.s.start, x.s.end)}</a>`)}</div>`)}</div>`;
}
Actions.ttView = t => { UI.ttView = t.dataset.v; render({ keepScroll: true }); };
Actions.ttWeek = t => { UI.ttWeek = isoAdd(UI.ttWeek, +t.dataset.d); render({ keepScroll: true }); };
Actions.ttGoto = t => { UI.ttWeek = mondayOf(t.dataset.d); render({ keepScroll: true }); };
Actions.ttMonth = t => { const d = new Date(UI.ttWeek + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + (+t.dataset.d), 1); UI.ttWeek = mondayOf(d.toISOString().slice(0, 10)); render({ keepScroll: true }); };
R('/my-mea/timetable/session/:id', (p, q, u) => {
  const s = sessionById(p.id); if (!s) return notFoundView();
  const cl = classById(s.classId), co = clsCourse(cl), e = S.enrolments.find(x => x.classId === cl.id && x.status === 'Active' && childById(x.childId).parentId === u.id);
  if (!e) return { title: 'Class', shell: 'parent', ptitle: 'Class', body: emptyState({ icon: 'lock', title: 'This class isn’t on your timetable', text: 'You can only open classes your children are enrolled in.', action: btn('Back to Timetable', '/my-mea/timetable', 'btn-primary') }) };
  const kids = S.enrolments.filter(x => x.classId === cl.id && x.status === 'Active' && childById(x.childId).parentId === u.id).map(x => childById(x.childId).first).join(', ');
  const now = ukNow(), mins = daysBetween(now.date, s.date) * 1440 + toMin(s.start) - now.min, open = mins <= 15 && (daysBetween(now.date, s.date) > -1) && !(s.date === now.date && now.min > toMin(s.end)) && s.date >= now.date;
  const t = teacherOf(cl);
  return {
    title: co.title, shell: 'parent', ptitle: co.title, psub: `${kids} · ${fmtDate(s.date, 'long')}`, body: h`<div class="panel" style="max-width:720px"><dl class="kv"><dt>Date</dt><dd>${fmtDate(s.date, 'long')}</dd><dt>Time</dt><dd>${fmtRange(s.start, s.end)} (UK time)</dd><dt>Child</dt><dd>${kids}</dd>${t.publish ? h`<dt>Teacher</dt><dd>${t.name}</dd>` : ''}<dt>Delivery</dt><dd>Live online class</dd></dl>
    <div style="margin-top:18px">${cl.meetingUrl ? (open ? h`<a class="btn btn-primary" href="${cl.meetingUrl}" target="_blank" rel="noopener noreferrer">${ic('video')}Join class<span class="sr"> (opens in a new tab)</span></a>` : h`<div class="alert alert-info">${ic('clock')}<span>The class link opens 15 minutes before the start time.</span></div>`) : h`<div class="alert alert-info">${ic('info')}<span>Your teacher will add the class link here before the lesson.</span></div>`}</div>
    <div class="row" style="margin-top:18px">${btn('Back to Timetable', '/my-mea/timetable', 'btn-outline')}${btn('Learning Hub', '/my-mea/learning/' + e.id, 'btn-ghost', 'folder')}${btn('Contact Support', '/my-mea/support?topic=timetable', 'btn-ghost')}</div></div>`
  };
}, PR);
