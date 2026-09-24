'use strict';
/* =====================================================================
   MEA – parent portal part 2a: Learning Hub, resources, homework
   ===================================================================== */
const RES_ICON = { 'Lesson slides': ['laptop', 'pink'], 'Worksheet': ['file-text', 'yellow'], 'Worked examples': ['file-text', 'yellow'], 'Answer sheet': ['check-square', 'green'], 'Revision guide': ['book-open', 'purple'], 'Video': ['video', 'purple'] };
const resIco = t => { const [i, c] = RES_ICON[t] || ['file-text', 'blue']; return h`<span class="t-${c === 'pink' ? 'pink' : c === 'yellow' ? 'yellow' : c === 'green' ? '' : 'blue'}" style="display:inline-flex">${ic(i)}</span>`; };
const activeEnrolsOf = (u, statuses = ['Active']) => S.enrolments.filter(e => statuses.includes(e.status) && childById(e.childId) && childById(e.childId).parentId === u.id);
const myEnrol = (u, id) => { const e = S.enrolments.find(x => x.id === id), k = e && childById(e.childId); return e && k && k.parentId === u.id ? e : null; };

R('/my-mea/learning', (p, q, u) => {
  const kid = kidSel(u, false), list = activeEnrolsOf(u, ['Active']);
  const e = list.find(x => x.childId === kid) || list[0];
  if (!e) return { title: 'Learning Hub', shell: 'parent', ptitle: 'Learning Hub', picon: 'folder', psub: 'Access your child’s course materials, homework and announcements.', body: emptyState({ icon: 'folder', title: 'No active courses yet', text: 'Once a place is confirmed, lesson resources and homework will appear here.', action: btn('Find a Course', '/my-mea/courses/find', 'btn-primary') }) };
  return { redirect: '/my-mea/learning/' + e.id };
}, PR);
R('/my-mea/learning/resource/:id', (p, q, u) => {
  const r = S.resources.find(x => x.id === p.id); if (!r) return notFoundView();
  const cl = classById(r.classId), co = clsCourse(cl), e = S.enrolments.find(x => x.classId === cl.id && ['Active', 'Completed'].includes(x.status) && childById(x.childId).parentId === u.id);
  if (!e) return { title: 'Resource', shell: 'parent', ptitle: 'Resource', body: emptyState({ icon: 'lock', title: 'You don’t have access to this resource', text: 'Lesson resources are only available to enrolled families.', action: btn('Back to Learning Hub', '/my-mea/learning', 'btn-primary') }) };
  const outline = { 'Lesson slides': ['Learning objectives', 'Key ideas and vocabulary', 'Worked example', 'Practice questions', 'Summary and homework'], 'Worksheet': ['Warm-up questions', 'Practice questions', 'Challenge question', 'Reflection'], 'Worked examples': ['Example 1 – step by step', 'Example 2 – common mistakes', 'Example 3 – exam-style'], 'Answer sheet': ['Answers to warm-up', 'Answers to practice questions', 'Marking guidance'], 'Revision guide': ['Key facts', 'Common mistakes', 'Quick check questions'], 'Video': ['Introduction', 'Explanation', 'Worked example', 'Recap'] }[r.type] || ['Contents'];
  return {
    title: r.title, shell: 'parent', ptitle: r.title, psub: `${co.title} · Week ${r.week} · ${r.topic}`, body: h`<div class="cols-2" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)"><div class="doc"><div class="row">${resIco(r.type)}<strong>${r.type}</strong>${chip('Week ' + r.week, 'chip-blue')}</div><h2 style="margin-top:14px">${r.topic}</h2>${outline.map((o, i) => h`<h3 style="font-size:1rem;margin-top:18px">${i + 1}. ${o}</h3><div class="ln"></div><div class="ln" style="width:82%"></div>`)}</div>
    <aside class="stack"><div class="panel"><h2 style="font-size:1rem">Details</h2><dl class="kv"><dt>Course</dt><dd>${co.title}</dd><dt>Type</dt><dd>${r.type}</dd><dt>Topic</dt><dd>${r.topic}</dd><dt>Published</dt><dd>${fmtDate(r.date, 'dmy')}</dd></dl></div>${r.link ? h`<a class="btn btn-primary" href="${r.link}" target="_blank" rel="noopener noreferrer">${ic('external-link')}Open file<span class="sr"> (opens in a new tab)</span></a>` : ''}<div class="alert alert-info">${ic('lock')}<span>Preview page. In the live site this checks your enrolment, then opens the file securely from MEA’s Google Drive.</span></div><a class="btn btn-outline" href="#/my-mea/learning/${e.id}">Back to Learning Hub</a></aside></div>`
  };
}, PR);
R('/my-mea/learning/:id', (p, q, u) => {
  const e = myEnrol(u, p.id); if (!e || !['Active', 'Completed'].includes(e.status)) return notFoundView();
  const k = childById(e.childId), cl = classById(e.classId), co = clsCourse(cl); UI.kid = k.id;
  const tab = q.tab || 'lessons', wk = UI.hubWeek || 'all';
  const opts = S.enrolments.filter(x => x.childId === k.id && ['Active', 'Completed'].includes(x.status));
  const hws = S.homework.filter(x => x.classId === cl.id).sort((a, b) => b.week - a.week);
  const next = hws.filter(x => ['To do', 'Due soon', 'Overdue'].includes(hwStatus(x, k.id))).sort((a, b) => a.due.localeCompare(b.due))[0];
  const ann = S.announcements.filter(a => (a.scope === 'class' && a.classId === cl.id) || a.scope === 'site').sort((a, b) => b.date.localeCompare(a.date));
  const nx = e.status === 'Active' ? nextSession(cl) : null, t = teacherOf(cl);
  const weeks = [...new Set(S.resources.filter(r => r.classId === cl.id).map(r => r.week))].sort((a, b) => b - a);
  const tabs = [['overview', 'Overview'], ['lessons', 'Lessons & Resources'], ['homework', 'Homework'], ['announcements', 'Announcements']];
  let main;
  if (tab === 'overview') main = h`<div class="panel"><h2><span class="l">${svcIcon(co.subject)}${co.title}</span>${statusChip(e.status)}</h2><dl class="kv"><dt>Child</dt><dd>${k.first} (${k.stage})</dd><dt>Class</dt><dd>${schedText(cl).short}</dd>${t.publish ? h`<dt>Teacher</dt><dd>${t.name}</dd>` : ''}<dt>Term</dt><dd>${cl.term}</dd></dl><h3 style="margin-top:18px;font-size:1rem">This course covers</h3><ul class="ticks">${co.topics.map(x => h`<li>${ic('check')}<span>${x}</span></li>`)}</ul></div>`;
  else if (tab === 'homework') main = h`<div class="panel"><h2><span class="l">${ic('pencil')}Homework</span></h2>${hws.length ? h`<div class="list">${hws.map(x => h`<div class="li"><div class="grow"><div class="t">${x.title}</div><div class="s">Due ${fmtDate(x.due, 'long')}</div></div>${statusChip(hwStatus(x, k.id))}<a class="btn btn-outline btn-sm" href="#/my-mea/homework/${x.id}${qs({ child: k.id })}">View Homework</a></div>`)}</div>` : raw('<p class="muted">No homework has been set yet.</p>')}</div>`;
  else if (tab === 'announcements') main = h`<div class="panel"><h2><span class="l">${ic('megaphone')}Announcements</span></h2>${ann.length ? h`<div class="list">${ann.map(a => h`<div class="li"><div class="grow"><div class="t">${a.title}</div><div class="s">${a.body}</div></div><div class="w">${ago(a.date)}</div></div>`)}</div>` : raw('<p class="muted">No announcements yet.</p>')}</div>`;
  else { const shown = weeks.filter(w => wk === 'all' || +wk === w); main = h`<div class="panel"><h2><span class="l">${ic('book-open')}Lessons &amp; Resources</span></h2><p class="muted" style="margin-top:-8px">Access lesson materials for the selected course and week.</p>
    ${shown.length ? shown.map((w, i) => { const rs = S.resources.filter(r => r.classId === cl.id && r.week === w); return h`<details class="res-week" ${i === 0 ? raw('open') : ''}><summary>Week ${w} – ${rs[0].topic}<span class="cnt">${plural(rs.length, 'resource')}</span>${ic('chevron-down', 'chev')}</summary><div class="rrow hd"><span>Resource title</span><span class="ty">Type</span><span class="dt">Date</span><span></span></div>${rs.map(r => h`<div class="rrow"><span class="nm">${resIco(r.type)}${r.title}</span><span class="ty">${r.type}</span><span class="dt">${fmtDate(r.date, 'dmy')}</span><a class="btn btn-outline btn-sm" href="#/my-mea/learning/resource/${r.id}">Open</a></div>`)}</details>`; }) : raw('<p class="muted">Resources will appear here once your teacher publishes them.</p>')}</div>`; }
  return {
    title: 'Learning Hub', shell: 'parent', ptitle: 'Learning Hub', picon: 'folder', psub: 'Access your child’s course materials, homework and announcements.', body: h`
    <div class="toolbar"><div class="field"><label for="hk">Child</label><select class="sel" id="hk" data-on="hubKid">${myKids(u).map(c => h`<option value="${c.id}" ${c.id === k.id ? raw('selected') : ''}>${c.first} (${c.stage})</option>`)}</select></div>
      <div class="field" style="min-width:260px"><label for="hc">Course</label><select class="sel" id="hc" data-on="hubCourse">${opts.map(x => h`<option value="${x.id}" ${x.id === e.id ? raw('selected') : ''}>${clsCourse(classById(x.classId)).title}</option>`)}</select></div>
      <div class="field"><label for="hw">Week</label><select class="sel" id="hw" data-on="hubWeek"><option value="all">All weeks</option>${weeks.map(w => h`<option value="${w}" ${String(wk) === String(w) ? raw('selected') : ''}>${cl.term.split(' ').slice(0, 2).join(' ')} – Week ${w}</option>`)}</select></div></div>
    <div class="tabs" role="navigation" aria-label="Course sections">${tabs.map(([id, l]) => h`<a href="#/my-mea/learning/${e.id}${qs({ tab: id })}" ${tab === id ? raw('aria-current="page"') : ''}>${l}</a>`)}<a href="#/my-mea/progress/${k.id}">Progress</a></div>
    <div class="cols-2" style="grid-template-columns:minmax(0,1.7fr) minmax(0,1fr)">${main}
      <aside class="sidecards"><div class="sc" style="--sc:var(--pink-d)"><h3>${ic('clipboard-list')}Upcoming homework</h3>${next ? h`<p><strong>${next.title}</strong></p><p class="small muted">Due ${fmtDate(next.due, 'long')}</p><p>${statusChip(hwStatus(next, k.id))}</p><a class="btn btn-pink btn-block" href="#/my-mea/homework/${next.id}${qs({ child: k.id })}">View Homework</a>` : raw('<p class="muted">Nothing due right now. Well done!</p>')}</div>
      <div class="sc" style="--sc:#B07C00"><h3>${ic('megaphone')}Latest announcement</h3>${ann[0] ? h`<p><strong>${ann[0].title}</strong></p><p class="small muted">${ann[0].body}</p><a class="btn btn-yellow btn-block" href="#/my-mea/learning/${e.id}?tab=announcements">View All Announcements</a>` : raw('<p class="muted">No announcements yet.</p>')}</div>
      <div class="sc" style="--sc:var(--blue-d)"><h3>${ic('video')}Next live class</h3>${nx ? h`<p><strong>${fmtDate(nx.date, 'long')}</strong></p><p class="small muted">${fmtRange(nx.start, nx.end)} (UK time)${t.publish ? ' · ' + t.name : ''}</p><a class="btn btn-primary btn-block" href="#/my-mea/timetable/session/${nx.id}">${cl.meetingUrl ? 'Join class' : 'View class'}</a>` : raw('<p class="muted">No upcoming class.</p>')}</div></aside></div>`,
    after() { if (LIVE_BACKEND && cl.live) { liveRefresh(mirrorHomeworkForClass(cl.id)); liveRefresh(mirrorResourcesForClass(cl.id)); liveRefresh(mirrorMySubmissions()); } }
  };
}, PR);
Changes.hubKid = el => { const e = S.enrolments.find(x => x.childId === el.value && x.status === 'Active'); UI.kid = el.value; go(e ? '/my-mea/learning/' + e.id : '/my-mea/learning'); };
Changes.hubCourse = el => go('/my-mea/learning/' + el.value);
Changes.hubWeek = el => { UI.hubWeek = el.value; render({ keepScroll: true }); };

/* ---------------- Homework ---------------- */
R('/my-mea/homework', (p, q, u) => {
  const sel = kidSel(u, true), tab = UI.hwTab || 'todo', fc = UI.hwCourse || '';
  let items = S.enrolments.filter(e => e.status === 'Active').map(e => ({ e, k: childById(e.childId) })).filter(x => x.k && x.k.parentId === u.id && (sel === 'all' || x.k.id === sel)).flatMap(x => S.homework.filter(hw => hw.classId === x.e.classId).map(hw => ({ hw, k: x.k, e: x.e, st: hwStatus(hw, x.k.id) })));
  const courseOpts = [...new Set(items.map(i => i.e.classId))];
  if (fc) items = items.filter(i => i.e.classId === fc);
  const groups = { todo: ['To do', 'Due soon', 'Overdue'], submitted: ['Submitted'], marked: ['Marked'] };
  const counts = Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, items.filter(i => v.includes(i.st)).length]));
  const shown = items.filter(i => groups[tab].includes(i.st)).sort((a, b) => tab === 'todo' ? a.hw.due.localeCompare(b.hw.due) : b.hw.due.localeCompare(a.hw.due));
  return {
    title: 'Homework', shell: 'parent', ptitle: 'Homework', psub: 'View and manage your child’s homework tasks', body: h`
    <div class="toolbar">${kidPicker(u, true)}<div class="field" style="min-width:240px"><label for="hwc">Filter by course</label><select class="sel" id="hwc" data-on="hwCourse"><option value="">All courses</option>${courseOpts.map(c => h`<option value="${c}" ${fc === c ? raw('selected') : ''}>${clsCourse(classById(c)).title}</option>`)}</select></div></div>
    <div class="tabs" role="tablist">${[['todo', 'To Do'], ['submitted', 'Submitted'], ['marked', 'Marked']].map(([id, l]) => h`<button role="tab" data-act="hwTab" data-tab="${id}" aria-selected="${tab === id}">${l} <span class="chip chip-grey">${counts[id]}</span></button>`)}</div>
    ${shown.length ? h`<div class="panel"><div class="list">${shown.map(x => { const co = clsCourse(classById(x.hw.classId)), n = daysBetween(todayISO(), x.hw.due); return h`<div class="li">${svcIcon(co.subject)}<div class="grow"><div class="t">${x.hw.title}</div><div class="s">${co.title} · ${x.k.first} (${x.k.stage}) · set by ${teacherOf(classById(x.hw.classId)).name}</div></div><div class="w"><strong style="color:${x.st === 'Overdue' ? '#A61B1B' : 'inherit'}">Due ${fmtDate(x.hw.due)}</strong><br><span class="small muted">${x.st === 'Overdue' ? plural(-n, 'day') + ' overdue' : n === 0 ? 'Due today' : n > 0 ? 'in ' + plural(n, 'day') : ''}</span></div>${statusChip(x.st)}<a class="btn btn-outline btn-sm" href="#/my-mea/homework/${x.hw.id}${qs({ child: x.k.id })}">${x.st === 'Marked' ? 'View Feedback' : 'View Homework'}</a></div>`; })}</div></div>` : emptyState({ icon: 'check-circle', title: tab === 'todo' ? 'All caught up' : 'Nothing here yet', text: tab === 'todo' ? 'There is no homework to do right now.' : 'Homework will appear here as it is submitted and marked.' })}
    <div class="panel row between" style="margin-top:20px;background:var(--yellow-50)"><div><strong>Need help with homework?</strong><div class="muted">Our teachers are here to support your child’s learning.</div></div>${btn('Contact Support', '/my-mea/support?topic=homework', 'btn-outline')}</div>`,
    after() { if (LIVE_BACKEND) { const ids = [...new Set(S.enrolments.filter(e => e.status === 'Active' && childById(e.childId) && childById(e.childId).parentId === u.id).map(e => e.classId).filter(id => { const cl = classById(id); return cl && cl.live; }))]; ids.forEach(id => liveRefresh(mirrorHomeworkForClass(id))); liveRefresh(mirrorMySubmissions()); } }
  };
}, PR);
Actions.hwTab = t => { UI.hwTab = t.dataset.tab; render({ keepScroll: true }); };
Changes.hwCourse = el => { UI.hwCourse = el.value; render({ keepScroll: true }); };
R('/my-mea/homework/:id', (p, q, u) => {
  const hw = S.homework.find(x => x.id === p.id);
  if (!hw) {
    // Not found locally yet doesn't necessarily mean it doesn't exist — a parent who
    // signed in before being approved, then got approved later in the same visit,
    // won't have synced it. Try a broader resync once before really giving up.
    if (LIVE_BACKEND && !UI._hwSyncTried) { UI._hwSyncTried = true; return { title: 'Loading…', shell: 'parent', ptitle: 'Loading…', body: h`<div class="panel">${ic('clock')} One moment…</div>`, after: () => liveRefresh(mirrorEnrolments(u).then(() => mirrorAllMyHomework(u.id))) }; }
    return notFoundView();
  }
  UI._hwSyncTried = false;
  const es = S.enrolments.filter(e => e.classId === hw.classId && e.status === 'Active' && childById(e.childId).parentId === u.id); if (!es.length) return notFoundView();
  const e = es.find(x => x.childId === q.child) || es[0], k = childById(e.childId), cl = classById(hw.classId), co = clsCourse(cl), st = hwStatus(hw, k.id), sub = subFor(hw.id, k.id), res = S.resources.find(r => r.id === hw.resourceId);
  return {
    title: hw.title, shell: 'parent', ptitle: hw.title, psub: `${co.title} · ${k.first}`, body: h`<div class="cols-2" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)"><div class="stack">
    <div class="panel"><h2><span class="l">${ic('clipboard-list')}Task</span>${statusChip(st)}</h2><p>${hw.desc}</p>${res ? h`<p><a class="btn btn-outline btn-sm" href="#/my-mea/learning/resource/${res.id}">${resIco(res.type)}Open ${res.title}</a></p>` : ''}<dl class="kv"><dt>Set by</dt><dd>${teacherOf(cl).name}</dd><dt>Assigned</dt><dd>${fmtDate(hw.assigned, 'long')}</dd><dt>Due</dt><dd>${fmtDate(hw.due, 'long')}</dd></dl></div>
    ${sub && sub.score != null ? h`<div class="panel" id="feedback" style="border-color:var(--green)"><h2><span class="l">${ic('check-circle')}Teacher feedback</span></h2><p style="font-size:1.4rem;font-weight:700;margin:0">${sub.score} / ${sub.max}</p><p>${sub.feedback}</p><p class="small muted mb0">Marked ${fmtDate(sub.markedAt, 'dmy')} by ${teacherOf(cl).name}</p></div>` : ''}
    ${sub ? h`<div class="panel"><h2><span class="l">${ic('upload')}Your submission</span></h2><p class="mb0">${ic('file-text')} ${sub.fileUrl ? h`<a href="${sub.fileUrl}" target="_blank" rel="noopener"><strong>${sub.fileName}</strong></a>` : h`<strong>${sub.fileName}</strong>`}<br><span class="small muted">Submitted ${fmtDate(sub.submittedAt.slice(0, 10), 'long')} at ${fmtTime(sub.submittedAt.slice(11, 16))}</span></p></div>` : h`<div class="panel"><h2><span class="l">${ic('upload')}Submit homework</span></h2><form data-form="hwSubmit" data-hw="${hw.id}" data-child="${k.id}" novalidate><div class="field"><label for="f_file">Completed work</label><input class="inp" type="file" id="f_file" name="file" aria-describedby="err_file"><div class="hint">Upload a photo or a PDF of the completed work.</div><div class="err" id="err_file" hidden></div></div><button class="btn btn-pink" type="submit" style="margin-top:14px">Submit homework</button></form></div>`}</div>
    <aside class="stack"><div class="panel"><h2 style="font-size:1rem">Related</h2><div class="stack"><a href="#/my-mea/learning/${e.id}">Open the Learning Hub</a><a href="#/my-mea/messages/new${qs({ enrolment: e.id })}">Message ${teacherOf(cl).name}</a></div></div><a class="btn btn-outline" href="#/my-mea/homework">Back to Homework</a></aside></div>`,
    after() { if (LIVE_BACKEND && cl.live) liveRefresh(mirrorMySubmissions()); }
  };
}, PR);
Forms.hwSubmit = async (f, v) => {
  const fileEl = f.querySelector('#f_file'), file = fileEl && fileEl.files[0];
  if (!showErrors(f, file ? {} : { file: 'Choose a file to upload.' })) return;
  const now = ukNow(), hh = String(Math.floor(now.min / 60)).padStart(2, '0'), mm = String(now.min % 60).padStart(2, '0');
  const hw = S.homework.find(x => x.id === f.dataset.hw), cl = hw && classById(hw.classId);
  let fileUrl = '';
  if (LIVE_BACKEND && hw && hw.live) {
    const up = await uploadRealFile(file);
    if (!up.ok) { showErrors(f, { file: (up.data && up.data.error) || up.error || 'Could not upload that file — please try again.' }); return; }
    fileUrl = up.data.url;
    const r = await api('submissions', { method: 'POST', body: { homeworkId: f.dataset.hw, childId: f.dataset.child, fileName: file.name, fileUrl } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not submit — please try again.'); return; }
  }
  S.submissions.push({ id: uid('sb'), hwId: f.dataset.hw, childId: f.dataset.child, fileName: file.name, fileUrl, submittedAt: `${now.date}T${hh}:${mm}` });
  save(); toast('Homework submitted.'); render({ keepScroll: true });
};
