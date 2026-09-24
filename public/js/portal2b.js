'use strict';
/* =====================================================================
   MEA – parent portal part 2b: progress, payments, messages
   ===================================================================== */
function progressFor(k, classFilter) {
  return S.enrolments.filter(e => e.childId === k.id && e.status === 'Active' && (!classFilter || e.classId === classFilter)).map(e => {
    const cl = classById(e.classId), co = clsCourse(cl), hws = S.homework.filter(x => x.classId === cl.id && x.due <= isoAdd(todayISO(), 14));
    const done = hws.filter(x => subFor(x.id, k.id)).length, marked = S.submissions.filter(s => s.childId === k.id && hws.some(x => x.id === s.hwId) && s.score != null);
    const att = S.attendance.filter(a => a.classId === cl.id && a.childId === k.id), present = att.filter(a => a.status !== 'Absent').length;
    const scored = S.assessments.filter(a => a.childId === k.id && a.classId === cl.id && a.score != null).sort((a, b) => b.date.localeCompare(a.date));
    const fb = [...marked.map(s => ({ date: s.markedAt, text: s.feedback, from: 'homework' })), ...scored.filter(a => a.comment).map(a => ({ date: a.date, text: a.comment, from: a.title }))].sort((a, b) => b.date.localeCompare(a.date));
    return { e, cl, co, hwTotal: hws.length, hwDone: done, attTotal: att.length, attPresent: present, scored, latest: scored[0], fb, teacher: teacherOf(cl) };
  });
}
const pct = (a, b) => b ? Math.round(a * 100 / b) : null;
R('/my-mea/progress', (p, q, u) => {
  const k = childById(kidSel(u, false)); if (!k) return { redirect: '/my-mea/children/add?first=1' };
  const cf = UI.pcourse || '', rows = progressFor(k, cf), all = progressFor(k);
  const T = rows.reduce((a, r) => ({ ht: a.ht + r.hwTotal, hd: a.hd + r.hwDone, at: a.at + r.attTotal, ap: a.ap + r.attPresent, sc: a.sc.concat(r.scored) }), { ht: 0, hd: 0, at: 0, ap: 0, sc: [] });
  const avg = T.sc.length ? Math.round(T.sc.reduce((a, s) => a + s.score * 100 / s.max, 0) / T.sc.length) : null;
  const fb = rows.flatMap(r => r.fb.slice(0, 2).map(f => ({ ...f, co: r.co, t: r.teacher }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const upc = S.assessments.filter(a => a.childId === k.id && a.score == null && (!cf || a.classId === cf) && a.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const sum = (icon, col, lab, val, sm) => h`<div class="sum"><span class="ico c-${col}">${ic(icon)}</span><div><div class="lab">${lab}</div><div class="val">${val}</div><div class="sm">${sm}</div></div></div>`;
  return {
    title: 'Progress', shell: 'parent', ptitle: 'Progress', picon: 'bar-chart', psub: 'Track your child’s learning progress. Figures show the underlying numbers.', body: h`
    <div class="toolbar">${kidPicker(u, false)}<div class="field" style="min-width:240px"><label for="pc">Course</label><select class="sel" id="pc" data-on="pCourse"><option value="">All courses</option>${all.map(r => h`<option value="${r.cl.id}" ${cf === r.cl.id ? raw('selected') : ''}>${r.co.title}</option>`)}</select></div><div class="field"><span class="lbl">Time period</span><div class="inp" style="background:var(--bg-soft)">This term (${S.term.name})</div></div></div>
    <div class="sumcards">${sum('check-circle', 'green', 'Class attendance', T.at ? pct(T.ap, T.at) + '%' : '–', `${T.ap} of ${T.at} classes`)}${sum('clipboard-list', 'blue', 'Homework completed', `${T.hd} / ${T.ht}`, T.ht ? pct(T.hd, T.ht) + '% completed' : 'None set yet')}${sum('bar-chart', 'purple', 'Average assessment', avg != null ? avg + '%' : '–', plural(T.sc.length, 'assessment') + ' this term')}</div>
    <div class="cols-2"><section class="panel" aria-labelledby="pg"><h2 id="pg"><span class="l">${ic('layers')}Course progress</span><a href="#/my-mea/progress/${k.id}">View Detailed Progress</a></h2>
      ${rows.length ? tableHTML(['Course', 'Attendance', 'Homework', 'Latest assessment', 'Teacher'], rows.map(r => h`<tr>${td('Course', h`<strong>${r.co.title}</strong>`)}${td('Attendance', r.attTotal ? `${pct(r.attPresent, r.attTotal)}% (${r.attPresent}/${r.attTotal})` : '–')}${td('Homework', `${r.hwDone} / ${r.hwTotal}`)}${td('Latest assessment', r.latest ? h`<div class="row" style="gap:8px;flex-wrap:nowrap"><div class="bar" style="width:80px"><i style="width:${pct(r.latest.score, r.latest.max)}%"></i></div><strong>${r.latest.score}/${r.latest.max}</strong></div>` : '–')}${td('Teacher', r.teacher.name)}</tr>`), { plain: true }) : raw('<p class="muted">No active courses to show.</p>')}</section>
    <div class="stack"><section class="panel" aria-labelledby="pf"><h2 id="pf"><span class="l">${ic('message-square')}Recent teacher feedback</span></h2>${fb.length ? h`<div class="list">${fb.map(f => h`<div class="li"><div class="grow"><div class="t">${f.text}</div><div class="s">${f.co.title} · ${fmtDate(f.date, 'dm')} · ${f.t.name}</div></div></div>`)}</div>` : raw('<p class="muted">Feedback will appear here as work is marked.</p>')}</section>
    <section class="panel" aria-labelledby="pu"><h2 id="pu"><span class="l">${ic('calendar')}Upcoming assessments</span></h2>${upc.length ? h`<div class="list">${upc.map(a => h`<div class="li"><div class="grow"><div class="t">${a.title}</div><div class="s">${clsCourse(classById(a.classId)).title}</div></div><div class="w"><strong>${fmtDate(a.date)}</strong></div></div>`)}</div>` : raw('<p class="muted">No assessments scheduled.</p>')}</section></div></div>`,
    after() { if (LIVE_BACKEND) { liveRefresh(mirrorAttendanceForChild()); liveRefresh(mirrorMyAssessments()); } }
  };
}, PR);
Changes.pCourse = el => { UI.pcourse = el.value; render({ keepScroll: true }); };
R('/my-mea/progress/:childId', (p, q, u) => {
  const k = childById(p.childId); if (!k || k.parentId !== u.id) return notFoundView(); UI.kid = k.id;
  const rows = progressFor(k), ass = S.assessments.filter(a => a.childId === k.id && a.score != null).sort((a, b) => b.date.localeCompare(a.date));
  const att = S.attendance.filter(a => a.childId === k.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  const marks = S.submissions.filter(s => s.childId === k.id && s.score != null).sort((a, b) => b.markedAt.localeCompare(a.markedAt));
  return {
    title: 'Progress – ' + k.first, shell: 'parent', ptitle: k.first + ' – detailed progress', psub: `${k.stage} · ${S.term.name}`, body: h`<p><a href="#/my-mea/progress">← Back to Progress</a></p><div class="stack">
    <section class="panel" id="assessments"><h2>Assessments</h2>${ass.length ? tableHTML(['Assessment', 'Course', 'Date', 'Score', 'Comment'], ass.map(a => h`<tr>${td('Assessment', a.title)}${td('Course', clsCourse(classById(a.classId)).title)}${td('Date', fmtDate(a.date, 'dmy'))}${td('Score', h`<strong>${a.score}/${a.max}</strong>`)}${td('Comment', a.comment)}</tr>`), { plain: true }) : raw('<p class="muted">No assessments yet.</p>')}</section>
    <section class="panel" id="teacher-feedback"><h2>Marked homework</h2>${marks.length ? tableHTML(['Homework', 'Score', 'Feedback', 'Marked'], marks.map(s => { const hw = S.homework.find(x => x.id === s.hwId); return h`<tr>${td('Homework', hw ? hw.title : '')}${td('Score', h`<strong>${s.score}/${s.max}</strong>`)}${td('Feedback', s.feedback)}${td('Marked', fmtDate(s.markedAt, 'dmy'))}</tr>`; }), { plain: true }) : raw('<p class="muted">No marked homework yet.</p>')}</section>
    <section class="panel"><h2>Recent attendance</h2>${att.length ? tableHTML(['Date', 'Class', 'Status'], att.map(a => h`<tr>${td('Date', fmtDate(a.date, 'long'))}${td('Class', clsCourse(classById(a.classId)).title)}${td('Status', statusChip(a.status))}</tr>`), { plain: true }) : raw('<p class="muted">Attendance will appear after the first classes.</p>')}</section></div>`,
    after() { if (LIVE_BACKEND) { liveRefresh(mirrorAttendanceForChild()); liveRefresh(mirrorMyAssessments()); } }
  };
}, PR);

/* ---------------- Payments (shell: Phase 3 online checkout) ---------------- */
R('/my-mea/payments/invoices/:id', (p, q, u) => {
  const inv = S.invoices.find(i => i.id === p.id && i.parentId === u.id); if (!inv) return notFoundView();
  const t = invoiceTotals(inv);
  const canPay = LIVE_BACKEND && PAYMENTS_CONFIGURED && inv.live && inv.status !== 'Paid';
  return {
    title: inv.id, shell: 'parent', ptitle: 'Invoice ' + inv.id, psub: inv.period, body: h`<p><a href="#/my-mea/payments">← Back to Payments</a></p>${q.paid ? h`<div class="alert alert-info" style="margin-bottom:16px">${ic('clock')}<span>Payment received by Stripe — updating your invoice, this can take a few seconds…</span></div>` : ''}<div class="panel" style="max-width:760px"><div class="row between"><div><strong>${inv.period}</strong><div class="small muted">Issued ${fmtDate(inv.issued, 'dmy')} · Due ${fmtDate(inv.due, 'dmy')}</div></div>${statusChip(inv.status)}</div>
    ${tableHTML(['Child', 'Course', 'Amount'], inv.lines.map(l => h`<tr>${td('Child', l.child)}${td('Course', l.desc)}${td('Amount', money(l.amt))}</tr>`), { plain: true })}
    <dl class="kv" style="margin-top:16px;justify-content:end"><dt>Subtotal</dt><dd>${money(t.sub)}</dd>${t.disc ? h`<dt>Sibling discount (${inv.discountPct}%)</dt><dd>−${money(t.disc)}</dd>` : ''}<dt><strong>Total</strong></dt><dd><strong>${money(t.total)}</strong></dd></dl>
    ${inv.status === 'Paid' ? h`<p class="alert alert-ok" style="margin-top:16px">${ic('check-circle')}<span>Paid on ${fmtDate(inv.paidOn, 'dmy')}. Thank you.</span></p>`
      : canPay ? h`<button class="btn btn-pink" style="margin-top:16px" data-act="payInvoice" data-id="${inv.id}">${ic('credit-card')}Pay ${money(t.total)} now</button><p class="small muted" style="margin-top:8px">${ic('lock')} Handled entirely by Stripe — your card details never reach this site.</p>`
      : h`<div class="alert alert-info" style="margin-top:16px">${ic('info')}<span>Online payment is not available yet. Please use the payment instructions sent with your confirmation, or contact support.</span></div>`}
    <div class="row" style="margin-top:14px">${btn('Payment help', '/my-mea/support?topic=payments', 'btn-outline')}</div></div>`,
    after() { if (LIVE_BACKEND && inv.live) liveRefresh(mirrorMyInvoices()); }
  };
}, PR);
Actions.payInvoice = async t => {
  const btnEl = t; btnEl.disabled = true; btnEl.textContent = 'Redirecting to Stripe…';
  const r = await api('checkout', { method: 'POST', body: { invoiceId: t.dataset.id } });
  if (!r.ok || !r.data.url) { toast((r.data && r.data.error) || 'Could not start checkout — please try again.'); btnEl.disabled = false; return; }
  window.location.href = r.data.url;
};
R('/my-mea/payments', (p, q, u) => {
  const inv = S.invoices.filter(i => i.parentId === u.id).sort((a, b) => b.due.localeCompare(a.due)), due = inv.filter(i => i.status === 'Due'), paid = inv.filter(i => i.status === 'Paid');
  const owed = due.reduce((a, i) => a + invoiceTotals(i).total, 0), sum = (icon, col, lab, val, sm) => h`<div class="sum"><span class="ico c-${col}">${ic(icon)}</span><div><div class="lab">${lab}</div><div class="val">${val}</div><div class="sm">${sm}</div></div></div>`;
  return {
    title: 'Payments', shell: 'parent', ptitle: 'Payments', psub: 'Your account, invoices and payment history', body: h`
    <div class="sumcards">${sum('credit-card', 'yellow', 'Amount due', money(owed), due[0] ? 'Next due ' + fmtDate(due[0].due, 'dmy') : 'Nothing due')}${sum('check-circle', 'green', 'Paid invoices', String(paid.length), paid[0] ? 'Latest: ' + paid[0].period : '')}</div>
    <section class="panel" aria-labelledby="iv"><h2 id="iv"><span class="l">${ic('file-text')}Invoices</span></h2>${tableHTML(['Invoice', 'Period', 'Amount', 'Due', 'Status', ''], inv.map(i => h`<tr>${td('Invoice', i.id)}${td('Period', i.period)}${td('Amount', money(invoiceTotals(i).total))}${td('Due', fmtDate(i.due, 'dmy'))}${td('Status', statusChip(i.status))}${td('', h`<a class="btn btn-outline btn-sm" href="#/my-mea/payments/invoices/${i.id}">View Invoice</a>`, 'act')}</tr>`), { plain: true, empty: 'No invoices yet.' })}</section>
    ${LIVE_BACKEND && PAYMENTS_CONFIGURED
      ? h`<div class="alert alert-ok" style="margin-top:20px">${ic('check-circle')}<span>Online card payment is available — open a "Due" invoice and pay securely with Stripe.</span></div>`
      : h`<div class="alert alert-info" style="margin-top:20px">${ic('info')}<span>Online card payment isn't connected on this site yet. Until then, pay using the instructions sent with your enrolment confirmation, or <a href="#/my-mea/support?topic=payments">contact support</a>.</span></div>`}`,
    after() { if (LIVE_BACKEND) liveRefresh(mirrorMyInvoices()); }
  };
}, PR);

/* ---------------- Messages ---------------- */
function partyName(t, viewer) { return viewer.role === 'parent' ? (userById(t.staffId) || { name: 'MEA' }).name : (userById(t.parentId) || { name: 'Parent' }).name; }
function msgTime(at) { const d = at.slice(0, 10); return `${relDay(d)} ${fmtTime(at.slice(11, 16))}`; }
function messagesPane(u, threads, active, base, newHref) {
  const staff = u.role !== 'parent';
  return h`<div class="msgs ${active ? 'has-conv' : ''}"><div class="lst"><div style="padding:12px">${newHref ? h`<a class="btn btn-pink btn-block btn-sm" href="#${newHref}">${ic('plus')}New Message</a>` : ''}</div>${threads.length ? threads.map(t => { const last = t.messages[t.messages.length - 1], un = staff ? t.unreadStaff : t.unreadParent; return h`<a class="th" href="#${base}/${t.id}" ${active && active.id === t.id ? raw('aria-current="true"') : ''} style="text-decoration:none;color:inherit"><b><span>${partyName(t, u)}</span><span class="small muted" style="font-weight:400">${un ? h`<span class="chip chip-pink">New</span>` : ''}</span></b><div class="small strong">${t.subject}</div><span>${last ? last.text : ''}</span></a>`; }) : raw('<p class="muted" style="padding:16px">No messages yet.</p>')}</div>
    <div class="conv">${active ? h`<div class="hd"><a class="small" href="#${base}" style="display:block">← All messages</a>${active.subject} <span class="muted small" style="font-weight:400">· ${partyName(active, u)}</span></div><div class="bd">${active.messages.map(m => h`<div class="bub ${m.from === u.id ? 'me' : ''}">${m.text}<small>${userById(m.from).name} · ${msgTime(m.at)}</small></div>`)}</div><form data-form="reply" data-id="${active.id}" novalidate><label class="sr" for="f_reply">Reply</label><input class="inp" id="f_reply" name="reply" placeholder="Write a reply…" autocomplete="off"><button class="btn btn-primary" type="submit">${ic('send')}Send</button></form>` : h`<div class="bd" style="align-items:center;justify-content:center;color:var(--muted)">Select a conversation</div>`}</div></div>
    <p class="form-note" style="margin-top:12px">${ic('shield-check')} Messages are between parents and MEA staff or assigned teachers only. Teachers’ personal contact details are never shown.</p>`;
}
function nowStamp() { const n = ukNow(); return `${n.date}T${String(Math.floor(n.min / 60)).padStart(2, '0')}:${String(n.min % 60).padStart(2, '0')}`; }
function openThread(u, id) { const t = S.threads.find(x => x.id === id); if (!t) return null; if (u.role === 'parent' ? t.parentId !== u.id : t.staffId !== u.id) return null; if (u.role === 'parent') t.unreadParent = false; else t.unreadStaff = false; save(); return t; }
R('/my-mea/messages/new', (p, q, u) => {
  const en = q.enrolment ? myEnrol(u, q.enrolment) : null, cls = activeEnrolsOf(u).map(e => classById(e.classId)), tids = [...new Set(cls.map(c => c.teacherId))];
  const adminId = LIVE_BACKEND && u.live ? 'admin' : 'u_admin';
  const pre = en ? classById(en.classId).teacherId : adminId;
  return { title: 'New message', shell: 'parent', ptitle: 'New Message', psub: 'Send a message to MEA staff or your child’s teacher', body: h`<div class="panel" style="max-width:720px"><form data-form="newMsg" data-enrol="${en ? en.id : ''}" novalidate><div class="stack">
    ${fld({ name: 'to', label: 'To', type: 'select', req: 1, value: pre, options: [[adminId, 'MEA Support Team'], ...tids.map(t => [t, userById(t).name + ' (teacher)'])] })}${fld({ name: 'subject', label: 'Subject', req: 1, value: en ? clsCourse(classById(en.classId)).title : '' })}${fld({ name: 'message', label: 'Message', type: 'textarea', req: 1 })}</div><div class="row" style="margin-top:18px"><button class="btn btn-primary" type="submit">${ic('send')}Send message</button><a class="btn btn-outline" href="#/my-mea/messages">Cancel</a></div></form></div>` };
}, PR);
Forms.newMsg = async (f, v) => {
  const u = me(), e = {}; if (!v.subject) e.subject = 'Enter a subject.'; if (!v.message) e.message = 'Write your message.'; if (!showErrors(f, e)) return;
  const en = f.dataset.enrol ? myEnrol(u, f.dataset.enrol) : null;
  let id = uid('th'), live = false;
  if (LIVE_BACKEND && u.live && v.to !== 'u_admin' && (v.to === 'admin' || (userById(v.to) && userById(v.to).live))) {
    const r = await api('messages', { method: 'POST', body: { staffId: v.to, subject: v.subject, message: v.message, childId: en ? en.childId : '', classId: en ? en.classId : '' } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not send — please try again.'); return; }
    id = r.data.thread.id; live = true;
  }
  S.threads.push({ id, parentId: u.id, staffId: v.to, subject: v.subject, childId: en ? en.childId : '', classId: en ? en.classId : '', unreadParent: false, unreadStaff: true, messages: [{ from: u.id, text: v.message, at: nowStamp() }], live });
  save(); toast('Message sent.'); go('/my-mea/messages/' + id);
};
Forms.reply = async (f, v) => {
  const u = me(), t = S.threads.find(x => x.id === f.dataset.id); if (!v.reply || !t) return;
  if (LIVE_BACKEND && t.live) {
    const r = await api('messages', { method: 'POST', body: { threadId: t.id, message: v.reply } });
    if (!r.ok) { toast((r.data && r.data.error) || 'Could not send — please try again.'); return; }
  }
  t.messages.push({ from: u.id, text: v.reply, at: nowStamp() }); if (u.role === 'parent') t.unreadStaff = true; else t.unreadParent = true; save(); render({ keepScroll: true });
};
function parentMessages(p, q, u) {
  const list = myThreads(u), active = p.id ? openThread(u, p.id) : (window.innerWidth > 820 && list[0] ? openThread(u, list[0].id) : null);
  return { title: 'Messages', shell: 'parent', ptitle: 'Messages', psub: 'Secure messages with MEA staff and your child’s teachers', body: messagesPane(u, list, active, '/my-mea/messages', '/my-mea/messages/new'),
    after() { if (LIVE_BACKEND) { liveRefresh(mirrorMyThreads(u)); if (active && active.live) liveRefresh(mirrorThreadMessages(active.id)); } } };
}
R('/my-mea/messages', parentMessages, PR);
R('/my-mea/messages/:id', parentMessages, PR);
