'use strict';
/* =====================================================================
   MEA – parent portal part 2c: account settings, notifications, support
   ===================================================================== */
function settingsView(base, kind) {
  return (p, q, u) => {
    const tab = q.tab || 'profile', tabs = [['profile', 'Profile'], ['security', 'Security'], ['notifications', 'Notifications'], ['privacy', 'Privacy & consent']];
    const sw = (k, label, desc) => h`<label class="toggle"><span><strong>${label}</strong><br><span class="small muted">${desc}</span></span><span class="sw"><input type="checkbox" data-on="notifPref" data-k="${k}" ${u.notify[k] ? raw('checked') : ''}><span></span></span></label>`;
    let body;
    if (tab === 'profile') body = h`<div class="panel" style="max-width:640px"><h2>Profile</h2><form data-form="profile" novalidate><div class="form-grid">${fld({ name: 'name', label: 'Full name', req: 1, value: u.name, full: 1 })}<div class="field full"><span class="lbl">Email address</span><div class="inp" style="background:var(--bg-soft)">${u.email}</div><div class="hint">To change your email address, contact support.</div></div>${fld({ name: 'phone', label: 'Phone number', value: u.phone || '', auto: 'tel' })}${kind === 'parent' ? fld({ name: 'whatsapp', label: 'WhatsApp number', value: u.whatsapp || '', hint: 'Only if different.' }) : ''}</div><button class="btn btn-primary" type="submit" style="margin-top:16px">Save changes</button></form></div>`;
    else if (tab === 'security') body = h`<div class="panel" style="max-width:640px"><h2>Change password</h2><form data-form="changePw" novalidate class="stack">${fld({ name: 'current', label: 'Current password', type: 'password', req: 1, auto: 'current-password' })}${fld({ name: 'password', label: 'New password', type: 'password', req: 1, auto: 'new-password', hint: 'At least 8 characters, including a number.' })}${fld({ name: 'confirm', label: 'Confirm new password', type: 'password', req: 1, auto: 'new-password' })}<button class="btn btn-primary" type="submit">Update password</button></form></div>`;
    else if (tab === 'notifications') body = h`<div class="panel" style="max-width:640px"><h2>Notification preferences</h2>${sw('email', 'Email notifications', 'Receive important updates by email.')}${sw('messages', 'Message notifications', 'Be told when you get a new message.')}${sw('reminders', 'Class and homework reminders', 'Reminders for classes and homework.')}${sw('announcements', 'Announcements', 'Important announcements from MEA.')}</div>`;
    else body = h`<div class="panel" style="max-width:640px"><h2>Privacy &amp; consent</h2><label class="toggle"><span><strong>Marketing emails</strong><br><span class="small muted">Optional news and offers. This is separate from essential service messages.</span></span><span class="sw"><input type="checkbox" data-on="marketing" ${u.marketing ? raw('checked') : ''}><span></span></span></label><p style="margin-top:14px"><a href="#/terms">Terms &amp; Conditions</a> · <a href="#/privacy">Privacy Policy</a></p>${kind === 'parent' ? h`<p class="small muted">You can ask to see, correct or delete your data at any time.</p><a class="btn btn-outline" href="#/my-mea/support?topic=data-request">Data or account deletion request</a>` : ''}</div>`;
    return { title: 'Account Settings', shell: kind, ptitle: kind === 'parent' ? 'Account Settings' : 'Profile & Settings', picon: 'settings', psub: 'Manage your account and preferences', body: h`<div class="tabs" role="navigation" aria-label="Settings sections">${tabs.map(([id, l]) => h`<a href="#${base}${qs({ tab: id })}" ${tab === id ? raw('aria-current="page"') : ''}>${l}</a>`)}</div>${body}` };
  };
}
R('/my-mea/settings', settingsView('/my-mea/settings', 'parent'), PR);
Forms.profile = (f, v) => { const u = me(), e = {}; if (!v.name) e.name = 'Enter your full name.'; if (v.phone && !isUKPhone(v.phone)) e.phone = 'Enter a UK phone number, or leave this blank.'; if (!showErrors(f, e)) return; u.name = v.name; u.phone = v.phone; if (v.whatsapp !== undefined) u.whatsapp = v.whatsapp; save(); toast('Profile saved.'); render({ keepScroll: true }); };
Forms.changePw = (f, v) => {
  const u = me(), e = {}; if (u.pw !== hashPw(v.current, u.email)) e.current = 'That is not your current password.'; if (v.password.length < 8 || !/\d/.test(v.password)) e.password = 'Use at least 8 characters, including a number.'; if (v.confirm !== v.password) e.confirm = 'The passwords do not match.';
  if (!showErrors(f, e)) return; u.pw = hashPw(v.password, u.email); save(); f.reset(); toast('Password updated.');
};
Changes.notifPref = el => { me().notify[el.dataset.k] = el.checked; save(); toast('Preferences saved.'); };
Changes.marketing = el => { me().marketing = el.checked; save(); toast('Preference saved.'); };

/* ---------------- Notifications ---------------- */
R('/my-mea/notifications', (p, q, u) => {
  const F = UI.nf || '', all = myNotifs(u.id), list = all.filter(n => !F || n.type === F), un = all.filter(n => !n.read).length;
  const IC = { Classes: 'calendar', Homework: 'pencil', Enrolments: 'user-plus', Announcements: 'megaphone', Payments: 'credit-card' };
  return {
    title: 'Notifications', shell: 'parent', ptitle: 'Notifications', picon: 'bell', psub: un ? `${un} unread` : 'You’re all caught up', body: h`
    <div class="toolbar"><div class="pills" role="group" aria-label="Filter notifications"><button class="pill" data-act="nfFilter" data-t="" aria-pressed="${!F}">All</button>${Object.keys(IC).map(t => h`<button class="pill" data-act="nfFilter" data-t="${t}" aria-pressed="${F === t}">${t}</button>`)}</div><div class="grow"></div><button class="btn btn-outline btn-sm" data-act="nfReadAll" ${un ? '' : raw('disabled')}>Mark All Read</button><a class="btn btn-ghost btn-sm" href="#/my-mea/settings?tab=notifications">Notification preferences</a></div>
    ${list.length ? h`<div class="panel list" style="padding:6px 16px">${list.map(n => { const k = n.childId ? childById(n.childId) : null; return h`<button class="li ${n.read ? '' : 'unread'}" data-act="openNotif" data-id="${n.id}" style="width:100%;text-align:left;background:none;border:0;border-top:1px solid var(--line);cursor:pointer;color:inherit;font:inherit"><span class="ico c-blue">${ic(IC[n.type] || 'bell')}</span><span class="grow"><span class="t" style="display:block;font-weight:${n.read ? 500 : 700}">${n.text}</span><span class="s" style="display:block">${n.type}${k ? ' · ' + k.first : ''} · ${ago(n.date)}${n.read ? '' : ' · Unread'}</span></span>${ic('chevron-right')}</button>`; })}</div>` : emptyState({ icon: 'bell', title: 'No notifications', text: 'Class changes, new homework and enrolment updates will appear here.' })}`
  };
}, PR);
Actions.nfFilter = t => { UI.nf = t.dataset.t; render({ keepScroll: true }); };
Actions.nfReadAll = () => { S.notifications.filter(n => n.parentId === me().id).forEach(n => { n.read = true; }); save(); render({ keepScroll: true }); };
Actions.openNotif = t => { const n = S.notifications.find(x => x.id === t.dataset.id); if (!n) return; n.read = true; save(); go(n.route || '/my-mea'); };

/* ---------------- Help & Support ---------------- */
const SUP_TOPICS = [['course', 'Course / enrolment', 'book-open', 'Course & registration'], ['timetable', 'Timetable / class changes', 'calendar', 'Timetable / class changes'], ['homework', 'Homework / resources', 'folder', 'General enquiry'], ['payments', 'Payments', 'credit-card', 'Fees / payment'], ['technical', 'Technical / account access', 'key', 'Technical / account access'], ['data-request', 'Data & privacy', 'shield-check', 'General enquiry']];
R('/my-mea/support', (p, q, u) => {
  const topic = q.topic || UI.supTopic || '', sent = UI.supportSent, term = (UI.supQ || '').toLowerCase(), needKid = ['course', 'timetable', 'homework'].includes(topic);
  const faqs = S.faqs.filter(x => !term || (x.q + x.a).toLowerCase().includes(term)).slice(0, 5);
  return {
    title: 'Help & Support', shell: 'parent', ptitle: 'Help & Support', picon: 'help-circle', psub: 'We’re here to help', body: h`
    <div class="grid g3" style="margin-bottom:22px">${SUP_TOPICS.map(([id, l, i]) => h`<button type="button" class="card link pad-s" data-act="supTopic" data-t="${id}" aria-pressed="${topic === id}" style="text-align:left;${topic === id ? 'border-color:var(--blue-d);background:var(--blue-50)' : ''}"><span class="feat"><span class="ico c-blue">${ic(i)}</span><strong style="align-self:center">${l}</strong></span></button>`)}</div>
    <div class="cols-2b"><section class="panel"><h2><span class="l">${ic('search')}Quick answers</span></h2><div class="field"><label class="sr" for="sq">Search FAQs</label><input class="inp" id="sq" type="search" placeholder="Search common questions" value="${UI.supQ || ''}" data-on="supQ"></div><div style="margin-top:12px">${faqs.map(x => h`<details class="res-week"><summary>${x.q}${ic('chevron-down', 'chev')}</summary><div style="padding:0 18px 16px;color:#33506D">${x.a}</div></details>`)}</div><p class="small"><a href="#/faqs">View all FAQs</a></p></section>
    <section class="panel" id="support-form">${sent ? h`<div class="center" style="padding:14px 0"><div class="ico c-green lg" style="margin:0 auto 12px">${ic('check-circle')}</div><h2>Request sent</h2><p class="muted">Your reference is <strong>${sent.ref}</strong>. Our <strong>${sent.team}</strong> will reply by email within one working day.</p><button class="btn btn-outline" data-act="supAgain">Send another request</button></div>` : h`<h2><span class="l">${ic('send')}Contact support</span></h2><p class="form-note">Sending as <strong>${u.name}</strong> (${u.email}). We already have your account details.</p>
      <form data-form="support" novalidate class="stack">${fld({ name: 'topic', label: 'Topic', type: 'select', req: 1, ph: 'Choose a topic', value: topic, options: SUP_TOPICS.map(t => [t[0], t[1]]), attrs: 'data-on="supTopicSel"' })}${needKid ? fld({ name: 'child', label: 'Which child? (optional)', type: 'select', ph: 'Not about one child', options: myKids(u).map(k => [k.id, k.first]) }) : ''}${fld({ name: 'message', label: 'How can we help?', type: 'textarea', req: 1 })}<button class="btn btn-pink" type="submit">${ic('send')}Submit Support Request</button></form>`}</section></div>`
  };
}, PR);
Actions.supTopic = t => { UI.supTopic = t.dataset.t; UI.supportSent = null; setQuery({ topic: t.dataset.t }); };
Changes.supTopicSel = el => { UI.supTopic = el.value; setQuery({ topic: el.value }); };
Changes.supQ = el => { UI.supQ = el.value; render({ keepScroll: true }); };
Actions.supAgain = () => { UI.supportSent = null; render({ keepScroll: true }); };
Forms.support = async (f, v) => {
  const u = me(), e = {}; if (!v.topic) e.topic = 'Choose a topic.'; if (!v.message) e.message = 'Tell us how we can help.'; if (!showErrors(f, e)) return;
  const t = SUP_TOPICS.find(x => x[0] === v.topic), team = ENQ_TOPICS[t[3]];
  const msg = (v.child ? `[Child: ${childById(v.child).first}] ` : '') + v.message;
  let ref = 'MEA-' + (1040 + S.enquiries.length + 1), id = uid('q'), live = false;
  if (LIVE_BACKEND) {
    const r = await api('contact', { method: 'POST', body: { name: u.name, email: u.email, phone: u.phone, role: 'Parent (signed in)', topic: t[3], team, message: msg, portal: true } });
    if (r.ok) { ref = r.data.enquiry.ref; id = r.data.enquiry.id; live = true; }
  }
  S.enquiries.push({ id, ref, date: todayISO(), name: u.name, email: u.email, phone: u.phone, role: 'Parent (signed in)', topic: t[3], team, message: msg, status: 'New', portal: true, live });
  save(); UI.supportSent = { ref, team }; render({ keepScroll: true });
};
