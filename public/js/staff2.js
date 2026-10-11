'use strict';
/* =====================================================================
   MEA – admin portal (single source of truth for classes, enrolments, content)
   ===================================================================== */
const AR = { role: ['admin'] };
const pname = id => (userById(id) || { name: '–' }).name;
function adminPage(title, icon, sub, body) { return { title, shell: 'admin', ptitle: title, picon: icon, psub: sub, body }; }
const searchBox = (id, val, on, ph) => h`<div class="field" style="min-width:260px"><label class="sr" for="${id}">${ph}</label><input class="inp" id="${id}" type="search" placeholder="${ph}" value="${val || ''}" data-on="${on}"></div>`;

/* ---- dashboard ---- */
R('/admin', (p, q, u) => {
  const active = new Set(S.enrolments.filter(e => e.status === 'Active').map(e => e.childId)), pend = S.enrolments.filter(e => e.status === 'Pending Confirmation'), wl = S.enrolments.filter(e => e.status === 'Waitlisted');
  const full = S.classes.filter(c => avail(c).k === 'full'), newQ = S.enquiries.filter(e => e.status === 'New'), recent = [...S.resources].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const tile = (i, c, n, l, href) => h`<a class="sum" href="#${href}" style="text-decoration:none;color:inherit"><span class="ico c-${c}">${ic(i)}</span><div><div class="val">${n}</div><div class="lab">${l}</div></div></a>`;
  const bySys = Object.values(SYS).map(s => ({ s, n: S.enrolments.filter(e => e.status === 'Active' && clsCourse(classById(e.classId)).sys === s.id).length }));
  return adminPage('Admin dashboard', 'home', 'Operations overview', h`<div class="sumcards">${tile('users', 'blue', active.size, 'Active students', '/admin/families')}${tile('check-square', 'yellow', pend.length, 'Pending enrolments', '/admin/enrolments?status=Pending Confirmation')}${tile('calendar', 'green', S.classes.length, 'Classes', '/admin/classes')}${tile('clock', 'purple', wl.length, 'Waitlisted', '/admin/enrolments?status=Waitlisted')}</div>
  <div class="cols-2b"><section class="panel"><h2><span class="l">${ic('alert-triangle')}Alerts</span></h2>${[...(pend.length ? [`${plural(pend.length, 'enrolment request')} need confirming`] : []), ...(newQ.length ? [`${plural(newQ.length, 'new support enquiry', 'new support enquiries')}`] : []), ...full.map(c => `${clsCourse(c).title} is full${S.enrolments.some(e => e.classId === c.id && e.status === 'Waitlisted') ? ' with a waitlist' : ''}`)].map(a => h`<div class="alert alert-warn" style="margin-bottom:8px">${ic('alert-triangle')}<span>${a}</span></div>`)}${!pend.length && !newQ.length && !full.length ? raw('<p class="muted">No alerts.</p>') : ''}</section>
  <div class="stack"><section class="panel"><h2><span class="l">${ic('globe')}Active enrolments by system</span></h2>${bySys.map(b => h`<div class="li"><div class="grow">${b.s.short}</div><strong>${b.n}</strong></div>`)}</section><section class="panel"><h2><span class="l">${ic('folder')}Recent resources</span></h2><div class="list">${recent.map(r => h`<div class="li"><div class="grow"><div class="t">${r.title}</div><div class="s">${clsCourse(classById(r.classId)).title}</div></div><div class="w small">${ago(r.date)}</div></div>`)}</div></section></div></div>`);
}, AR);

/* ---- enrolments ---- */
R('/admin/enrolments', (p, q, u) => {
  const st = q.status || '', term = (UI.aeq || '').toLowerCase();
  const list = S.enrolments.filter(e => (!st || e.status === st) && childById(e.childId)).map(e => ({ e, k: childById(e.childId), cl: classById(e.classId) })).filter(x => !term || (x.k.first + ' ' + x.k.last + ' ' + clsCourse(x.cl).title + ' ' + pname(x.k.parentId)).toLowerCase().includes(term)).sort((a, b) => b.e.created.localeCompare(a.e.created)).slice(0, 60);
  return adminPage('Enrolments', 'check-square', 'Approve, decline, withdraw, move class and manage the waitlist', h`
  <div class="toolbar"><div class="pills" role="group" aria-label="Filter by status">${['', 'Pending Confirmation', 'Waitlisted', 'Active', 'Completed', 'Withdrawn', 'Declined'].map(s => h`<button class="pill" data-act="aeStatus" data-s="${s}" aria-pressed="${st === s}">${s || 'All'}</button>`)}</div><div class="grow"></div>${LIVE_BACKEND ? h`<button class="btn btn-outline btn-sm" data-act="aeRefresh">${ic('refresh')}Refresh</button>` : ''}${searchBox('aeq', UI.aeq, 'aeSearch', 'Search child, parent or course')}</div>
  ${tableHTML(['Child', 'Parent', 'Course', 'Class time', 'Requested', 'Status', ''], list.map(({ e, k, cl }) => h`<tr>${td('Child', h`<strong>${k.first} ${k.last}</strong><br><span class="small muted">${k.stage}</span>`)}${td('Parent', pname(k.parentId))}${td('Course', clsCourse(cl).title)}${td('Class time', schedText(cl).short)}${td('Requested', fmtDate(e.created, 'dm'))}${td('Status', statusChip(e.status))}${td('', h`<div class="row" style="gap:6px;justify-content:flex-end">${e.status === 'Pending Confirmation' ? h`<button class="btn btn-primary btn-sm" data-act="aeSet" data-id="${e.id}" data-s="Active">Approve</button><button class="btn btn-danger btn-sm" data-act="aeSet" data-id="${e.id}" data-s="Declined">Decline</button>` : ''}${e.status === 'Waitlisted' ? h`<button class="btn btn-primary btn-sm" data-act="aeSet" data-id="${e.id}" data-s="Active">Offer place</button>` : ''}${['Active', 'Pending Confirmation', 'Waitlisted'].includes(e.status) ? h`<button class="btn btn-outline btn-sm" data-act="aeMove" data-id="${e.id}">Move</button>` : ''}${e.status === 'Active' ? h`<button class="btn btn-outline btn-sm" data-act="aeSet" data-id="${e.id}" data-s="Withdrawn">Withdraw</button>` : ''}</div>`, 'act')}</tr>`), { empty: 'No enrolments match.' })}<p class="form-note">Showing the latest ${list.length}. Filter or search to narrow down.${LIVE_BACKEND ? ' New requests from families elsewhere won\u2019t appear automatically \u2014 use Refresh to check for them.' : ''}</p>`);
}, AR);
Actions.aeRefresh = async () => { toast('Checking for new requests…'); await mirrorDirectory(me()); await mirrorEnrolments(me()); render({ keepScroll: true }); toast('Up to date.'); };
Actions.aeStatus = t => setQuery({ status: t.dataset.s });
Changes.aeSearch = el => { UI.aeq = el.value; render({ keepScroll: true }); };
Actions.aeSet = async t => {
  const e = S.enrolments.find(x => x.id === t.dataset.id), cl = classById(e.classId), co = clsCourse(cl), k = childById(e.childId), s = t.dataset.s;
  if (s === 'Active' && seatsLeft(cl) === 0 && e.status !== 'Pending Confirmation') { toast('This class is full. Increase the capacity first.'); return; }
  if (s === 'Active' && e.status === 'Pending Confirmation' && filledCount(cl) > cl.capacity) { toast('This class is over capacity.'); return; }
  if (LIVE_BACKEND && e.live) {
    const r = await api('enrolments', { method: 'PATCH', body: { id: e.id, status: s } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not update — please try again.'); return; }
  }
  e.status = s; const txt = s === 'Active' ? `Enrolment confirmed: ${k.first} is now enrolled in ${co.title}.` : s === 'Declined' ? `Your enrolment request for ${co.title} (${k.first}) could not be accepted. Please contact support.` : `${k.first} has been withdrawn from ${co.title}.`;
  if (!k.synthetic) addNotif(k.parentId, 'Enrolments', k.id, txt, '/my-mea/courses'); save(); toast('Enrolment updated: ' + s); render({ keepScroll: true });
};
Actions.aeMove = t => {
  const e = S.enrolments.find(x => x.id === t.dataset.id), co = clsCourse(classById(e.classId)), opts = S.classes.filter(c => clsCourse(c).level === co.level && clsCourse(c).sys === co.sys && c.id !== e.classId);
  openModal({ title: 'Move to another class', body: h`<p>Choose a class at the same level.</p><div class="field"><label for="mv">New class</label><select class="sel" id="mv">${opts.map(c => h`<option value="${c.id}">${clsCourse(c).title} · ${schedText(c).short}</option>`)}</select></div>`, foot: h`<button class="btn btn-outline" data-act="closeModal">Cancel</button><button class="btn btn-primary" data-act="aeMoveGo" data-id="${e.id}">Move</button>` });
};
Actions.aeMoveGo = async t => {
  const e = S.enrolments.find(x => x.id === t.dataset.id), newClassId = $('#mv').value;
  if (LIVE_BACKEND && e.live) {
    const r = await api('enrolments', { method: 'PATCH', body: { id: e.id, classId: newClassId } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not move — please try again.'); return; }
  }
  e.classId = newClassId; save(); closeModal(); toast('Moved to the new class.'); render({ keepScroll: true });
};

/* ---- classes ---- */
function classForm(cl) {
  const c = cl || { courseId: S.courses[0].id, teacherId: TEACHERS[0].id, days: [{ d: 2, start: '17:00', end: '18:00' }], capacity: 8, meetingUrl: '', feeOverride: '', enrolOpen: true, status: 'Running' };
  return h`<form data-form="classForm" data-id="${cl ? cl.id : ''}" novalidate><div class="form-grid">
    ${cl ? '' : fld({ name: 'course', label: 'Course', type: 'select', req: 1, value: c.courseId, options: S.courses.map(x => [x.id, x.title]), full: 1 })}
    ${fld({ name: 'teacher', label: 'Teacher', type: 'select', req: 1, value: c.teacherId, options: S.users.filter(x => x.role === 'teacher').map(x => [x.id, x.name]) })}${fld({ name: 'capacity', label: 'Capacity', type: 'number', req: 1, value: c.capacity, attrs: 'min="1" max="30"' })}
    ${cl ? '' : h`${fld({ name: 'day', label: 'Day', type: 'select', req: 1, value: 2, options: [1, 2, 3, 4, 5, 6, 0].map(d => [d, DAYS[d]]) })}${fld({ name: 'start', label: 'Start time', type: 'time', req: 1, value: '17:00' })}${fld({ name: 'end', label: 'End time', type: 'time', req: 1, value: '18:00' })}`}
    ${fld({ name: 'fee', label: 'Fee override (£/lesson)', type: 'number', value: c.feeOverride ?? '', hint: 'Leave blank to use the course fee.', attrs: 'min="0" step="1"' })}${fld({ name: 'meeting', label: 'Class meeting link', type: 'url', value: c.meetingUrl, ph: 'https://…', hint: 'Zoom or Google Meet. Shown to enrolled families only.' })}
    ${fld({ name: 'status', label: 'Status', type: 'select', value: c.status, options: ['Running', 'Paused', 'Ended'] })}${fld({ name: 'open', label: 'Enrolment', type: 'select', value: c.enrolOpen ? 'open' : 'closed', options: [['open', 'Open'], ['closed', 'Closed']] })}</div>
    <div class="row" style="margin-top:16px;justify-content:flex-end"><button type="button" class="btn btn-outline" data-act="closeModal">Cancel</button><button class="btn btn-primary" type="submit">${cl ? 'Save class' : 'Create class'}</button></div></form>`;
}
R('/admin/classes', (p, q, u) => {
  const term = (UI.acq || '').toLowerCase(), list = S.classes.filter(c => !term || (clsCourse(c).title + pname(c.teacherId)).toLowerCase().includes(term));
  return adminPage('Classes', 'calendar', 'A class is a scheduled delivery of a course. Changes here update the public timetable and every family timetable.', h`<div class="toolbar">${searchBox('acq', UI.acq, 'acSearch', 'Search class or teacher')}<div class="grow"></div><button class="btn btn-pink" data-act="acNew">${ic('plus')}New class</button></div>
  ${tableHTML(['Course', 'Teacher', 'Schedule', 'Seats', 'Enrolment', ''], list.map(c => { const a = avail(c); return h`<tr>${td('Course', h`<strong>${clsCourse(c).title}</strong>`)}${td('Teacher', pname(c.teacherId))}${td('Schedule', schedText(c).short)}${td('Seats', `${filledCount(c)} / ${c.capacity}`)}${td('Enrolment', chip(a.label, a.cls, a.icon))}${td('', h`<button class="btn btn-outline btn-sm" data-act="acEdit" data-id="${c.id}">Edit</button>`, 'act')}</tr>`; }), { empty: 'No classes match.' })}`);
}, AR);
Changes.acSearch = el => { UI.acq = el.value; render({ keepScroll: true }); };
Actions.acNew = () => openModal({ title: 'New class', body: classForm(null) });
Actions.acEdit = t => openModal({ title: 'Edit class', body: classForm(classById(t.dataset.id)) });
Forms.classForm = async (f, v) => {
  const e = {}; if (!v.capacity || +v.capacity < 1) e.capacity = 'Enter a capacity of at least 1.'; if (v.meeting && !/^https:\/\//i.test(v.meeting)) e.meeting = 'Enter a full link starting with https://';
  if (!f.dataset.id && v.start >= v.end) e.end = 'End time must be after the start time.'; if (!showErrors(f, e)) return;
  if (f.dataset.id) {
    const c = classById(f.dataset.id), patch = { teacherId: v.teacher, capacity: +v.capacity, feeOverride: v.fee === '' ? null : +v.fee, meetingUrl: v.meeting, status: v.status, enrolOpen: v.open === 'open' };
    if (LIVE_BACKEND) { const r = await api('classes', { method: 'PATCH', body: { id: c.id, ...patch } }); if (!r.ok) { toast((r.data && r.data.error) || 'Could not save — please try again.'); return; } }
    Object.assign(c, patch);
  } else {
    const row = { id: uid('cl'), courseId: v.course, teacherId: v.teacher, days: [{ d: +v.day, start: v.start, end: v.end }], term: S.term.name, startDate: S.term.start, endDate: S.term.end, capacity: +v.capacity, meetingUrl: v.meeting, feeOverride: v.fee === '' ? null : +v.fee, enrolOpen: v.open === 'open', status: v.status };
    if (LIVE_BACKEND) { const r = await api('classes', { method: 'POST', body: row }); if (!r.ok) { toast((r.data && r.data.error) || 'Could not save — please try again.'); return; } row.id = r.data.class.id; }
    S.classes.push(row);
  }
  save(); closeModal(); toast('Class saved. Public and family timetables now show the change.'); render({ keepScroll: true });
};

/* ---- courses ---- */
function courseForm(c) {
  const x = c || { title: '', sys: 'eng', level: 'gcse', subject: 'maths', board: '', tier: '', fee: 150, desc: '', active: true };
  return h`<form data-form="courseForm" data-id="${c ? c.id : ''}" novalidate><div class="form-grid">${fld({ name: 'title', label: 'Course title', req: 1, value: x.title, full: 1 })}
    ${c ? '' : h`${fld({ name: 'sys', label: 'Education system', type: 'select', value: x.sys, options: Object.values(SYS).map(s => [s.id, s.short]) })}${fld({ name: 'level', label: 'Level', type: 'select', value: x.level, options: Object.values(SYS).flatMap(s => s.levels.map(l => [l.id, `${l.name} (${s.id === 'sco' ? 'Scotland' : 'England/Wales/NI'})`])) })}${fld({ name: 'subject', label: 'Subject', type: 'select', value: x.subject, options: SUBJECTS.map(s => [s.id, s.name]) })}${fld({ name: 'board', label: 'Exam board', value: x.board, hint: 'Leave blank if not applicable.' })}`}
    ${fld({ name: 'fee', label: 'Default fee (£/lesson)', type: 'number', req: 1, value: x.fee, attrs: 'min="0"' })}${fld({ name: 'active', label: 'Visibility', type: 'select', value: x.active ? '1' : '0', options: [['1', 'Active (public)'], ['0', 'Hidden']] })}${fld({ name: 'desc', label: 'Public description', type: 'textarea', rows: 3, value: x.desc, full: 1 })}</div>
    <div class="row" style="margin-top:16px;justify-content:flex-end"><button type="button" class="btn btn-outline" data-act="closeModal">Cancel</button><button class="btn btn-primary" type="submit">Save course</button></div></form>`;
}
R('/admin/courses', (p, q, u) => adminPage('Courses', 'book-open', 'The course catalogue: what MEA offers', h`<div class="toolbar"><div class="grow"></div><button class="btn btn-pink" data-act="coNew">${ic('plus')}New course</button></div>
  ${tableHTML(['Course', 'System', 'Level', 'Fee', 'Visibility', ''], S.courses.map(c => h`<tr>${td('Course', h`<strong>${c.title}</strong>`)}${td('System', SYS[c.sys].short)}${td('Level', levelName(c.level))}${td('Fee', money(c.fee) + ' / lesson')}${td('Visibility', chip(c.active ? 'Active' : 'Hidden', c.active ? 'chip-green' : 'chip-grey'))}${td('', h`<button class="btn btn-outline btn-sm" data-act="coEdit" data-id="${c.id}">Edit</button>`, 'act')}</tr>`))}
  <section class="panel" style="margin-top:22px"><h2><span class="l">${ic('settings')}Levels and subjects offered</span></h2><p class="muted">Switch off anything MEA is not currently teaching. It disappears from the public site and Course Finder.</p><div class="grid g2"><div>${Object.values(SYS).map(s => h`<h3 style="font-size:1rem">${s.short}</h3>${s.levels.map(l => h`<label class="check" style="padding:6px 0"><input type="checkbox" data-on="toggleOff" data-kind="levels" data-id="${l.id}" ${isOff('levels', l.id) ? '' : raw('checked')}><span>${l.name}</span></label>`)}`)}</div><div><h3 style="font-size:1rem">Subjects</h3>${SUBJECTS.map(s => h`<label class="check" style="padding:6px 0"><input type="checkbox" data-on="toggleOff" data-kind="subjects" data-id="${s.id}" ${isOff('subjects', s.id) ? '' : raw('checked')}><span>${s.name}</span></label>`)}</div></div></section>`), AR);
Changes.toggleOff = el => { const a = S.off[el.dataset.kind], id = el.dataset.id, i = a.indexOf(id); if (el.checked && i >= 0) a.splice(i, 1); if (!el.checked && i < 0) a.push(id); save(); toast('Saved. The public site has been updated.'); };
Actions.coNew = () => openModal({ title: 'New course', body: courseForm(null) });
Actions.coEdit = t => openModal({ title: 'Edit course', body: courseForm(courseById(t.dataset.id)) });
Forms.courseForm = async (f, v) => {
  const e = {}; if (!v.title) e.title = 'Enter a course title.'; if (v.fee === '' || +v.fee < 0) e.fee = 'Enter a fee.'; if (!showErrors(f, e)) return;
  if (f.dataset.id) {
    const patch = { title: v.title, fee: +v.fee, desc: v.desc, active: v.active === '1' };
    if (LIVE_BACKEND) { const r = await api('courses', { method: 'PATCH', body: { id: f.dataset.id, ...patch } }); if (!r.ok) { toast((r.data && r.data.error) || 'Could not save — please try again.'); return; } }
    Object.assign(courseById(f.dataset.id), patch);
  } else {
    const lv = levelInfo(v.level);
    const row = { id: uid('c'), slug: slugify(v.title) + '-' + Math.random().toString(36).slice(2, 5), title: v.title, sys: lv.sys, level: v.level, subject: v.subject, board: v.board, tier: '', desc: v.desc || 'Course description coming soon.', audience: `Students in ${lv.years.join(', ')} (ages ${lv.ages}).`, topics: topicsFor(v.subject, v.level), fee: +v.fee, trial: false, active: v.active === '1', needs: 'A device with a camera and microphone, a stable internet connection, pen and paper.' };
    if (LIVE_BACKEND) { const r = await api('courses', { method: 'POST', body: row }); if (!r.ok) { toast((r.data && r.data.error) || 'Could not save — please try again.'); return; } row.id = r.data.course.id; row.slug = r.data.course.slug; }
    S.courses.push(row);
  }
  save(); closeModal(); toast('Course saved.'); render({ keepScroll: true });
};

/* ---- teachers ---- */
/* Teacher subjects, levels and exam boards are picked from fixed lists
   (held multi-select, so admins choose rather than type free text), while
   qualifications stays a plain text field as before. */
const ALL_SUBJECT_NAMES = () => SUBJECTS.map(s => s.name);
const ALL_LEVEL_NAMES = () => [...new Set(Object.values(SYS).flatMap(s => s.levels.map(l => l.name)))];
const ALL_BOARD_NAMES = () => [...new Set(Object.values(SYS).flatMap(s => s.boards))];
function teacherForm(t) {
  return h`<form data-form="teacherForm" data-id="${t ? t.id : ''}" novalidate><div class="form-grid">
    ${t ? '' : h`${fld({ name: 'name', label: 'Full name', req: 1, full: 1 })}${fld({ name: 'email', label: 'Email address', type: 'email', req: 1 })}${fld({ name: 'password', label: 'Password', type: 'password', req: 1, full: 1, hint: 'At least 8 characters, including a number. Share this with the teacher yourself — there is no self-service sign-up for staff.' })}`}
    ${multiSelectField({ name: 'subjects', label: 'Subjects', value: t ? t.subjects : '', options: ALL_SUBJECT_NAMES(), hint: 'Ctrl/Cmd-click (or tap each) to select more than one.' })}${multiSelectField({ name: 'levels', label: 'Levels taught', value: t ? t.levels : '', options: ALL_LEVEL_NAMES() })}${multiSelectField({ name: 'boards', label: 'Exam boards', value: t ? t.boards : '', options: ALL_BOARD_NAMES(), size: 4 })}
    ${fld({ name: 'qual', label: 'Qualifications', value: t ? t.qual : '', ph: 'e.g. BSc Mathematics, PGCE' })}${fld({ name: 'bio', label: 'Short bio', type: 'textarea', rows: 2, value: t ? t.bio : '', full: 1 })}</div>
    <div class="row" style="margin-top:16px;justify-content:flex-end"><button type="button" class="btn btn-outline" data-act="closeModal">Cancel</button><button class="btn btn-primary" type="submit">${t ? 'Save teacher' : 'Create teacher account'}</button></div></form>`;
}
R('/admin/teachers', (p, q, u) => {
  const term = (UI.atq || '').toLowerCase();
  const teachers = S.users.filter(x => x.role === 'teacher' && (!term || (x.name + ' ' + (x.subjects || '')).toLowerCase().includes(term)));
  return adminPage('Teachers', 'graduation-cap', 'Every teacher, their classes and their students, in one place', h`
  <div class="toolbar">${searchBox('atq', UI.atq, 'atSearch', 'Search teacher or subject')}<div class="grow"></div>${LIVE_BACKEND ? h`<button class="btn btn-pink" data-act="atNew">${ic('plus')}Add teacher</button>` : h`<span class="small muted">Connect the live backend to create real teacher sign-in accounts.</span>`}</div>
  ${tableHTML(['Teacher', 'Subjects', 'Levels', 'Classes', 'Students', 'Published', ''], teachers.map(t => {
    const classes = S.classes.filter(c => c.teacherId === t.id);
    const students = new Set(classes.flatMap(c => S.enrolments.filter(e => e.classId === c.id && ['Active', 'Pending Confirmation'].includes(e.status)).map(e => e.childId))).size;
    return h`<tr>${td('Teacher', h`<strong>${t.name}</strong><br><span class="small muted">${t.live ? t.email : 'Sample profile (About page)'}</span>`)}${td('Subjects', t.subjects || '–')}${td('Levels', t.levels || '–')}${td('Classes', classes.length)}${td('Students', students)}${td('Published', h`<span class="sw"><input type="checkbox" data-on="toggleTeacher" data-id="${t.id}" ${t.publish ? raw('checked') : ''} aria-label="Published: ${t.name}"><span></span></span>`)}${td('', h`<div class="row" style="gap:6px;justify-content:flex-end"><button class="btn btn-outline btn-sm" data-act="atView" data-id="${t.id}">Manage</button>${t.live ? h`<button class="btn btn-danger btn-sm" data-act="atDel" data-id="${t.id}">Remove</button>` : ''}</div>`, 'act')}</tr>`;
  }), { empty: 'No teachers match.' })}`);
}, AR);
Changes.atSearch = el => { UI.atq = el.value; render({ keepScroll: true }); };
Actions.atNew = () => openModal({ title: 'Add teacher', body: teacherForm(null) });
Actions.atEdit = t => openModal({ title: 'Edit teacher', body: teacherForm(userById(t.dataset.id)) });
Forms.teacherForm = async (f, v) => {
  if (f.dataset.id) {
    const patch = { subjects: v.subjects, levels: v.levels, boards: v.boards, qual: v.qual, bio: v.bio };
    if (LIVE_BACKEND) { const r = await api('teachers', { method: 'PATCH', body: { id: f.dataset.id, ...patch } }); if (!r.ok) { toast((r.data && r.data.error) || 'Could not save — please try again.'); return; } }
    Object.assign(userById(f.dataset.id), patch); save(); closeModal(); toast('Teacher saved.'); render({ keepScroll: true });
    return;
  }
  const e = {}; if (!v.name) e.name = 'Enter the teacher’s name.'; if (!isEmail(v.email)) e.email = 'Enter a valid email address.';
  if (v.password.length < 8 || !/\d/.test(v.password)) e.password = 'Use at least 8 characters, including a number.';
  if (!showErrors(f, e)) return;
  const r = await api('teachers', { method: 'POST', body: { name: v.name, email: v.email, password: v.password, subjects: v.subjects, levels: v.levels, boards: v.boards, qual: v.qual, bio: v.bio } });
  if (!r.ok) { showErrors(f, { [(r.data && r.data.field) || 'email']: (r.data && r.data.error) || 'Could not create the account — please try again.' }); return; }
  const t = r.data.teacher;
  S.users.push({ id: t.id, role: 'teacher', name: t.name, email: t.email, subjects: t.subjects, levels: t.levels, boards: t.boards, qual: t.qual, bio: t.bio, publish: false, notify: { email: true, messages: true, reminders: true, announcements: true }, created: todayISO(), live: true });
  save(); closeModal(); toast(`Teacher account created for ${t.name}.`); render({ keepScroll: true });
};
Actions.atDel = t => {
  const te = userById(t.dataset.id), classes = S.classes.filter(c => c.teacherId === te.id);
  openModal({ title: 'Remove teacher', body: h`<p>Remove <strong>${te.name}</strong>? ${classes.length ? `${plural(classes.length, 'class', 'classes')} assigned to them will be left without a teacher — reassign ${classes.length > 1 ? 'them' : 'it'} in Admin → Classes.` : ''} This can’t be undone.</p>`, foot: h`<button class="btn btn-outline" data-act="closeModal">Cancel</button><button class="btn btn-danger" data-act="atDelGo" data-id="${te.id}">Remove teacher</button>` });
};
Actions.atDelGo = async t => {
  const id = t.dataset.id;
  if (LIVE_BACKEND) { const r = await api('teachers', { method: 'DELETE', body: { id } }); if (!r.ok) { toast((r.data && r.data.error) || 'Could not remove — please try again.'); return; } }
  S.classes.filter(c => c.teacherId === id).forEach(c => c.teacherId = '');
  S.users = S.users.filter(x => x.id !== id);
  save(); closeModal(); toast('Teacher removed.'); render({ keepScroll: true });
};
Actions.atView = t => {
  const te = userById(t.dataset.id), classes = S.classes.filter(c => c.teacherId === te.id);
  const rosterRow = cl => { const roster = S.enrolments.filter(e => e.classId === cl.id && ['Active', 'Pending Confirmation'].includes(e.status)).map(e => childById(e.childId)).filter(Boolean);
    return h`<div class="li" style="align-items:flex-start"><div class="grow"><div class="t">${clsCourse(cl).title}</div><div class="s">${schedText(cl).short} · ${filledCount(cl)}/${cl.capacity} seats</div>${roster.length ? h`<div class="chips" style="margin-top:6px">${roster.map(k => chip(k.first + ' ' + k.last, 'chip-grey'))}</div>` : h`<div class="small muted" style="margin-top:4px">No students yet.</div>`}</div><button class="btn btn-outline btn-sm" data-act="atAddStudent" data-class="${cl.id}">${ic('user-plus')}Add student</button></div>`; };
  openModal({ title: te.name, body: h`<div class="stack"><p class="small muted" style="margin:0">${te.subjects || ''}${te.levels ? ' · ' + te.levels : ''}</p>
  ${classes.length ? h`<div class="list">${classes.map(rosterRow)}</div>` : emptyState({ icon: 'calendar', title: 'No classes assigned', text: 'Assign this teacher to a class in Admin → Classes.' })}</div>`, foot: h`<button class="btn btn-outline" data-act="atEdit" data-id="${te.id}">Edit profile</button><button class="btn btn-primary" data-act="closeModal">Close</button>` });
};
Actions.atAddStudent = t => {
  const classId = t.dataset.class, cl = classById(classId);
  const already = new Set(S.enrolments.filter(e => e.classId === classId && ['Active', 'Pending Confirmation', 'Waitlisted'].includes(e.status)).map(e => e.childId));
  const kids = S.children.filter(k => !already.has(k.id));
  openModal({ title: 'Add student to ' + clsCourse(cl).title, body: kids.length ? h`<div class="field"><label for="asKid">Student</label><select class="sel" id="asKid">${kids.map(k => h`<option value="${k.id}">${k.first} ${k.last} (${k.stage}) · ${pname(k.parentId)}</option>`)}</select></div><p class="small muted" style="margin-top:8px">${filledCount(cl)}/${cl.capacity} seats filled. The student is enrolled immediately as Active.</p>` : h`<p>Every known student is already in this class.</p>`, foot: h`<button class="btn btn-outline" data-act="closeModal">Cancel</button>${kids.length ? h`<button class="btn btn-primary" data-act="atAddStudentGo" data-class="${classId}">Add student</button>` : ''}` });
};
Actions.atAddStudentGo = async t => {
  const classId = t.dataset.class, childId = $('#asKid').value, cl = classById(classId), co = clsCourse(cl), k = childById(childId);
  if (!childId) { toast('Choose a student first.'); return; }
  if (seatsLeft(cl) <= 0) { toast('This class is full. Increase its capacity first.'); return; }
  let id = uid('en');
  if (LIVE_BACKEND) { const r = await api('enrolments', { method: 'POST', body: { childId, classId } }); if (!r.ok) { toast((r.data && r.data.error) || 'Could not add — please try again.'); return; } id = r.data.enrolment.id; }
  S.enrolments.push({ id, childId, classId, status: 'Active', created: todayISO() });
  if (!k.synthetic) addNotif(k.parentId, 'Enrolments', k.id, `Enrolment confirmed: ${k.first} is now enrolled in ${co.title}.`, '/my-mea/courses');
  save(); closeModal(); toast(`${k.first} added to ${co.title}.`); render({ keepScroll: true });
};

/* ---- families ---- */
R('/admin/families', (p, q, u) => {
  const tab = q.tab || 'parents', term = (UI.afq || '').toLowerCase();
  const parents = S.users.filter(x => x.role === 'parent' && (!term || (x.name + x.email).toLowerCase().includes(term))).slice(0, 30);
  const kids = S.children.filter(k => !term || (k.first + ' ' + k.last).toLowerCase().includes(term)).slice(0, 30);
  return adminPage('Parents & Children', 'users', 'Search accounts and child profiles', h`<div class="toolbar"><div class="tabs" style="margin:0;border:0"><a href="#/admin/families?tab=parents" ${tab === 'parents' ? raw('aria-current="page"') : ''}>Parents</a><a href="#/admin/families?tab=children" ${tab === 'children' ? raw('aria-current="page"') : ''}>Children</a></div><div class="grow"></div>${LIVE_BACKEND ? h`<button class="btn btn-outline btn-sm" data-act="famRefresh">${ic('refresh')}Refresh</button>` : ''}${searchBox('afq', UI.afq, 'afSearch', 'Search by name or email')}</div>
  ${tab === 'parents' ? tableHTML(['Parent', 'Email', 'Phone', 'Children', 'Verified'], parents.map(x => h`<tr>${td('Parent', h`<strong>${x.name}</strong>`)}${td('Email', x.email)}${td('Phone', x.phone || '–')}${td('Children', childrenOf(x.id).length)}${td('Verified', chip(x.verified ? 'Verified' : 'Not verified', x.verified ? 'chip-green' : 'chip-yellow'))}</tr>`), { plain: true }) : tableHTML(['Child', 'Stage', 'System', 'Parent', 'Courses'], kids.map(k => h`<tr>${td('Child', h`<strong>${k.first} ${k.last}</strong>`)}${td('Stage', k.stage)}${td('System', SYS[k.sys].short)}${td('Parent', pname(k.parentId))}${td('Courses', courseCount(k))}</tr>`), { plain: true })}<p class="form-note">Showing up to 30 matches. Search to narrow down.${LIVE_BACKEND ? ' New sign-ups elsewhere won\u2019t appear automatically \u2014 use Refresh to check for them.' : ''}</p>`);
}, AR);
Actions.famRefresh = async () => { toast('Checking for new families…'); await mirrorDirectory(me()); render({ keepScroll: true }); toast('Up to date.'); };
Changes.afSearch = el => { UI.afq = el.value; render({ keepScroll: true }); };

/* ---- resources ---- */
R('/admin/resources', (p, q, u) => {
  const rs = [...S.resources].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25), cls = S.classes;
  return adminPage('Learning Resources', 'folder', 'Resource records connected to class and week', h`<section class="panel" style="margin-bottom:20px"><h2>Add a resource</h2><form data-form="adminRes" novalidate><div class="form-grid">${fld({ name: 'class', label: 'Class', type: 'select', req: 1, options: cls.map(c => [c.id, clsCourse(c).title]), full: 1 })}${fld({ name: 'week', label: 'Week', type: 'select', value: weekOf(todayISO()), options: Array.from({ length: 16 }, (_, i) => [i + 1, 'Week ' + (i + 1)]) })}${fld({ name: 'type', label: 'Type', type: 'select', options: ['Lesson slides', 'Worksheet', 'Worked examples', 'Answer sheet', 'Revision guide', 'Video'] })}${fld({ name: 'title', label: 'Title', req: 1, full: 1 })}${fld({ name: 'link', label: 'Google Drive link', type: 'url', req: 1, full: 1, ph: 'https://drive.google.com/…' })}</div><button class="btn btn-primary" type="submit" style="margin-top:14px">Publish</button></form></section>
  ${tableHTML(['Class', 'Week', 'Title', 'Type', 'Date'], rs.map(r => h`<tr>${td('Class', clsCourse(classById(r.classId)).title)}${td('Week', r.week)}${td('Title', r.title)}${td('Type', r.type)}${td('Date', fmtDate(r.date, 'dmy'))}</tr>`), { plain: true })}`);
}, AR);
Forms.adminRes = (f, v) => {
  const e = {}; if (!v.title) e.title = 'Enter a clear title.'; if (!/^https:\/\//i.test(v.link)) e.link = 'Paste a full link starting with https://'; if (!showErrors(f, e)) return;
  const cl = classById(v.class), id = uid('r'), co = clsCourse(cl); S.resources.push({ id, classId: cl.id, week: +v.week, topic: co.topics[(+v.week - 1) % co.topics.length], title: v.title, type: v.type, date: todayISO(), link: v.link });
  notifyClassParents(cl, 'Classes', `New lesson resource: ${v.title} (${co.title}).`, '/my-mea/learning/resource/' + id); save(); toast('Published.'); render({ keepScroll: true });
};

/* ---- announcements ---- */
R('/admin/announcements', (p, q, u) => {
  const an = S.announcements.filter(a => a.scope === 'site').sort((a, b) => b.date.localeCompare(a.date));
  return adminPage('Announcements', 'megaphone', 'Site-wide notices and portal announcements', h`<div class="cols-2b"><section class="panel"><h2>Homepage notice</h2><form data-form="siteNotice" novalidate class="stack">${fld({ name: 'notice', label: 'Notice text', value: S.siteNotice, hint: 'Shown at the top of the homepage. Leave blank to hide.' })}<button class="btn btn-primary" type="submit">Save notice</button></form></section>
  <section class="panel"><h2>Post a portal announcement</h2><form data-form="siteAnn" novalidate class="stack">${fld({ name: 'title', label: 'Title', req: 1 })}${fld({ name: 'body', label: 'Message', type: 'textarea', rows: 3, req: 1 })}<button class="btn btn-primary" type="submit">Post to all families</button></form></section></div>
  <section class="panel" style="margin-top:20px"><h2>Site-wide announcements</h2><div class="list">${an.map(a => h`<div class="li"><div class="grow"><div class="t">${a.title}</div><div class="s">${a.body}</div></div><div class="w small">${fmtDate(a.date, 'dm')}</div></div>`)}</div></section>`);
}, AR);
Forms.siteNotice = (f, v) => { S.siteNotice = v.notice; save(); toast('Homepage notice saved.'); };
Forms.siteAnn = (f, v) => {
  const e = {}; if (!v.title) e.title = 'Enter a title.'; if (!v.body) e.body = 'Write the announcement.'; if (!showErrors(f, e)) return;
  S.announcements.push({ id: uid('an'), scope: 'site', classId: '', title: v.title, body: v.body, date: todayISO(), by: me().id });
  S.users.filter(x => x.role === 'parent' && !x.synthetic).forEach(x => addNotif(x.id, 'Announcements', '', `${v.title}: ${v.body}`, '/my-mea/notifications')); save(); toast('Announcement posted.'); render({ keepScroll: true });
};

/* ---- content (FAQs, testimonials, teacher profiles) ---- */
function faqForm(x) { return h`<form data-form="faqForm" data-id="${x ? x.id : ''}" novalidate>${fld({ name: 'cat', label: 'Category', type: 'select', value: x ? x.cat : FAQ_CATS[0], options: FAQ_CATS })}${fld({ name: 'q', label: 'Question', req: 1, value: x ? x.q : '' })}${fld({ name: 'a', label: 'Answer', type: 'textarea', req: 1, value: x ? x.a : '' })}<div class="row" style="margin-top:16px;justify-content:flex-end"><button type="button" class="btn btn-outline" data-act="closeModal">Cancel</button><button class="btn btn-primary" type="submit">Save FAQ</button></div></form>`; }
R('/admin/content', (p, q, u) => adminPage('Content', 'file-text', 'Edit FAQs, testimonials and teacher profiles without a developer', h`<div class="stack">
  <section class="panel"><h2><span class="l">${ic('help-circle')}FAQs</span><button class="btn btn-pink btn-sm" data-act="faqNew">${ic('plus')}Add FAQ</button></h2>${tableHTML(['Category', 'Question', ''], S.faqs.map(x => h`<tr>${td('Category', x.cat)}${td('Question', x.q)}${td('', h`<button class="btn btn-outline btn-sm" data-act="faqEdit" data-id="${x.id}">Edit</button> <button class="btn btn-danger btn-sm" data-act="faqDel" data-id="${x.id}">Delete</button>`, 'act')}</tr>`), { plain: true })}</section>
  <section class="panel"><h2><span class="l">${ic('star')}Testimonials and stories</span></h2><p class="muted">Publish only verified content with permission.</p>${[...S.testimonials.map((t, i) => ({ k: 'testimonials', i, l: `Testimonial – ${t.by}`, pub: t.pub })), ...S.stories.map((t, i) => ({ k: 'stories', i, l: `Story – ${t.title}`, pub: t.pub }))].map(x => h`<label class="toggle"><span>${x.l}</span><span class="sw"><input type="checkbox" data-on="togglePub" data-k="${x.k}" data-i="${x.i}" ${x.pub ? raw('checked') : ''} aria-label="Published: ${x.l}"><span></span></span></label>`)}</section>
  <section class="panel"><h2><span class="l">${ic('graduation-cap')}Teacher accounts and profiles</span></h2><p class="muted">Creating, removing and managing teachers — including which profiles are published on the About page — has moved to its own tab.</p>${btn('Go to Teachers', '/admin/teachers', 'btn-outline')}</section></div>`), AR);
Actions.faqNew = () => openModal({ title: 'Add FAQ', body: faqForm(null) });
Actions.faqEdit = t => openModal({ title: 'Edit FAQ', body: faqForm(S.faqs.find(x => x.id === t.dataset.id)) });
Actions.faqDel = t => { S.faqs = S.faqs.filter(x => x.id !== t.dataset.id); save(); toast('FAQ deleted.'); render({ keepScroll: true }); };
Forms.faqForm = (f, v) => { const e = {}; if (!v.q) e.q = 'Enter the question.'; if (!v.a) e.a = 'Enter the answer.'; if (!showErrors(f, e)) return; if (f.dataset.id) Object.assign(S.faqs.find(x => x.id === f.dataset.id), { cat: v.cat, q: v.q, a: v.a }); else S.faqs.push({ id: uid('f'), cat: v.cat, q: v.q, a: v.a }); save(); closeModal(); toast('FAQ saved.'); render({ keepScroll: true }); };
Changes.togglePub = el => { S[el.dataset.k][+el.dataset.i].pub = el.checked; save(); toast('Saved.'); };
Changes.toggleTeacher = el => { userById(el.dataset.id).publish = el.checked; save(); toast('Saved.'); };

/* ---- support queue ---- */
function adminSupport(p, q, u) {
  const tab = p.id || q.tab === 'messages' ? 'messages' : 'enquiries';
  let body, active = null;
  if (tab === 'messages') { const list = myThreads(u); active = p.id ? openThread(u, p.id) : (window.innerWidth > 820 && list[0] ? openThread(u, list[0].id) : null); body = messagesPane(u, list, active, '/admin/support', ''); }
  else body = h`${LIVE_BACKEND ? h`<div class="row" style="justify-content:flex-end;margin-bottom:10px"><button class="btn btn-outline btn-sm" data-act="enqRefresh">${ic('refresh')}Refresh</button></div>` : ''}${tableHTML(['Ref', 'From', 'Topic', 'Team', 'Message', 'Status'], [...S.enquiries].reverse().map(x => h`<tr>${td('Ref', x.ref)}${td('From', h`<strong>${x.name}</strong><br><span class="small muted">${x.email}</span>`)}${td('Topic', x.topic)}${td('Team', x.team)}${td('Message', x.message)}${td('Status', h`<select class="sel" data-on="enqStatus" data-id="${x.id}" aria-label="Status for ${x.ref}" style="min-width:130px">${['New', 'Open', 'Resolved'].map(s => h`<option ${x.status === s ? raw('selected') : ''}>${s}</option>`)}</select>`)}</tr>`), { plain: true, empty: 'No enquiries yet.' })}`;
  const page = adminPage('Support Queue', 'headset', 'Enquiries are labelled and routed to the right team', h`<div class="tabs"><a href="#/admin/support" ${tab === 'enquiries' ? raw('aria-current="page"') : ''}>Enquiries</a><a href="#/admin/support?tab=messages" ${tab === 'messages' ? raw('aria-current="page"') : ''}>Parent messages</a></div>${body}`);
  page.after = () => { if (LIVE_BACKEND && tab === 'messages') { liveRefresh(mirrorMyThreads(u)); if (active && active.live) liveRefresh(mirrorThreadMessages(active.id)); } };
  return page;
}
R('/admin/support', adminSupport, AR); R('/admin/support/:id', adminSupport, AR);
Actions.enqRefresh = async () => { toast('Checking for new enquiries…'); await mirrorEnquiries(me()); render({ keepScroll: true }); toast('Up to date.'); };
Changes.enqStatus = async el => {
  const q = S.enquiries.find(x => x.id === el.dataset.id);
  if (LIVE_BACKEND && q.live) {
    const r = await api('contact', { method: 'PATCH', body: { id: q.id, status: el.value } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not update — please try again.'); return; }
  }
  q.status = el.value; save(); toast('Status updated.');
};

/* ---- reports ---- */
R('/admin/reports', (p, q, u) => {
  const F = { sys: q.system || '', status: q.status || '', level: q.level || '' };
  const rows = S.enrolments.map(e => ({ e, k: childById(e.childId), cl: classById(e.classId) })).filter(x => x.k && (!F.status || x.e.status === F.status) && (!F.sys || clsCourse(x.cl).sys === F.sys) && (!F.level || clsCourse(x.cl).level === F.level));
  UI.reportRows = rows.map(x => [x.k.first + ' ' + x.k.last, x.k.stage, pname(x.k.parentId), clsCourse(x.cl).title, x.e.status]);
  return adminPage('Reports & Export', 'bar-chart', 'Export the current filtered view rather than the whole database', h`<div class="toolbar"><div class="field"><label for="rs">Education system</label><select class="sel" id="rs" data-on="rep" data-k="system"><option value="">All</option>${Object.values(SYS).map(s => h`<option value="${s.id}" ${F.sys === s.id ? raw('selected') : ''}>${s.short}</option>`)}</select></div><div class="field"><label for="rl">Level</label><select class="sel" id="rl" data-on="rep" data-k="level"><option value="">All</option>${Object.values(SYS).flatMap(s => s.levels).map(l => h`<option value="${l.id}" ${F.level === l.id ? raw('selected') : ''}>${l.name}</option>`)}</select></div><div class="field"><label for="rt">Status</label><select class="sel" id="rt" data-on="rep" data-k="status"><option value="">All</option>${['Active', 'Pending Confirmation', 'Waitlisted', 'Completed', 'Withdrawn', 'Declined'].map(s => h`<option ${F.status === s ? raw('selected') : ''}>${s}</option>`)}</select></div><div class="grow"></div><button class="btn btn-primary" data-act="copyCsv">${ic('copy')}Copy CSV</button></div>
  <p class="muted"><strong>${rows.length}</strong> enrolments in this view.</p>${tableHTML(['Child', 'Stage', 'Parent', 'Course', 'Status'], UI.reportRows.slice(0, 40).map(r => h`<tr>${r.map((c, i) => td(['Child', 'Stage', 'Parent', 'Course', 'Status'][i], c))}</tr>`), { plain: true, empty: 'No matching enrolments.' })}${rows.length > 40 ? h`<p class="form-note">Preview shows the first 40 rows. The copied CSV contains all ${rows.length}.</p>` : ''}`);
}, AR);
Changes.rep = el => setQuery({ [el.dataset.k]: el.value });
Actions.copyCsv = () => {
  const csv = [['Child', 'Stage', 'Parent', 'Course', 'Status'], ...(UI.reportRows || [])].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const ok = () => toast('CSV copied to your clipboard.'); const fail = () => { const t = document.createElement('textarea'); t.value = csv; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Copy is not available in this browser.'); } t.remove(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(csv).then(ok, fail); else fail();
};

/* ---- setup & integrations ---- */
function copyBlock(id, label) { return h`<div class="doc" style="padding:14px 16px;background:var(--bg-soft);position:relative"><pre id="${id}" style="white-space:pre-wrap;word-break:break-word;margin:0;font-size:.85rem;font-family:ui-monospace,Consolas,monospace">${label}</pre><button class="btn btn-outline btn-sm" style="position:absolute;top:10px;right:10px" data-act="copyBlock" data-target="${id}">${ic('copy')}Copy</button></div>`; }
Actions.copyBlock = t => {
  const text = document.getElementById(t.dataset.target).textContent;
  const done = () => toast('Copied.');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => toast('Could not copy — select the text manually.'));
  else { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Could not copy — select the text manually.'); } ta.remove(); }
};
Actions.recheckBackend = async () => { toast('Checking…'); await detectBackend(); render({ keepScroll: true }); };

R('/admin/setup', (p, q, u) => {
  const ok = LIVE_BACKEND;
  const statusCard = ok
    ? h`<div class="alert alert-ok">${ic('check-circle')}<span><strong>Connected.</strong> Accounts, the catalogue, enrolments, homework, messages, resources, attendance, assessments and the contact form are all real and shared — this is running on Netlify's own Functions and Blobs storage.</span></div>`
    : h`<div class="alert alert-warn">${ic('alert-triangle')}<span><strong>Demo mode.</strong> The backend isn't running here, so accounts and data are only saved in this browser. This is normal for a quick preview. Follow the steps below to make it real on your live Netlify site.</span></div>`;
  const emailCard = EMAIL_CONFIGURED
    ? h`<div class="alert alert-ok">${ic('check-circle')}<span><strong>Real email is connected.</strong> New accounts get a genuine verification email, and password reset sends a real link.</span></div>`
    : h`<div class="alert alert-warn">${ic('alert-triangle')}<span><strong>Email isn't connected yet.</strong> New accounts are auto-verified with no email sent — sign-up still works, just without that step. See "3. Real email" below to turn it on.</span></div>`;
  const paymentsCard = PAYMENTS_CONFIGURED
    ? h`<div class="alert alert-ok">${ic('check-circle')}<span><strong>Stripe is connected.</strong> Families can pay real invoices online, by card.</span></div>`
    : h`<div class="alert alert-warn">${ic('alert-triangle')}<span><strong>Online payment isn't connected yet.</strong> Invoices still work — families just see payment instructions instead of a "Pay Now" button. See "4. Online payment" below to turn it on.</span></div>`;
  const live = h`<div class="panel"><h2><span class="l">${ic('zap')}What's real right now</span></h2><ul class="ticks">
    <li>${ic('check-circle')}<span>Parent sign-up and sign-in, teacher accounts (created by admin), and your own admin login.</span></li>
    <li>${ic('check-circle')}<span>Adding and editing children — saved for real, per parent.</span></li>
    <li>${ic('check-circle')}<span>The course and class catalogue — seeded automatically from the sample data the first time you visit Admin → Courses, then fully editable for real.</span></li>
    <li>${ic('check-circle')}<span>Enrolment requests — a parent's request, and your approve / decline / waitlist / move decision, are both saved for real.</span></li>
    <li>${ic('check-circle')}<span>Homework (set, submit, mark), lesson resources, messages, attendance and assessments — all real, checked across independent sign-ins.</span></li>
    <li>${ic('check-circle')}<span>The contact form and Help &amp; Support requests — visible for real in Support Queue.</span></li>
    <li>${ic(EMAIL_CONFIGURED ? 'check-circle' : 'clock')}<span>Real "confirm your email" and "forgot password" emails — ${EMAIL_CONFIGURED ? 'connected and working.' : 'optional, see step 3 below.'}</span></li>
    <li>${ic(PAYMENTS_CONFIGURED ? 'check-circle' : 'clock')}<span>Real invoices, generated from actual enrolments, with online card payment via Stripe — ${PAYMENTS_CONFIGURED ? 'connected and working.' : 'optional, see step 4 below.'}</span></li>
    <li class="small muted" style="list-style:none;margin-left:-30px">Enrolments, Support Queue and Parents &amp; Children each have a Refresh button, since new requests from other people don't appear automatically.</li></ul></div>`;
  const page = adminPage('Setup & Integrations', 'key', 'A real backend, mostly with no third-party account needed — just Netlify itself', h`
  ${statusCard}${emailCard}${paymentsCard}
  <div class="row" style="margin-bottom:20px">${btn2('Check connection again', 'recheckBackend', 'refresh')}</div>
  <div class="stack">
    <section class="panel"><h2><span class="l">${ic('key')}How this works</span></h2><p class="muted mb0">This site's accounts, catalogue, enrolments, homework and messages all run on <strong>Netlify Functions</strong> (small bits of server code) and <strong>Netlify Blobs</strong> (Netlify's own built-in storage) — both included automatically with any Netlify site, at no extra cost for this scale of use. No account to create, no API key to paste, for any of that. Only real email (step 3) needs a small, optional third-party service.</p></section>

    <section class="panel"><h2><span class="l">${ic('layers')}1. Deploy using GitHub, not drag-and-drop</span></h2><p class="muted">This is the one real change from a simple static deploy. The backend needs one small package installed, and only a GitHub-connected deploy runs that step automatically.</p>
      <ol class="steps s4" style="list-style:decimal;padding-left:22px;display:block"><li>Put this project's files in a GitHub repository (create a free GitHub account first if you don't have one).</li><li>In Netlify: <strong>Add new site → Import an existing project</strong> → choose that repository.</li><li>Leave the build settings as they are — <code>netlify.toml</code> already tells Netlify what to do.</li></ol></section>

    <section class="panel"><h2><span class="l">${ic('settings')}2. Set your admin login</span></h2><p class="muted">This is your own sign-in for this Admin portal — no separate account, just three values you choose yourself.</p>
      <p class="small muted">In Netlify: <strong>Site settings → Environment variables → Add a variable</strong>. Add all three:</p>
      ${copyBlock('envblock', 'ADMIN_USERNAME=choose-a-username\nADMIN_PASSWORD=choose-a-strong-password\nSESSION_SECRET=a-long-random-string-32-characters-or-more')}
      <p class="small muted" style="margin-top:10px">For <code>SESSION_SECRET</code>, generate a random string at <strong>randomkeygen.com</strong>, or anything long and unguessable. Then redeploy: <strong>Deploys → Trigger deploy</strong>.</p></section>

    <section class="panel"><h2><span class="l">${ic('mail')}3. Real email (optional, ~5 minutes)</span></h2><p class="muted">Without this, new accounts are auto-verified with no email sent, and password reset isn't available — everything else still works. Turning this on uses <strong>Resend</strong>, a simple email-sending service with a free plan (no credit card needed to start).</p>
      <ol class="steps s4" style="list-style:decimal;padding-left:22px;display:block"><li>Create a free account at <strong>resend.com</strong>.</li><li><strong>API Keys → Create API Key</strong> → copy it (starts with <code>re_</code>).</li><li>In Netlify: <strong>Site settings → Environment variables → Add a variable</strong>:</li></ol>
      ${copyBlock('emailblock', 'RESEND_API_KEY=re_your_key_here')}
      <p class="small muted" style="margin-top:10px">This alone works immediately, sending from Resend's own shared test address. To send from your own domain instead (recommended before real families use this), verify a domain in Resend under <strong>Domains</strong>, then also add:</p>
      ${copyBlock('emailfromblock', 'EMAIL_FROM=Ma3an Education Academies <hello@youdomain.com>')}
      <p class="small muted" style="margin-top:10px">Then redeploy: <strong>Deploys → Trigger deploy</strong>.</p></section>

    <section class="panel"><h2><span class="l">${ic('credit-card')}4. Online payment (optional, ~10 minutes)</span></h2><p class="muted">Without this, invoices still work (Admin → Invoices &amp; Payments) but families see payment instructions instead of a "Pay Now" button. You said you already have a Stripe account, so this is just connecting it.</p>
      <ol class="steps s4" style="list-style:decimal;padding-left:22px;display:block"><li>In Stripe: <strong>Developers → API keys</strong> → copy your <strong>Secret key</strong> (starts with <code>sk_</code>). Use a test key first if you want to try it safely — Stripe test cards never charge real money.</li><li>In Netlify: <strong>Site settings → Environment variables → Add a variable</strong>:</li></ol>
      ${copyBlock('stripeblock', 'STRIPE_SECRET_KEY=sk_your_key_here')}
      <p class="small muted" style="margin-top:14px">Then set up the webhook that tells this site when a payment succeeds:</p>
      <ol class="steps s4" style="list-style:decimal;padding-left:22px;display:block"><li>In Stripe: <strong>Developers → Webhooks → Add endpoint</strong>.</li><li>Endpoint URL — copy this exactly:</li></ol>
      ${copyBlock('webhookurlblock', window.location.origin + '/api/stripe-webhook')}
      <ol class="steps s4" style="list-style:decimal;padding-left:22px;display:block;margin-top:10px" start="3"><li>Listen for event: <code>checkout.session.completed</code>.</li><li>After creating it, Stripe shows a <strong>Signing secret</strong> (starts with <code>whsec_</code>) — add it too:</li></ol>
      ${copyBlock('whsecblock', 'STRIPE_WEBHOOK_SECRET=whsec_your_secret_here')}
      <p class="small muted" style="margin-top:10px">Then redeploy: <strong>Deploys → Trigger deploy</strong>. When you're confident it works (make a real test payment with Stripe's test card <code>4242 4242 4242 4242</code>, any future date, any CVC), switch <code>STRIPE_SECRET_KEY</code> to your live secret key and repeat the webhook step for live mode.</p></section>

    <section class="panel"><h2><span class="l">${ic('folder')}Lesson resources (Google Drive)</span></h2><p class="muted mb0">No connection needed for this — it already works. A teacher opens Teaching Resources, pastes a Google Drive share link for each file, and publishes. Set the Drive file to "Anyone with the link can view" before pasting it in.</p></section>

    ${fileStorageSection()}
    ${live}
  </div>

  <section class="panel" id="site-details" style="margin-top:22px"><h2><span class="l">${ic('settings')}Site details</span></h2><p class="muted">Shown across the whole public site and footer. Saves instantly — no redeploy needed.</p>
    <form data-form="siteDetails" novalidate><div class="form-grid">
      ${fld({ name: 'name', label: 'Organisation name', req: 1, value: SITE.name })}${fld({ name: 'tagline', label: 'Tagline', value: SITE.tagline })}
      ${fld({ name: 'phone', label: 'Phone (displayed)', req: 1, value: SITE.phone })}${fld({ name: 'phoneHref', label: 'Phone (link, e.g. +442012345678)', req: 1, value: SITE.phoneHref })}
      ${fld({ name: 'email', label: 'Email address', type: 'email', req: 1, value: SITE.email })}${fld({ name: 'whatsapp', label: 'WhatsApp number (digits only, no +)', value: SITE.whatsapp, hint: 'Leave blank to hide WhatsApp buttons.' })}
      ${fld({ name: 'hours', label: 'Support hours', value: SITE.hours })}${fld({ name: 'siblingDiscount', label: 'Sibling discount %', type: 'number', value: SITE.siblingDiscount, attrs: 'min="0" max="100"' })}
      ${fld({ name: 'facebook', label: 'Facebook URL', value: SITE.social.facebook || '' })}${fld({ name: 'instagram', label: 'Instagram URL', value: SITE.social.instagram || '' })}
      ${fld({ name: 'youtube', label: 'YouTube URL', value: SITE.social.youtube || '' })}${fld({ name: 'linkedin', label: 'LinkedIn URL', value: SITE.social.linkedin || '' })}
      ${fld({ name: 'tiktok', label: 'TikTok URL', value: SITE.social.tiktok || '' })}
      <div class="field full">${chk('previewBuild', 'Show the "preview build with sample content" note in the footer', SITE.previewBuild)}</div>
    </div><button class="btn btn-primary" type="submit" style="margin-top:16px">Save site details</button></form></section>`);
  page.after = () => { if (LIVE_BACKEND && !UI.storageSettings) liveRefresh(loadStorageSettings()); };
  return page;
}, AR);
function btn2(label, act, icon) { return h`<button class="btn btn-outline" data-act="${act}">${ic(icon)}${label}</button>`; }
Forms.siteDetails = (f, v) => {
  const e = {}; if (!v.name) e.name = 'Enter an organisation name.'; if (!isEmail(v.email)) e.email = 'Enter a valid email address.'; if (!showErrors(f, e)) return;
  S.settings = { ...S.settings, name: v.name, tagline: v.tagline, phone: v.phone, phoneHref: v.phoneHref, email: v.email, whatsapp: v.whatsapp, hours: v.hours,
    siblingDiscount: +v.siblingDiscount || 0, previewBuild: !!v.previewBuild,
    social: Object.fromEntries(['facebook', 'instagram', 'youtube', 'linkedin', 'tiktok'].map(k => [k, v[k]]).filter(([, val]) => val)) };
  applySiteSettings(); save(); toast('Site details saved.'); render({ keepScroll: true });
};

/* ---- invoices & payments ---- */
R('/admin/invoices', (p, q, u) => {
  const term = (UI.invq || '').toLowerCase();
  const list = S.invoices.filter(i => !term || (i.id + ' ' + pname(i.parentId) + ' ' + i.period).toLowerCase().includes(term)).sort((a, b) => (b.issued || '').localeCompare(a.issued || ''));
  const totalDue = list.filter(i => i.status === 'Due').reduce((a, i) => a + invoiceTotals(i).total, 0);
  return adminPage('Invoices & Payments', 'credit-card', 'Generate monthly invoices and track payment', h`
  <div class="sumcards">
    <div class="sum"><span class="ico c-yellow">${ic('credit-card')}</span><div><div class="lab">Total outstanding</div><div class="val">${money(totalDue)}</div><div class="sm">${plural(list.filter(i => i.status === 'Due').length, 'invoice')} due</div></div></div>
    <div class="sum"><span class="ico c-green">${ic('check-circle')}</span><div><div class="lab">Paid this list</div><div class="val">${list.filter(i => i.status === 'Paid').length}</div><div class="sm">of ${list.length} shown</div></div></div>
  </div>
  <section class="panel" style="margin-bottom:20px"><h2><span class="l">${ic('zap')}Generate this month's invoices</span></h2><p class="muted">Creates one real invoice per family with an active enrolment. Fees are per lesson — each line is costed from that class's real weekly schedule, using whichever billing period (monthly or termly) the family chose when they enrolled. Safe to click more than once: it always creates a fresh set for the period you enter, it won't touch invoices already generated.</p>
    <form data-form="genInvoices" class="form-grid" novalidate>${fld({ name: 'period', label: 'Billing period', value: S.term.name })}${fld({ name: 'dueDate', label: 'Due date', type: 'date', req: 1, value: isoAdd(todayISO(), 10) })}${fld({ name: 'siblingDiscountPct', label: 'Sibling discount % (2+ children)', type: 'number', value: SITE.siblingDiscount || 0 })}<div><button class="btn btn-primary" type="submit" style="margin-top:22px">Generate invoices</button></div></form></section>
  ${!PAYMENTS_CONFIGURED ? h`<div class="alert alert-warn" style="margin-bottom:16px">${ic('alert-triangle')}<span>Online card payment isn't connected yet — families can still see these invoices, but "Pay Now" won't appear until Stripe is set up in Admin → Setup &amp; Integrations.</span></div>` : ''}
  <div class="toolbar">${searchBox('invq', UI.invq, 'invSearch', 'Search invoice, parent or period')}<div class="grow"></div>${LIVE_BACKEND ? h`<button class="btn btn-outline btn-sm" data-act="invRefresh">${ic('refresh')}Refresh</button>` : ''}</div>
  ${tableHTML(['Invoice', 'Parent', 'Period', 'Amount', 'Due', 'Status', ''], list.slice(0, 60).map(i => h`<tr>${td('Invoice', i.id)}${td('Parent', pname(i.parentId))}${td('Period', i.period)}${td('Amount', money(invoiceTotals(i).total))}${td('Due', fmtDate(i.due, 'dmy'))}${td('Status', statusChip(i.status))}${td('', i.status === 'Due' ? h`<button class="btn btn-outline btn-sm" data-act="markPaidManual" data-parent="${i.parentId}" data-id="${i.id}">Mark paid</button>` : '', 'act')}</tr>`), { plain: true, empty: 'No invoices yet — generate this month\u2019s above.' })}`);
}, AR);
Changes.invSearch = el => { UI.invq = el.value; render({ keepScroll: true }); };
Actions.invRefresh = async () => { toast('Checking for new invoices…'); await mirrorAllInvoices(me()); render({ keepScroll: true }); toast('Up to date.'); };
Forms.genInvoices = async (f, v) => {
  const r = await api('invoices', { method: 'POST', body: { generateForPeriod: true, period: v.period, dueDate: v.dueDate, siblingDiscountPct: +v.siblingDiscountPct || 0 } });
  if (!r.ok) { toast((r.data && r.data.error) || 'Could not generate invoices — please try again.'); return; }
  await mirrorAllInvoices(me());
  toast(`${r.data.created} invoice${r.data.created === 1 ? '' : 's'} generated.`); render({ keepScroll: true });
};
Actions.markPaidManual = t => openModal({
  title: 'Mark this invoice as paid?', body: h`<p>Use this for a payment received outside Stripe — for example bank transfer or cash. This cannot be undone from here.</p>`,
  foot: h`<button class="btn btn-outline" data-act="closeModal">Cancel</button><button class="btn btn-primary" data-act="markPaidManualGo" data-parent="${t.dataset.parent}" data-id="${t.dataset.id}">Mark as paid</button>`
});
Actions.markPaidManualGo = async t => {
  const r = await api('invoices', { method: 'PATCH', body: { parentId: t.dataset.parent, id: t.dataset.id, manual: true } });
  closeModal();
  if (!r.ok) { toast((r.data && r.data.error) || 'Could not update — please try again.'); return; }
  await mirrorAllInvoices(me()); toast('Marked as paid.'); render({ keepScroll: true });
};

/* ---- file storage (Netlify / Google Drive / OneDrive / GitHub) ---- */
async function loadStorageSettings() {
  const r = await api('storage-settings');
  if (r.ok) UI.storageSettings = r.data;
}
Actions.recheckStorage = async () => { UI.storageSettings = null; toast('Checking…'); await loadStorageSettings(); render({ keepScroll: true }); };

const STORAGE_FIELDS = {
  gdrive: [['clientEmail', 'Service account email', 'text'], ['privateKey', 'Service account private key', 'textarea'], ['folderId', 'Shared Drive folder ID', 'text']],
  onedrive: [['tenantId', 'Azure tenant ID', 'text'], ['clientId', 'Application (client) ID', 'text'], ['clientSecret', 'Client secret', 'text'], ['driveId', 'Drive ID', 'text'], ['folderId', 'Folder ID (optional)', 'text']],
  github: [['owner', 'Repository owner', 'text'], ['repo', 'Repository name', 'text'], ['branch', 'Branch', 'text'], ['path', 'Folder path in the repo', 'text'], ['token', 'Personal access token', 'text']],
};
const STORAGE_LABELS = { netlify: 'Netlify (built in)', gdrive: 'Google Drive', onedrive: 'OneDrive', github: 'GitHub' };
const STORAGE_BLURB = {
  netlify: 'Already on, nothing to set up. Uses the same Netlify Blobs storage as the rest of this site.',
  gdrive: 'Uses a Google "service account" — its own robot identity, not your personal login. Create one in Google Cloud Console, share a Drive folder with its email address, and paste the details here.',
  onedrive: 'Uses an Azure "app registration" with its own client ID and secret — not your personal Microsoft login. Register one in the Azure Portal, grant it access to a drive, and paste the details here.',
  github: '⚠️ Worth knowing before you pick this: every upload becomes a permanent commit (the repo only grows), there is no per-file access control, and files are only reachable by their link if the repository is public. Netlify or Drive/OneDrive are a better fit for family-uploaded files — this is here so you can judge that for yourself.',
};
function fileStorageSection() {
  const s = UI.storageSettings;
  if (!s) return h`<section class="panel"><h2><span class="l">${ic('upload')}File storage</span></h2><p class="muted mb0">${ic('clock')} Loading current settings…</p></section>`;
  return h`<section class="panel"><h2><span class="l">${ic('upload')}File storage</span></h2><p class="muted">Where uploaded files (currently: homework submissions) are actually kept. Pick any one as the active provider — the others stay saved but unused. <button class="link-btn" data-act="recheckStorage">Refresh</button></p>
    <div class="stack">${['netlify', 'gdrive', 'onedrive', 'github'].map(p => storageProviderCard(p, s))}</div></section>`;
}
function storageProviderCard(p, s) {
  const active = s.provider === p, ready = s.configured[p];
  return h`<div class="panel" style="background:${active ? 'var(--blue-50)' : 'var(--bg)'};border:1px solid ${active ? 'var(--blue)' : 'var(--border)'}">
    <div class="row between"><div><strong>${STORAGE_LABELS[p]}</strong> ${active ? chip('Active', 'chip-blue') : ready ? chip('Ready', 'chip-green') : chip('Not set up', 'chip-grey')}</div>
      ${!active ? h`<button class="btn btn-outline btn-sm" data-act="setActiveStorage" data-provider="${p}" ${ready ? '' : raw('disabled')}>Make active</button>` : ''}</div>
    <p class="small muted" style="margin-top:6px">${STORAGE_BLURB[p]}</p>
    ${p === 'netlify' ? '' : h`<form data-form="saveStorageCreds" data-provider="${p}" class="form-grid" style="margin-top:10px" novalidate>
      ${STORAGE_FIELDS[p].map(([key, label, type]) => fld({ name: key, label, type, value: s.credentials[p][key] || '', ph: s.credentials[p][key + 'Saved'] ? '•••• saved — leave blank to keep it' : '' }))}
      <div class="row" style="gap:8px"><button class="btn btn-primary btn-sm" type="submit">Save details</button><button class="btn btn-outline btn-sm" type="button" data-act="testStorageProvider" data-provider="${p}">Test connection</button></div>
    </form>`}
  </div>`;
}
Forms.saveStorageCreds = async (f, v) => {
  const p = f.dataset.provider;
  const r = await api('storage-settings', { method: 'POST', body: { provider: p, fields: v } });
  if (!r.ok) { toast((r.data && r.data.error) || 'Could not save — please try again.'); return; }
  toast('Saved.'); await loadStorageSettings(); render({ keepScroll: true });
};
Actions.setActiveStorage = async t => {
  const r = await api('storage-settings', { method: 'POST', body: { setActive: t.dataset.provider } });
  if (!r.ok) { toast((r.data && r.data.error) || 'Could not switch provider — please try again.'); return; }
  toast(`${STORAGE_LABELS[t.dataset.provider]} is now the active file storage.`); await loadStorageSettings(); render({ keepScroll: true });
};
Actions.testStorageProvider = async t => {
  const p = t.dataset.provider; toast('Testing connection…');
  const r = await api('storage-settings', { method: 'POST', body: { testProvider: p } });
  toast(r.ok ? `Success — a real test file was uploaded to ${STORAGE_LABELS[p]}.` : ((r.data && r.data.error) || 'Connection test failed.'));
};
