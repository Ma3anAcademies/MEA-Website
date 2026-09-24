'use strict';
/* =====================================================================
   MEA – teacher portal
   ===================================================================== */
const TR = { role: ['teacher'] };
const myClasses = u => S.classes.filter(c => c.teacherId === u.id);
const classStudents = cl => S.enrolments.filter(e => e.classId === cl.id && e.status === 'Active').map(e => childById(e.childId)).filter(Boolean).sort((a, b) => a.first.localeCompare(b.first));
function notifyClassParents(cl, type, text, route) {
  const seen = new Set();
  S.enrolments.filter(e => e.classId === cl.id && e.status === 'Active').forEach(e => { const k = childById(e.childId); if (k && !k.synthetic && !seen.has(k.parentId)) { seen.add(k.parentId); addNotif(k.parentId, type, k.id, text, route); } });
}
function tSel(cls, q) { const id = q.class || UI.tclass, cl = cls.find(c => c.id === id) || cls[0]; if (cl) UI.tclass = cl.id; return cl; }
function classPicker(cls, cl, base) { return h`<div class="toolbar"><div class="field" style="min-width:280px"><label for="tcls">Class</label><select class="sel" id="tcls" data-on="tClass" data-base="${base}">${cls.map(c => h`<option value="${c.id}" ${cl && c.id === cl.id ? raw('selected') : ''}>${clsCourse(c).title} · ${schedText(c).short}</option>`)}</select></div></div>`; }
Changes.tClass = el => { UI.tclass = el.value; const b = el.dataset.base; go(b.includes('?') ? b + '&class=' + el.value : b + '?class=' + el.value, true); };
const nopeClass = { title: 'No classes', shell: 'teacher', ptitle: 'No classes yet', body: emptyState({ icon: 'calendar', title: 'You have no assigned classes', text: 'Ask an administrator to assign you to a class.' }) };

/* ---- dashboard ---- */
R('/teacher', (p, q, u) => {
  const cls = myClasses(u), now = ukNow(), ids = new Set(cls.map(c => c.id));
  const sess = []; cls.forEach(cl => classSessions(cl, now.date, isoAdd(now.date, 14)).forEach(s => { if (isFuture(s, now)) sess.push({ s, cl, co: clsCourse(cl) }); }));
  sess.sort((a, b) => (a.s.date + a.s.start).localeCompare(b.s.date + b.s.start));
  const todayS = sess.filter(x => x.s.date === now.date), show = todayS.length ? todayS : sess.slice(0, 5);
  const students = new Set(); cls.forEach(cl => classStudents(cl).forEach(k => students.add(k.id)));
  const toMark = S.submissions.filter(s => s.score == null && S.homework.find(x => x.id === s.hwId && ids.has(x.classId)));
  const tasks = [];
  cls.forEach(cl => { const n = toMark.filter(s => S.homework.find(x => x.id === s.hwId).classId === cl.id).length; if (n) tasks.push({ t: `Mark ${clsCourse(cl).title} homework (${n})`, d: 'Due soon', href: '/teacher/assignments?class=' + cl.id }); });
  cls.forEach(cl => { const w = weekOf(now.date); if (!S.resources.some(r => r.classId === cl.id && r.week === w + 1)) tasks.push({ t: `Upload Week ${w + 1} resources: ${clsCourse(cl).title}`, d: 'This week', href: '/teacher/resources?class=' + cl.id }); });
  const ann = S.announcements.filter(a => a.scope === 'staff').sort((a, b) => b.date.localeCompare(a.date));
  const tile = (icon, col, n, l, s) => h`<div class="sum"><span class="ico c-${col} round">${ic(icon)}</span><div><div class="val">${n}</div><div class="lab"><strong>${l}</strong> ${s}</div></div></div>`;
  return {
    title: 'Teacher dashboard', shell: 'teacher', ptitle: `Welcome back, ${u.name}`, psub: 'Here’s an overview of your classes, students and upcoming activities.', body: h`
    <div class="sumcards">${tile('graduation-cap', 'blue', cls.length, 'Classes', 'this term')}${tile('users', 'green', students.size, 'Students', 'total')}${tile('clipboard-list', 'yellow', toMark.length, 'Assignments', 'to mark')}${tile('calendar', 'pink', todayS.length, 'Classes', 'today')}</div>
    <div class="cols-2"><div class="stack"><section class="panel"><h2><span class="l">${ic('calendar')}${todayS.length ? 'Today’s classes' : 'Upcoming classes'}</span><a href="#/teacher/timetable">View Full Timetable</a></h2>
      ${show.length ? tableHTML(['When', 'Class', 'Subject', 'Level', 'Students', ''], show.map(x => h`<tr>${td('When', h`${relDay(x.s.date)}<br><span class="small muted">${fmtRange(x.s.start, x.s.end)}</span>`)}${td('Class', x.co.title)}${td('Subject', subj(x.co.subject).name)}${td('Level', levelName(x.co.level))}${td('Students', classStudents(x.cl).length)}${td('', x.cl.meetingUrl ? h`<a class="btn btn-outline btn-sm" href="${x.cl.meetingUrl}" target="_blank" rel="noopener noreferrer">${ic('video')}Join Class<span class="sr"> (opens in a new tab)</span></a>` : h`<a class="btn btn-outline btn-sm" href="#/teacher/classes/${x.cl.id}">Open class</a>`, 'act')}</tr>`), { plain: true }) : emptyState({ icon: 'calendar', title: 'No upcoming classes', text: 'Your scheduled classes will appear here.' })}</section>
      <section class="panel"><h2><span class="l">${ic('zap')}Quick actions</span></h2><div class="qa"><a href="#/teacher/attendance">${ic('check-square')}Take Attendance</a><a href="#/teacher/resources">${ic('upload')}Upload Resource</a><a href="#/teacher/assignments">${ic('clipboard-list')}Create Assignment</a><a href="#/teacher/announcements">${ic('megaphone')}Post Announcement</a><a href="#/teacher/timetable">${ic('calendar')}View Timetable</a></div></section></div>
    <div class="stack"><section class="panel"><h2><span class="l">${ic('megaphone')}Announcements</span></h2>${ann.length ? h`<div class="list">${ann.map(a => h`<div class="li"><div class="grow"><div class="t">${a.title}</div><div class="s">${a.body}</div></div><div class="w small">${fmtDate(a.date, 'dm')}</div></div>`)}</div>` : ''}</section>
      <section class="panel"><h2><span class="l">${ic('check-square')}My tasks</span></h2>${tasks.length ? h`<div class="list">${tasks.slice(0, 6).map(t => h`<a class="li" href="#${t.href}" style="text-decoration:none;color:inherit"><div class="grow"><div class="t">${t.t}</div></div>${chip(t.d, 'chip-pink')}</a>`)}</div>` : raw('<p class="muted">Nothing outstanding.</p>')}</section></div></div>`
  };
}, TR);

/* ---- timetable ---- */
R('/teacher/timetable', (p, q, u) => {
  if (!UI.ttWeek) UI.ttWeek = mondayOf(todayISO()); const mon = UI.ttWeek, today = todayISO(), ev = [];
  myClasses(u).forEach(cl => classSessions(cl, mon, isoAdd(mon, 6)).forEach(s => ev.push({ s, cl, co: clsCourse(cl), k: { first: plural(classStudents(cl).length, 'student'), parentId: '_' } })));
  ev.sort((a, b) => (a.s.date + a.s.start).localeCompare(b.s.date + b.s.start));
  return { title: 'Timetable', shell: 'teacher', ptitle: 'Timetable', picon: 'clock', psub: 'Your weekly teaching schedule (UK time)', body: h`<div class="toolbar"><div class="row" style="gap:6px"><button class="btn btn-outline btn-sm" data-act="ttWeek" data-d="-7" aria-label="Previous week">${ic('chevron-left')}</button><strong style="min-width:160px;text-align:center">${fmtDate(mon, 'dm')} – ${fmtDate(isoAdd(mon, 6), 'dmy')}</strong><button class="btn btn-outline btn-sm" data-act="ttWeek" data-d="7" aria-label="Next week">${ic('chevron-right')}</button><button class="btn btn-primary btn-sm" data-act="ttGoto" data-d="${today}">Today</button></div></div><div style="overflow-x:auto">${weekGrid(ev, mon, today, x => '/teacher/classes/' + x.cl.id)}</div>` };
}, TR);

/* ---- classes ---- */
R('/teacher/classes', (p, q, u) => {
  const cls = myClasses(u);
  return { title: 'My Classes', shell: 'teacher', ptitle: 'My Classes', picon: 'calendar', psub: 'Classes assigned to you', body: cls.length ? h`<div class="grid g3">${cls.map(cl => { const co = clsCourse(cl), sc = schedText(cl); return h`<a class="card link" href="#/teacher/classes/${cl.id}"><div class="row">${svcIco(co.subject)}<div><div class="strong">${co.title}</div><div class="small muted">${sc.short}</div></div></div><div class="row" style="margin-top:12px">${chip(plural(classStudents(cl).length, 'student') + ' / ' + cl.capacity, 'chip-blue', 'users')}${chip(cl.term, 'chip-grey')}</div></a>`; })}</div>` : nopeClass.body };
}, TR);
const svcIco = sid => h`<span class="ico c-${grpOf(sid)}">${ic(subj(sid).icon)}</span>`;
function classTab(u, cl, tab, base) {
  const co = clsCourse(cl), studs = classStudents(cl), cw = weekOf(todayISO());
  if (tab === 'students') return h`<section class="panel"><h2><span class="l">${ic('users')}Students</span></h2>${studs.length ? tableHTML(['Name', 'Stage', ''], studs.map(k => h`<tr>${td('Name', k.first + ' ' + k.last)}${td('Stage', k.stage)}${td('', h`<button class="btn btn-outline btn-sm" data-act="addAssess" data-child="${k.id}" data-class="${cl.id}" data-name="${k.first} ${k.last}">${ic('bar-chart')}Record assessment</button>`, 'act')}</tr>`), { plain: true }) : raw('<p class="muted">No students yet.</p>')}<p class="form-note">Only names and stage are shown. Contact families through Messages, not personal contact details.</p></section>`;
  if (tab === 'attendance') {
    const past = classSessions(cl, isoAdd(todayISO(), -35), todayISO()).filter(s => !isFuture(s)).reverse().slice(0, 8), sel = past.find(s => s.id === UI.tsession) || past[0];
    if (!sel) return h`<section class="panel"><p class="muted">No sessions have taken place yet.</p></section>`; UI.tsession = sel.id;
    const rec = k => (S.attendance.find(a => a.classId === cl.id && a.date === sel.date && a.childId === k.id) || {}).status || '';
    return h`<section class="panel"><h2><span class="l">${ic('check-square')}Attendance</span></h2><div class="field" style="max-width:340px;margin-bottom:14px"><label for="tsess">Session</label><select class="sel" id="tsess" data-on="tSession">${past.map(s => h`<option value="${s.id}" ${s.id === sel.id ? raw('selected') : ''}>${fmtDate(s.date, 'long')} · ${fmtRange(s.start, s.end)}</option>`)}</select></div>
      <form data-form="attend" data-class="${cl.id}" data-date="${sel.date}">${tableHTML(['Student', 'Status'], studs.map(k => h`<tr>${td('Student', k.first + ' ' + k.last)}${td('Status', h`<select class="sel" name="st_${k.id}" aria-label="Attendance for ${k.first} ${k.last}" style="min-width:160px"><option value="">Not recorded</option>${['Present', 'Late', 'Absent', 'Excused'].map(s => h`<option ${rec(k) === s ? raw('selected') : ''}>${s}</option>`)}</select>`)}</tr>`), { plain: true })}<button class="btn btn-primary" type="submit" style="margin-top:14px">Save attendance</button></form></section>`;
  }
  if (tab === 'resources') {
    const rs = S.resources.filter(r => r.classId === cl.id).sort((a, b) => b.week - a.week || b.date.localeCompare(a.date));
    return h`<div class="stack"><section class="panel"><h2><span class="l">${ic('upload')}Add a resource</span></h2><form data-form="addRes" data-class="${cl.id}" novalidate><div class="form-grid">${fld({ name: 'week', label: 'Week', type: 'select', req: 1, value: cw, options: Array.from({ length: cw + 2 }, (_, i) => [i + 1, 'Week ' + (i + 1)]) })}${fld({ name: 'type', label: 'Type', type: 'select', req: 1, options: ['Lesson slides', 'Worksheet', 'Worked examples', 'Answer sheet', 'Revision guide', 'Video'] })}${fld({ name: 'title', label: 'Resource title', req: 1, full: 1, ph: 'e.g. Worksheet – Week 4', hint: 'Use a clear title, not a file name.' })}${fld({ name: 'link', label: 'Google Drive link', type: 'url', req: 1, full: 1, ph: 'https://drive.google.com/…', hint: 'Use restricted sharing where possible.' })}</div><button class="btn btn-primary" type="submit" style="margin-top:14px">Publish and notify families</button></form></section>
      <section class="panel"><h2><span class="l">${ic('folder')}Published resources</span></h2>${rs.length ? tableHTML(['Week', 'Title', 'Type', 'Date'], rs.map(r => h`<tr>${td('Week', r.week)}${td('Title', r.title)}${td('Type', r.type)}${td('Date', fmtDate(r.date, 'dmy'))}</tr>`), { plain: true }) : raw('<p class="muted">Nothing published yet.</p>')}</section></div>`;
  }
  if (tab === 'homework') {
    const hws = S.homework.filter(x => x.classId === cl.id).sort((a, b) => b.due.localeCompare(a.due));
    return h`<div class="stack"><section class="panel"><h2><span class="l">${ic('clipboard-list')}Create assignment</span></h2><form data-form="addHw" data-class="${cl.id}" novalidate><div class="form-grid">${fld({ name: 'title', label: 'Title', req: 1, full: 1, ph: 'e.g. Week 4 Homework – Inequalities' })}${fld({ name: 'desc', label: 'Instructions', type: 'textarea', rows: 3, full: 1 })}${fld({ name: 'due', label: 'Due date', type: 'date', req: 1, value: isoAdd(todayISO(), 6) })}</div><button class="btn btn-primary" type="submit" style="margin-top:14px">Set homework and notify families</button></form></section>
      <section class="panel"><h2><span class="l">${ic('pencil')}Homework</span></h2>${hws.length ? tableHTML(['Homework', 'Due', 'Submitted', ''], hws.map(x => { const n = S.submissions.filter(s => s.hwId === x.id).length, m = S.submissions.filter(s => s.hwId === x.id && s.score == null).length; return h`<tr>${td('Homework', x.title)}${td('Due', fmtDate(x.due, 'dmy'))}${td('Submitted', `${n} / ${studs.length}` + (m ? ` (${m} to mark)` : ''))}${td('', h`<a class="btn btn-outline btn-sm" href="#/teacher/assignments/${x.id}">View / Mark</a>`, 'act')}</tr>`; }), { plain: true }) : raw('<p class="muted">No homework set yet.</p>')}</section></div>`;
  }
  if (tab === 'announcements') {
    const an = S.announcements.filter(a => a.scope === 'class' && a.classId === cl.id).sort((a, b) => b.date.localeCompare(a.date));
    return h`<div class="stack"><section class="panel"><h2><span class="l">${ic('megaphone')}Post a class announcement</span></h2><form data-form="addAnn" data-class="${cl.id}" novalidate class="stack">${fld({ name: 'title', label: 'Title', req: 1 })}${fld({ name: 'body', label: 'Message', type: 'textarea', rows: 3, req: 1 })}<button class="btn btn-primary" type="submit">Post to enrolled families</button></form></section><section class="panel"><h2>Previous announcements</h2>${an.length ? h`<div class="list">${an.map(a => h`<div class="li"><div class="grow"><div class="t">${a.title}</div><div class="s">${a.body}</div></div><div class="w small">${fmtDate(a.date, 'dm')}</div></div>`)}</div>` : raw('<p class="muted">None yet.</p>')}</section></div>`;
  }
  return '';
}
Changes.tSession = el => { UI.tsession = el.value; render({ keepScroll: true }); };
R('/teacher/classes/:id', (p, q, u) => {
  const cl = classById(p.id); if (!cl || cl.teacherId !== u.id) return notFoundView();
  const co = clsCourse(cl), tab = q.tab || 'students', tabs = [['students', 'Students'], ['attendance', 'Attendance'], ['resources', 'Resources'], ['homework', 'Homework'], ['announcements', 'Announcements']];
  return { title: co.title, shell: 'teacher', ptitle: co.title, psub: `${schedText(cl).short} · ${cl.term}`, body: h`<p><a href="#/teacher/classes">← My Classes</a></p><div class="row" style="margin-bottom:16px">${chip(plural(classStudents(cl).length, 'student') + ' of ' + cl.capacity, 'chip-blue', 'users')}${chip(levelName(co.level), 'chip-grey')}${co.board ? chip(co.board, 'chip-grey') : ''}</div><div class="tabs" role="navigation">${tabs.map(([id, l]) => h`<a href="#/teacher/classes/${cl.id}${qs({ tab: id })}" ${tab === id ? raw('aria-current="page"') : ''}>${l}</a>`)}</div>${classTab(u, cl, tab)}`, after() { if (LIVE_BACKEND && cl.live) { liveRefresh(mirrorMyStudents()); liveRefresh(mirrorEnrolments(u)); if (tab === 'resources') liveRefresh(mirrorResourcesForClass(cl.id)); if (tab === 'homework') liveRefresh(mirrorHomeworkForClass(cl.id)); if (tab === 'attendance' && UI.tsession) { const s = sessionById(UI.tsession); if (s) liveRefresh(mirrorAttendanceForSession(cl.id, s.date)); } } } };
}, TR);
[['/teacher/resources', 'resources', 'Teaching Resources', 'folder'], ['/teacher/assignments', 'homework', 'Assignments', 'clipboard-list'], ['/teacher/attendance', 'attendance', 'Attendance', 'check-square'], ['/teacher/announcements', 'announcements', 'Announcements', 'megaphone']].forEach(([path, tab, title, icon]) => R(path, (p, q, u) => {
  const cls = myClasses(u), cl = tSel(cls, q); if (!cl) return nopeClass;
  return { title, shell: 'teacher', ptitle: title, picon: icon, psub: 'Choose a class to manage', body: h`${classPicker(cls, cl, path)}${classTab(u, cl, tab)}`, after() { if (LIVE_BACKEND && cl.live) { liveRefresh(mirrorMyStudents()); liveRefresh(mirrorEnrolments(u)); if (tab === 'resources') liveRefresh(mirrorResourcesForClass(cl.id)); if (tab === 'homework') liveRefresh(mirrorHomeworkForClass(cl.id)); if (tab === 'attendance' && UI.tsession) { const s = sessionById(UI.tsession); if (s) liveRefresh(mirrorAttendanceForSession(cl.id, s.date)); } } } };
}, TR));
R('/teacher/students', (p, q, u) => {
  const rows = []; myClasses(u).forEach(cl => classStudents(cl).forEach(k => rows.push({ k, cl })));
  return { title: 'Students', shell: 'teacher', ptitle: 'Students', picon: 'users', psub: 'Students in your assigned classes', body: h`${tableHTML(['Student', 'Stage', 'Class'], rows.map(r => h`<tr>${td('Student', r.k.first + ' ' + r.k.last)}${td('Stage', r.k.stage)}${td('Class', h`<a href="#/teacher/classes/${r.cl.id}">${clsCourse(r.cl).title}</a>`)}</tr>`), { plain: true })}<p class="form-note">You can only see students in classes assigned to you.</p>` };
}, TR);
R('/teacher/assignments/:id', (p, q, u) => {
  const hw = S.homework.find(x => x.id === p.id), cl = hw && classById(hw.classId); if (!hw || cl.teacherId !== u.id) return notFoundView();
  const studs = classStudents(cl);
  return { title: hw.title, shell: 'teacher', ptitle: hw.title, psub: `${clsCourse(cl).title} · due ${fmtDate(hw.due, 'dmy')}`, body: h`<p><a href="#/teacher/classes/${cl.id}?tab=homework">← Back to class</a></p><div class="stack">${studs.map(k => { const s = subFor(hw.id, k.id); return h`<div class="panel"><div class="row between"><div><strong>${k.first} ${k.last}</strong><div class="small muted">${raw(s ? 'Submitted ' + fmtDate(s.submittedAt.slice(0, 10), 'dm') + ' · ' + (s.fileUrl ? `<a href="${esc(s.fileUrl)}" target="_blank" rel="noopener">${esc(s.fileName)}</a>` : esc(s.fileName)) : 'Not submitted')}</div></div>${s ? statusChip(s.score != null ? 'Marked' : 'Submitted') : statusChip('To do')}</div>${s ? h`<form data-form="markHw" data-sub="${s.id}" data-class="${cl.id}" data-hw="${hw.id}" data-child="${k.id}" data-live="${s.live ? '1' : ''}" class="form-grid" style="margin-top:12px" novalidate>${fld({ name: 'score', label: 'Score (out of 10)', type: 'number', value: s.score ?? '', attrs: 'min="0" max="10" step="1"' })}${fld({ name: 'feedback', label: 'Feedback for the family', value: s.feedback || '' })}<div><button class="btn btn-primary btn-sm" type="submit">Save mark</button></div></form>` : ''}</div>`; })}</div>`, after() { if (LIVE_BACKEND) { liveRefresh(mirrorMyStudents()); liveRefresh(mirrorEnrolments(u)); liveRefresh(mirrorSubmissionsForHomework(cl.id, hw.id)); } } };
}, TR);
R('/teacher/messages', (p, q, u) => { const list = myThreads(u), a = window.innerWidth > 820 && list[0] ? openThread(u, list[0].id) : null; return { title: 'Messages', shell: 'teacher', ptitle: 'Messages', picon: 'message-square', psub: 'Messages from parents of your students', body: messagesPane(u, list, a, '/teacher/messages', ''), after() { if (LIVE_BACKEND) { liveRefresh(mirrorMyThreads(u)); if (a && a.live) liveRefresh(mirrorThreadMessages(a.id)); } } }; }, TR);
R('/teacher/messages/:id', (p, q, u) => { const list = myThreads(u), a = openThread(u, p.id); return { title: 'Messages', shell: 'teacher', ptitle: 'Messages', picon: 'message-square', psub: 'Messages from parents of your students', body: messagesPane(u, list, a, '/teacher/messages', ''), after() { if (LIVE_BACKEND) { liveRefresh(mirrorMyThreads(u)); if (a && a.live) liveRefresh(mirrorThreadMessages(a.id)); } } }; }, TR);
R('/teacher/settings', settingsView('/teacher/settings', 'teacher'), TR);

Forms.attend = async (f, v) => {
  const cid = f.dataset.class, date = f.dataset.date;
  const rows = Object.entries(v).filter(([k, s]) => k.startsWith('st_') && s).map(([k, s]) => ({ childId: k.slice(3), status: s }));
  if (LIVE_BACKEND) {
    const cl = classById(cid);
    if (cl && cl.live) {
      for (const row of rows) { const r = await api('attendance', { method: 'POST', body: { classId: cid, date, childId: row.childId, status: row.status } }); if (!r.ok) { toast((r.data && r.data.error) || 'Could not save attendance — please try again.'); return; } }
    }
  }
  S.attendance = S.attendance.filter(a => !(a.classId === cid && a.date === date));
  rows.forEach(row => S.attendance.push({ classId: cid, date, childId: row.childId, status: row.status }));
  save(); toast('Attendance saved.');
};
Forms.addRes = async (f, v) => {
  const cl = classById(f.dataset.class), e = {}; if (!v.title) e.title = 'Enter a clear title.'; if (!/^https:\/\//i.test(v.link)) e.link = 'Paste a full link starting with https://';
  if (!showErrors(f, e)) return;
  let id = uid('r'), live = false;
  if (LIVE_BACKEND && cl.live) {
    const r = await api('resources', { method: 'POST', body: { classId: cl.id, title: v.title, type: v.type, url: v.link, week: +v.week } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not publish — please try again.'); return; }
    id = r.data.resource.id; live = true;
  }
  S.resources.push({ id, classId: cl.id, week: +v.week, topic: (clsCourse(cl).topics[(+v.week - 1) % clsCourse(cl).topics.length]), title: v.title, type: v.type, date: todayISO(), link: v.link, live });
  notifyClassParents(cl, 'Classes', `New lesson resource: ${v.title} (${clsCourse(cl).title}).`, '/my-mea/learning/resource/' + id); save(); toast('Published. Families have been notified.'); render({ keepScroll: true });
};
Forms.addHw = async (f, v) => {
  const cl = classById(f.dataset.class), e = {}; if (!v.title) e.title = 'Enter a title.'; if (!v.due) e.due = 'Choose a due date.'; if (!showErrors(f, e)) return;
  let id = uid('h'), live = false;
  if (LIVE_BACKEND && cl.live) {
    const r = await api('homework', { method: 'POST', body: { classId: cl.id, title: v.title, description: v.desc, dueDate: v.due } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not save — please try again.'); return; }
    id = r.data.homework.id; live = true;
  }
  S.homework.push({ id, classId: cl.id, week: weekOf(todayISO()), title: v.title, desc: v.desc || 'See the attached task.', assigned: todayISO(), due: v.due, resourceId: '', live });
  notifyClassParents(cl, 'Homework', `New homework: ${v.title} (${clsCourse(cl).title}).`, '/my-mea/homework/' + id); save(); toast('Homework set. Families have been notified.'); render({ keepScroll: true });
};
Forms.addAnn = (f, v) => {
  const cl = classById(f.dataset.class), e = {}; if (!v.title) e.title = 'Enter a title.'; if (!v.body) e.body = 'Write your announcement.'; if (!showErrors(f, e)) return;
  S.announcements.push({ id: uid('an'), scope: 'class', classId: cl.id, title: v.title, body: v.body, date: todayISO(), by: me().id });
  notifyClassParents(cl, 'Announcements', `${clsCourse(cl).title}: ${v.title}`, '/my-mea/learning/' + (S.enrolments.find(x => x.classId === cl.id && x.status === 'Active' && !x.childId.startsWith('c_syn')) || { id: '' }).id + '?tab=announcements'); save(); toast('Announcement posted.'); render({ keepScroll: true });
};
Forms.markHw = async (f, v) => {
  const s = S.submissions.find(x => x.id === f.dataset.sub), n = v.score === '' ? NaN : +v.score;
  if (!showErrors(f, isNaN(n) || n < 0 || n > 10 ? { score: 'Enter a score from 0 to 10.' } : (v.feedback ? {} : { feedback: 'Add a short comment for the family.' }))) return;
  if (LIVE_BACKEND && f.dataset.live) {
    const r = await api('submissions', { method: 'PATCH', body: { classId: f.dataset.class, homeworkId: f.dataset.hw, childId: f.dataset.child, score: n, feedback: v.feedback } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not save — please try again.'); return; }
  }
  s.score = n; s.max = 10; s.feedback = v.feedback; s.markedAt = todayISO();
  const k = childById(s.childId), hw = S.homework.find(x => x.id === s.hwId); if (k && !k.synthetic) addNotif(k.parentId, 'Homework', k.id, `${hw.title} has been marked (${n}/10).`, '/my-mea/homework/' + hw.id + qs({ child: k.id }));
  save(); toast('Mark saved.'); render({ keepScroll: true });
};

Actions.addAssess = t => {
  const childId = t.dataset.child, classId = t.dataset.class, name = t.dataset.name;
  openModal({
    title: `Record assessment — ${name}`,
    body: h`<form data-form="addAssess" data-child="${childId}" data-class="${classId}" novalidate><div class="form-grid">
      ${fld({ name: 'title', label: 'Assessment title', req: 1, full: 1, ph: 'e.g. Unit Test 2' })}
      ${fld({ name: 'date', label: 'Date', type: 'date', req: 1, value: todayISO() })}
      ${fld({ name: 'score', label: 'Score', type: 'number', req: 1, attrs: 'min="0"' })}
      ${fld({ name: 'maxScore', label: 'Out of', type: 'number', req: 1, value: 100, attrs: 'min="1"' })}
      ${fld({ name: 'comment', label: 'Comment for the family', type: 'textarea', rows: 2, full: 1 })}</div>
      <div class="row" style="margin-top:16px;justify-content:flex-end"><button type="button" class="btn btn-outline" data-act="closeModal">Cancel</button><button class="btn btn-primary" type="submit">Save assessment</button></div></form>`
  });
};
Forms.addAssess = async (f, v) => {
  const e = {}; if (!v.title) e.title = 'Enter a title.'; if (!v.date) e.date = 'Choose a date.';
  if (v.score === '' || isNaN(+v.score)) e.score = 'Enter a score.'; if (!v.maxScore || +v.maxScore < 1) e.maxScore = 'Enter the total marks available.';
  if (!showErrors(f, e)) return;
  const childId = f.dataset.child, classId = f.dataset.class, cl = classById(classId);
  let id = uid('as'), live = false;
  if (LIVE_BACKEND && cl.live) {
    const r = await api('assessments', { method: 'POST', body: { childId, classId, title: v.title, date: v.date, score: +v.score, maxScore: +v.maxScore, comment: v.comment } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not save — please try again.'); return; }
    id = r.data.assessment.id; live = true;
  }
  S.assessments.push({ id, childId, classId, title: v.title, date: v.date, score: +v.score, max: +v.maxScore, comment: v.comment || '', live });
  const k = childById(childId); if (k && !k.synthetic) addNotif(k.parentId, 'Homework', k.id, `New assessment recorded: ${v.title} (${Math.round(+v.score * 100 / +v.maxScore)}%).`, '/my-mea/progress/' + k.id);
  save(); closeModal(); toast('Assessment saved.'); render({ keepScroll: true });
};
