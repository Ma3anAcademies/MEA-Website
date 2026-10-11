'use strict';
/* =====================================================================
   MEA – public pages, part 2
   ===================================================================== */

/* ---------------- TIMETABLES & FEES ---------------- */
R('/timetables-fees', (p, q, u) => {
  const sys = q.system || S.finder.system || 'eng', f = { sys, level: q.level || '', subject: q.subject || '', day: q.day ?? '' };
  const list = findClasses(f), sysO = SYS[sys];
  const dayOrder = c => Math.min(...c.days.map(d => (d.d + 6) % 7));
  const groups = activeLevels(sys).map(l => ({ l, rows: list.filter(c => clsCourse(c).level === l.id).sort((a, b) => dayOrder(a) - dayOrder(b) || a.days[0].start.localeCompare(b.days[0].start)) })).filter(g => g.rows.length);
  const subs = SUBJECTS.filter(s => !isOff('subjects', s.id) && findClasses({ sys, subject: s.id }).length);
  const rows = groups.map(g => h`<tr class="day-row"><td colspan="6">${g.l.name} <span class="muted small" style="font-weight:400">· ages ${g.l.ages}</span></td></tr>${g.rows.map(cl => {
    const co = clsCourse(cl), a = avail(cl), sc = schedText(cl), el = enrolLink(cl, u);
    return h`<tr>${td('Subject', h`<a href="#/courses/${co.slug}" class="strong">${co.title}</a>`)}${td('Level', levelName(co.level))}${td('Day', sc.days)}${td('Time (UK)', sc.time)}${td('Status', chip(a.label, a.cls, a.icon))}${td('', h`<a class="btn btn-outline btn-sm" href="#/courses/${co.slug}">View Course</a> ${el ? h`<a class="btn ${a.k === 'full' ? 'btn-outline-pink' : 'btn-pink'} btn-sm" href="#${el.href}">${el.label}</a>` : ''}`, 'act')}</tr>`;
  })}`);
  return {
    title: 'Timetable', body: h`${banner({ title: 'Timetable', sub: 'See available classes and times.', img: IMG.timetable, alt: 'A student in a headscarf and headphones writing notes at her laptop' })}
    <section class="sec"><div class="wrap"><div class="center" style="margin-bottom:22px"><div class="seg" role="group" aria-label="Education system">${Object.values(SYS).map(s => h`<button type="button" data-act="ttSys" data-sys="${s.id}" aria-pressed="${sys === s.id}">${flag(s.id, 24)}${s.short}</button>`)}</div></div>
      <div class="filters" style="margin-bottom:20px"><div class="fgrid" style="grid-template-columns:repeat(4,minmax(0,1fr))">
        <div class="field"><label for="tt_level">Stage / year</label><select class="sel" id="tt_level" data-on="tt" data-k="level"><option value="">All stages</option>${activeLevels(sys).map(l => h`<option value="${l.id}" ${f.level === l.id ? raw('selected') : ''}>${l.name}</option>`)}</select></div>
        <div class="field"><label for="tt_subject">Subject</label><select class="sel" id="tt_subject" data-on="tt" data-k="subject"><option value="">All subjects</option>${subs.map(s => h`<option value="${s.id}" ${f.subject === s.id ? raw('selected') : ''}>${s.name}</option>`)}</select></div>
        <div class="field"><label for="tt_day">Day</label><select class="sel" id="tt_day" data-on="tt" data-k="day"><option value="">Any day</option>${[1, 2, 3, 4, 5, 6, 0].map(d => h`<option value="${d}" ${String(f.day) === String(d) ? raw('selected') : ''}>${DAYS[d]}</option>`)}</select></div>
        <div class="row"><button class="btn btn-outline" data-act="ttReset">Reset</button></div></div></div>
      <h2 style="font-size:1.4rem">Weekly timetable · ${sysO.short}</h2>
      ${groups.length ? tableHTML(['Subject', 'Level', 'Day', 'Time (UK)', 'Status', ''], rows) : emptyState({ icon: 'calendar', title: 'No classes match those filters', text: 'Try a different stage, subject or day.', action: h`<button class="btn btn-outline" data-act="ttReset">Reset filters</button>` })}
      <p class="small muted" style="margin-top:12px">${ic('info')} All times are UK time. Timetables are subject to change and additional sessions may be added based on demand. This timetable uses the same class data as My MEA.</p></div></section>
    ${ctaBand('Ready to find the perfect class for your child?', 'Create a parent account for new families, or sign in to enrol.', h`${btn('Create Parent Account', '/account/create', 'btn-yellow')}${btn(u ? 'Go to My MEA' : 'Sign In to Enrol', u ? homeFor(u) : '/account/sign-in', 'btn-white')}`)}`
  };
});
Actions.ttSys = t => { S.finder.system = t.dataset.sys; save(); setQuery({ system: t.dataset.sys, level: '', subject: '', day: '' }); };
Changes.tt = el => setQuery({ [el.dataset.k]: el.value });
Actions.ttReset = () => setQuery({ level: '', subject: '', day: '' });

/* ---------------- STUDENT SUCCESS ---------------- */
R('/student-success', (p, q, u) => {
  const f = { sys: q.system || '', subject: q.subject || '' };
  const stories = S.stories.filter(s => s.pub && (!f.sys || s.sys === f.sys) && (!f.subject || s.subject === f.subject));
  const boards = new Set(S.courses.map(c => c.board).filter(Boolean));
  const subjIds = [...new Set(S.stories.filter(s => s.pub).map(s => s.subject))];
  return {
    title: 'Student Success', body: h`${banner({ title: 'Student Success', sub: 'Celebrating progress, achievement and confidence.', img: IMG.success, alt: 'A smiling student in headphones studying on a laptop', actions: h`${btn('Find a Course', '/courses' + qs({ at: 'course-finder' }), 'btn-primary', 'search')}${u ? '' : btn('Create Parent Account', '/account/create', 'btn-pink')}` })}
    <section class="sec" style="padding-bottom:20px"><div class="wrap"><div class="grid g4">${[['globe', Object.keys(SYS).length, 'Education systems'], ['book-open', activeSubjects().length, 'Subjects taught'], ['layers', Object.values(SYS).reduce((a, s) => a + activeLevels(s.id).length, 0), 'Levels and stages'], ['award', boards.size, 'Exam boards supported']].map(([i, n, l]) => h`<div class="card metric"><span class="ico c-blue">${ic(i)}</span><div><div class="num">${n}</div><div class="lab">${l}</div></div></div>`)}</div></div></section>
    <section class="sec" style="padding-top:20px"><div class="wrap"><div class="row between" style="margin-bottom:18px"><h2 style="margin:0">Achievement stories</h2>
      <div class="row"><div class="field"><label class="sr" for="ss_sys">Education system</label><select class="sel" id="ss_sys" data-on="ss" data-k="system"><option value="">All education systems</option>${Object.values(SYS).map(s => h`<option value="${s.id}" ${f.sys === s.id ? raw('selected') : ''}>${s.short}</option>`)}</select></div>
      <div class="field"><label class="sr" for="ss_sub">Subject</label><select class="sel" id="ss_sub" data-on="ss" data-k="subject"><option value="">All subjects</option>${subjIds.map(s => h`<option value="${s}" ${f.subject === s ? raw('selected') : ''}>${subj(s).name}</option>`)}</select></div></div></div>
      ${stories.length ? carousel('ss-stories-car', raw(stories.map(s => h`<article class="card story car-item-lg"><img src="${IMG[s.img]}" alt="Portrait of ${s.name}" width="120" height="110"><div><div class="chips" style="margin-bottom:6px">${chip(levelName(s.level), 'chip-blue')}${chip(subj(s.subject).name, 'chip-grey')}</div><h3>${s.title}</h3><p class="small muted">${s.summary}</p><a class="strong small" href="#/student-success/${s.slug}">Read ${s.name}’s story ${'→'}</a></div></article>`).join('')), 'Achievement stories') : emptyState({ icon: 'trophy', title: 'No stories match those filters', text: 'Try another subject or education system.', action: h`<button class="btn btn-outline" data-act="ssReset">Reset filters</button>` })}
      <p class="small muted" style="margin-top:14px">Preview note: stories, names and quotes shown are sample content. Only verified results and permission-approved stories should be published.</p></div></section>
    <section class="sec soft"><div class="wrap"><div class="sec-head"><h2>What students and parents say</h2></div>${carousel('ss-testi-car', raw(S.testimonials.filter(t => t.pub).map(t => h`<figure class="card quote car-item-lg" style="margin:0"><div class="stars" aria-label="5 out of 5 stars">${[1, 2, 3, 4, 5].map(() => ic('star'))}</div><blockquote style="margin:8px 0 0"><p class="q">“${t.q}”</p></blockquote><figcaption class="by">${t.by}, ${t.role}<small>${t.place}</small></figcaption></figure>`).join('')), 'Testimonials')}</div></section>
    <section class="sec"><div class="wrap"><div class="sec-head"><h2>Why families stay with MEA</h2></div><div class="grid g5">${[['users', 'Expert teachers', 'Qualified, experienced and passionate.'], ['user', 'Personalised learning', 'Lessons tailored to each child.'], ['trending-up', 'Clear progress', 'Regular feedback and updates.'], ['headset', 'Dedicated support', 'We are here every step of the way.'], ['shield-check', 'Safe and trusted', 'A secure, supportive learning space.']].map(([i, t, d], n) => h`<div class="card center pad-s"><span class="ico c-${['blue', 'yellow', 'pink', 'blue', 'yellow'][n]}" style="margin:0 auto 10px">${ic(i)}</span><h3 style="font-size:1rem">${t}</h3><p class="small muted mb0">${d}</p></div>`)}</div></div></section>
    ${ctaBand('Ready to see your child succeed?', 'Find a class that fits their level, subject and schedule.', h`${btn('Find a Course', '/courses' + qs({ at: 'course-finder' }), 'btn-yellow')}${btn(u ? 'Go to My MEA' : 'Create Parent Account', u ? homeFor(u) : '/account/create', 'btn-white')}`)}`
  };
});
Changes.ss = el => setQuery({ [el.dataset.k]: el.value });
Actions.ssReset = () => setQuery({ system: '', subject: '' });
R('/student-success/:slug', (p, q, u) => {
  const s = S.stories.find(x => x.slug === p.slug && x.pub); if (!s) return notFoundView();
  const co = courseBySlug(s.courseKey);
  return {
    title: s.title, body: h`<section class="banner"><div class="wrap"><div><div class="crumbs"><a href="#/student-success">Student Success</a> / ${s.name}</div><div class="chips" style="margin-bottom:10px">${chip(SYS[s.sys].short, 'chip-grey', 'globe')}${chip(levelName(s.level), 'chip-blue')}${chip(subj(s.subject).name, 'chip-grey')}${s.board ? chip(s.board, 'chip-grey') : ''}</div><h1>${s.title}</h1><p class="sub">${s.summary}</p></div><div class="photo"><img src="${IMG[s.img]}" alt="Portrait of ${s.name}" style="aspect-ratio:1.2;object-position:center top;max-height:320px;margin-left:auto;width:auto;border-radius:24px"></div></div></section>
    <section class="sec"><div class="wrap prose"><h2 style="margin-top:0">The challenge</h2><p>${s.challenge}</p><h2>The support</h2><p>${s.support}</p><h2>The outcome</h2><p><strong>${s.outcome}</strong></p>
      <div class="card quote" style="background:var(--blue-50)"><p class="q">“${s.quote}”</p><div class="by">${s.name}</div></div>
      <p class="small muted">Sample story for design preview. Publish only with the student’s and parent’s permission.</p>
      <div class="row" style="margin-top:22px">${co ? btn('View ' + co.title, '/courses/' + co.slug, 'btn-primary') : ''}${btn('Find a Course', '/courses' + qs({ at: 'course-finder' }), 'btn-outline')}${btn('More stories', '/student-success', 'btn-ghost')}</div></div></section>${stdCTA(u)}`
  };
});

/* ---------------- RESOURCES ---------------- */
R('/resources', (p, q, u) => {
  const cat = q.cat || '', term = (q.q || '').toLowerCase();
  const items = [...GUIDES.map(g => ({ ...g, href: '#/resources/' + g.slug })), ...OFFICIAL_LINKS.map(o => ({ ...o, type: 'Official link', summary: 'Opens an official UK education website in a new tab.', ext: true, href: o.url }))]
    .filter(i => (!cat || i.cat === cat) && (!term || (i.title + i.summary).toLowerCase().includes(term)));
  const feat = GUIDES.find(g => g.slug === 'supporting-your-child-through-exams');
  const tcol = { Guide: 'chip-blue', Checklist: 'chip-yellow', 'Official link': 'chip-purple' };
  return {
    title: 'Resources', body: h`${banner({ title: 'Resources', sub: 'Practical guidance for navigating your child’s education journey.' })}
    <section class="sec" style="padding-top:8px"><div class="wrap"><div class="grid g3">${GUIDE_CATS.map(c => h`<button type="button" class="card link" data-act="resCat" data-cat="${c.id}" style="text-align:left;${cat === c.id ? 'border-color:var(--blue-d);background:var(--blue-50)' : ''}" aria-pressed="${cat === c.id}"><div class="feat"><span class="ico c-${c.color}">${ic(c.icon)}</span><div><h3>${c.name}</h3><p>${c.blurb}</p></div></div></button>`)}</div></div></section>
    ${feat && !cat && !term ? h`<section class="sec soft"><div class="wrap"><div class="card" style="display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:24px;align-items:center;background:linear-gradient(120deg,#fff,#EAF5FC)"><div><div class="small strong t-blue">Featured guide</div><h2 style="font-size:1.6rem">${feat.title}</h2><p class="muted">${feat.summary}</p>${btn('Read the full guide', '/resources/' + feat.slug, 'btn-pink', 'arrow-right')}</div><img src="${IMG.guide}" alt="A young girl in headphones writing while studying" style="border-radius:18px;max-height:230px;width:100%;object-fit:cover"></div></div></section>` : ''}
    <section class="sec"><div class="wrap"><div class="row between" style="margin-bottom:16px"><h2 style="margin:0;font-size:1.5rem">${cat ? GUIDE_CATS.find(c => c.id === cat).name : 'All resources'}</h2><div class="row">${cat ? h`<button class="btn btn-outline btn-sm" data-act="resCat" data-cat="">Show all</button>` : ''}<div class="field"><label class="sr" for="res_q">Search resources</label><input class="inp" id="res_q" type="search" placeholder="Search resources" value="${q.q || ''}" data-on="resQ" style="min-width:240px"></div></div></div>
      ${items.length ? h`<div class="grid g2">${items.map(i => h`<a class="card link" href="${i.href}" ${i.ext ? raw('target="_blank" rel="noopener noreferrer"') : ''}><div class="row between"><div class="chips">${chip(i.type, tcol[i.type])}${i.mins ? chip(i.mins + ' min read', 'chip-grey', 'clock') : ''}</div>${ic(i.ext ? 'external-link' : 'chevron-right')}</div><h3 style="margin-top:10px">${i.title}${i.ext ? h`<span class="sr"> (opens in a new tab)</span>` : ''}</h3><p class="small muted mb0">${i.summary}</p></a>`)}</div>` : emptyState({ icon: 'search', title: 'No resources found', text: 'Try a different search or category.', action: h`<button class="btn btn-outline" data-act="resCat" data-cat="">Show all resources</button>` })}
      <p class="small muted" style="margin-top:18px">These resources are general guidance. Lesson slides, worksheets and homework are private and available only in <a href="#/my-mea/learning">My MEA</a> for enrolled families.</p></div></section>
    ${ctaBand('Need help choosing?', 'Our team can help you understand levels, subjects and exam boards.', h`${btn('Contact MEA', '/contact', 'btn-yellow')}${btn('Find a Course', '/courses' + qs({ at: 'course-finder' }), 'btn-white')}`)}`
  };
});
Actions.resCat = t => setQuery({ cat: t.dataset.cat, q: '' });
Changes.resQ = el => setQuery({ q: el.value });
R('/resources/:slug', (p, q, u) => {
  const g = GUIDES.find(x => x.slug === p.slug); if (!g) return notFoundView();
  const cat = GUIDE_CATS.find(c => c.id === g.cat), more = GUIDES.filter(x => x.slug !== g.slug && x.cat === g.cat).concat(GUIDES.filter(x => x.slug !== g.slug && x.cat !== g.cat)).slice(0, 3);
  return {
    title: g.title, body: h`${banner({ title: g.title, sub: g.summary, crumbs: h`<div class="crumbs"><a href="#/resources">Resources</a> / <a href="#/resources${qs({ cat: cat.id })}">${cat.name}</a></div>` })}
    <section class="sec"><div class="wrap"><div class="prose">${raw(g.body)}<div class="alert alert-info" style="margin-top:24px">${ic('info')}<span>This is general guidance and does not replace advice from your child’s school. Check official sources for the latest requirements.</span></div></div></div></section>
    <section class="sec soft"><div class="wrap"><h2 style="font-size:1.4rem">More guides</h2><div class="grid g3">${more.map(m => h`<a class="card link" href="#/resources/${m.slug}"><div class="chips">${chip(m.type, 'chip-blue')}</div><h3 style="margin-top:8px;font-size:1.05rem">${m.title}</h3><p class="small muted mb0">${m.summary}</p></a>`)}</div></div></section>${stdCTA(u)}`
  };
});

/* ---------------- FAQs ---------------- */
R('/faqs', (p, q, u) => {
  const cat = q.cat || '', term = (q.q || '').toLowerCase();
  const list = S.faqs.filter(x => (!cat || x.cat === cat) && (!term || (x.q + ' ' + x.a).toLowerCase().includes(term)));
  if (!UI.faqOpen) UI.faqOpen = window.innerWidth > 760 && S.faqs[0] ? [S.faqs[0].id] : [];
  const cats = FAQ_CATS.filter(c => S.faqs.some(x => x.cat === c));
  const CI = { 'About MEA': 'info', 'Courses & levels': 'book-open', 'England / Scotland routes': 'globe', 'Registration & accounts': 'user-plus', 'Adding children': 'users', 'Timetables': 'calendar', 'Fees & payments': 'credit-card', 'Lessons & homework': 'folder', 'Technical access': 'key', 'Absence & missed classes': 'clock', 'Contact & support': 'headset' };
  return {
    title: 'FAQs', body: h`<section class="banner no-photo"><div class="wrap"><div><h1>Frequently asked questions</h1><p class="sub">Find quick answers about our courses, timetables, fees, and how MEA supports your child’s learning.</p>
      <div class="field" style="max-width:560px;margin-top:20px"><label class="sr" for="faq_q">Search for a question</label><div class="sbox"><input class="inp" id="faq_q" type="search" placeholder="Search for a question…" value="${q.q || ''}" data-on="faqQ" style="padding-left:44px">${ic('search')}</div></div></div></div></section>
    <section class="sec" style="padding-top:20px"><div class="wrap"><div class="pills" style="margin-bottom:22px" role="group" aria-label="Question categories"><button class="pill" data-act="faqCat" data-cat="" aria-pressed="${!cat}">${ic('grid')}All categories</button>${cats.map(c => h`<button class="pill" data-act="faqCat" data-cat="${c}" aria-pressed="${cat === c}">${ic(CI[c] || 'info')}${c}</button>`)}</div>
      <div style="display:grid;grid-template-columns:minmax(0,1.8fr) minmax(0,1fr);gap:28px;align-items:start" class="faq-grid"><div>${list.length ? list.map((x, i) => { const o = UI.faqOpen.includes(x.id); return h`<div class="acc-item"><h3 style="margin:0;font-size:1rem"><button class="acc-q" data-act="faqToggle" data-id="${x.id}" aria-expanded="${o}" aria-controls="fa_${x.id}" id="fq_${x.id}"><span class="ico c-${['pink', 'blue', 'yellow', 'green', 'purple'][i % 5]}">${ic(CI[x.cat] || 'help-circle')}</span><span>${x.q}</span>${ic('chevron-down', 'chev')}</button></h3><div class="acc-a" id="fa_${x.id}" role="region" aria-labelledby="fq_${x.id}" ${o ? '' : raw('hidden')}>${x.a}</div></div>`; }) : emptyState({ icon: 'search', title: 'No questions found', text: 'Try different words, or contact our team and we will help.', action: btn('Contact MEA', '/contact', 'btn-primary') })}
        <p class="small muted" style="margin-top:16px">Can’t find the answer? <a href="#/contact">Contact our support team</a>.</p></div>
      <aside class="stack"><div class="card"><h3>Still need help?</h3><p class="small muted">Our support team is here for you.</p>${SITE.whatsapp ? h`<p class="row small" style="gap:8px;margin-bottom:6px">${ic('message-circle')}<a href="https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Hello, I have a question about MEA courses.')}" target="_blank" rel="noopener noreferrer">WhatsApp us<span class="sr"> (opens in a new tab)</span></a></p>` : ''}<p class="row small" style="gap:8px;margin-bottom:6px">${ic('mail')}<a href="mailto:${SITE.email}">${SITE.email}</a></p><p class="row small" style="gap:8px">${ic('phone')}<a href="tel:${SITE.phoneHref}">${SITE.phone}</a></p><a class="btn btn-pink btn-block" href="#/contact">Contact Support</a></div>
      <div class="card"><h3>Popular topics</h3><ul class="small stack" style="margin:0"><li><a href="#/faqs?cat=${encodeURIComponent('Registration & accounts')}">How to register your child</a></li><li><a href="#/resources/choosing-the-right-level">Understanding our levels</a></li><li><a href="#/timetables-fees">Timetables and fees</a></li><li><a href="#/faqs?cat=${encodeURIComponent('Lessons & homework')}">Lessons and the Learning Hub</a></li></ul></div></aside></div></div></section>
    <section class="sec soft"><div class="wrap"><div class="sec-head"><h2>How the MEA parent portal works</h2></div><ol class="steps" style="list-style:none;padding:0;margin:0">${[['key', 'Sign in', 'Access your account securely with your email and password.'], ['bar-chart', 'View your children', 'See each child’s courses, next classes and stage.'], ['calendar', 'Check the timetable', 'One family timetable for all your children.'], ['folder', 'Open the Learning Hub', 'Find lesson resources and homework by week.'], ['mail', 'Message the team', 'Contact MEA staff securely from your account.']].map(([i, t, d], n) => h`<li class="step"><span class="n">${n + 1}</span><span class="ico c-blue">${ic(i)}</span><h3>${t}</h3><p>${d}</p></li>`)}</ol></div></section>${stdCTA(u)}`
  };
});
Actions.faqToggle = t => { const id = t.dataset.id, o = t.getAttribute('aria-expanded') !== 'true'; UI.faqOpen = UI.faqOpen.filter(x => x !== id); if (o) UI.faqOpen.push(id); t.setAttribute('aria-expanded', o); document.getElementById('fa_' + id).hidden = !o; };
Actions.faqCat = t => setQuery({ cat: t.dataset.cat });
Changes.faqQ = el => setQuery({ q: el.value });

/* ---------------- CONTACT ---------------- */
R('/contact', (p, q, u) => {
  const sent = UI.contactSent;
  const wa = SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Hello, I have a question about MEA courses.')}` : '';
  const soc = Object.entries(SITE.social).filter(([, v]) => v);
  return {
    title: 'Contact Us', body: h`${banner({ title: 'Contact MEA', sub: 'We’re here to help you find the right support for your child.', img: IMG.contact, alt: 'A mother and her son smiling as they use a laptop together' })}
    <section class="sec" style="padding-top:8px"><div class="wrap"><div class="grid g3" style="margin-bottom:26px">
      ${wa ? h`<a class="card link feat" href="${wa}" target="_blank" rel="noopener noreferrer"><span class="ico c-green">${ic('message-circle')}</span><div><h3>WhatsApp<span class="sr"> (opens in a new tab)</span></h3><p>Message us on ${SITE.phone}</p></div></a>` : ''}
      <a class="card link feat" href="mailto:${SITE.email}"><span class="ico c-blue">${ic('mail')}</span><div><h3>Email us</h3><p>${SITE.email}</p></div></a>
      <a class="card link feat" href="tel:${SITE.phoneHref}"><span class="ico c-pink">${ic('phone')}</span><div><h3>Call us</h3><p>${SITE.phone} · ${SITE.hours}</p></div></a></div>
      <div class="two-col contact-cols"><div class="stack">
        <div class="card"><h3>Support hours</h3><p class="row" style="gap:10px">${ic('clock')}<span>${SITE.hours}</span></p><p class="small muted mb0">We aim to reply within one working day.</p></div>
        <div class="card"><h3>Online across the UK</h3><p class="small muted mb0">MEA provides online tuition and support to families across the UK. Classes are live, so there is no need to travel.</p></div>
        <div class="card"><h3>Not sure which course?</h3><p class="small muted">Use the Course Finder or read our level guide.</p><div class="row">${btn('Course Enquiry', '/courses' + qs({ at: 'course-finder' }), 'btn-outline')}${u ? '' : btn('Sign in for account support', '/account/sign-in', 'btn-ghost')}</div></div>
        ${soc.length ? h`<div class="card"><h3>Connect with us</h3><div class="socials">${soc.map(([k, v]) => h`<a href="${v}" target="_blank" rel="noopener noreferrer" aria-label="MEA on ${cap(k)}">${ic(k)}</a>`)}</div></div>` : ''}</div>
      <div class="card" id="contact-form">${sent ? h`<div class="center" style="padding:20px 0"><div class="ico c-green lg" style="margin:0 auto 14px">${ic('check-circle')}</div><h2>Thank you, your enquiry has been sent</h2><p class="muted">Your reference is <strong>${sent.ref}</strong>. It has been passed to our <strong>${sent.team}</strong> and we aim to reply within one working day.</p><button class="btn btn-outline" data-act="contactAgain">Send another enquiry</button></div>` : h`
        <h2 style="font-size:1.4rem">Send us a message</h2><p class="form-note">Fill out the form below and our team will get back to you shortly.</p>
        <form data-form="contact" novalidate><div class="form-grid">
          ${fld({ name: 'name', label: 'Full name', req: 1, value: u ? u.name : '', auto: 'name' })}${fld({ name: 'email', label: 'Email address', type: 'email', req: 1, value: u ? u.email : '', auto: 'email' })}
          ${fld({ name: 'phone', label: 'Phone / WhatsApp', value: u ? u.phone : '', auto: 'tel', ph: 'e.g. 07xxx xxxxxx' })}${fld({ name: 'role', label: 'I am a', type: 'select', req: 1, ph: 'Select your role', options: ['Parent / guardian', 'Student', 'Teacher or other'] })}
          ${fld({ name: 'topic', label: 'Enquiry type', type: 'select', req: 1, ph: 'What is your enquiry about?', options: Object.keys(ENQ_TOPICS), full: 1, hint: 'This sends your enquiry to the right team.' })}
          ${fld({ name: 'message', label: 'Your message', type: 'textarea', req: 1, full: 1, ph: 'How can we help?' })}</div>
          <p class="form-note" style="margin-top:12px">${ic('lock')} Please do not include sensitive information about your child in this form.</p>
          <button class="btn btn-pink" type="submit" style="margin-top:8px">${ic('send')}Send Enquiry</button></form>`}</div></div></div></section>`
  };
});
Forms.contact = async (f, v) => {
  const e = {};
  if (!v.name) e.name = 'Enter your full name.'; if (!isEmail(v.email)) e.email = 'Enter a valid email address, for example name@example.com.';
  if (v.phone && !isUKPhone(v.phone)) e.phone = 'Enter a UK phone number, or leave this blank.';
  if (!v.role) e.role = 'Choose the option that describes you.'; if (!v.topic) e.topic = 'Choose what your enquiry is about.'; if (!v.message) e.message = 'Tell us how we can help.';
  if (!showErrors(f, e)) return;
  const team = ENQ_TOPICS[v.topic];
  let ref = 'MEA-' + (1040 + S.enquiries.length + 1), id = uid('q'), live = false;
  if (LIVE_BACKEND) {
    const r = await api('contact', { method: 'POST', body: { name: v.name, email: v.email, phone: v.phone, role: v.role, topic: v.topic, team, message: v.message } });
    if (r.ok) { ref = r.data.enquiry.ref; id = r.data.enquiry.id; live = true; }
  }
  S.enquiries.push({ id, ref, date: todayISO(), name: v.name, email: v.email, phone: v.phone, role: v.role, topic: v.topic, team, message: v.message, status: 'New', live });
  save(); UI.contactSent = { ref, team }; render({ keepScroll: true });
};
Actions.contactAgain = () => { UI.contactSent = null; render({ keepScroll: true }); };

/* ---------------- LEGAL ---------------- */
const LEGAL = {
  privacy: ['Privacy Policy', ['We collect only the information needed to deliver and administer MEA classes, such as parent contact details and each child’s name, stage and enrolments.', 'Required service information is kept separate from optional marketing consent. You can change your marketing preference at any time in Account Settings.', 'Parents can only see their own children’s information. Teachers see only the classes they teach.', 'You can request access to, correction of, or deletion of your data from Help & Support in My MEA.', 'We keep records only for as long as they are needed for education delivery, administration and legal obligations.']],
  terms: ['Terms & Conditions', ['Enrolment is confirmed by MEA. Requests may show as Pending Confirmation until a place is confirmed.', 'Fees are charged per lesson, billed either monthly or termly as chosen at enrolment, in advance. You may cancel or pause with 7 days’ notice.', 'Lesson resources and homework are for enrolled families only and may not be shared publicly.', 'Class times may change; we will notify you through My MEA and by email.', 'Full refund and cancellation wording will be confirmed by MEA before launch.']],
  cookies: ['Cookies Policy', ['This website uses only the storage needed to remember your sign-in and Course Finder choices.', 'Optional analytics or marketing cookies, if introduced later, will only be used with your consent.', 'You can clear stored data from your browser settings at any time.']],
  safeguarding: ['Safeguarding', ['MEA is committed to keeping children safe. Teacher communication with families takes place through approved MEA channels.', 'Teacher phone numbers and personal email addresses are never published.', 'In the first release, direct messaging is between parents and MEA staff or assigned teachers only. There is no private teacher-to-student messaging.', 'If you have a concern about a child’s wellbeing, contact MEA straight away using the Contact page.']]
};
Object.keys(LEGAL).forEach(k => R('/' + k, (p, q, u) => ({
  title: LEGAL[k][0], body: h`${banner({ title: LEGAL[k][0], sub: '' })}<section class="sec" style="padding-top:0"><div class="wrap prose"><div class="alert alert-warn">${ic('alert-triangle')}<span>Draft summary for design preview. Final policy wording must be reviewed by MEA’s legal and data protection adviser before launch.</span></div><ul style="margin-top:20px">${LEGAL[k][1].map(x => h`<li>${x}</li>`)}</ul></div></section>`
})));

/* ---------------- ACCOUNT / AUTH ---------------- */
function safeReturn(r) { return r && r.startsWith('/') && !r.startsWith('//') ? r : ''; }
function authLayout(title, intro, inner, after) {
  return { title, body: h`<div class="auth"><div class="auth-card"><h1>${title}</h1>${intro ? h`<p class="muted">${intro}</p>` : ''}${inner}</div><div class="auth-side"><img src="${IMG.emblem}" alt="" style="width:120px"><h2>One account for every child</h2><ul class="ticks">${['Find and enrol in the right class', 'See a single family timetable', 'Open lesson resources and homework in one place', 'Message the MEA team securely'].map(x => h`<li>${ic('check-circle')}<span>${x}</span></li>`)}</ul></div></div>`, nofooter: true, after };
}
R('/account/sign-in', (p, q, u) => {
  if (u && !q.stay) return { redirect: safeReturn(q.return) || homeFor(u) };
  return authLayout('Sign in to My MEA', 'Welcome back. Sign in to see your children’s classes, homework and updates.', h`
  <form data-form="signin" novalidate class="stack"><input type="hidden" name="return" value="${safeReturn(q.return)}">
    ${fld({ name: 'email', label: 'Email address', type: 'email', req: 1, auto: 'username' })}${fld({ name: 'password', label: 'Password', type: 'password', req: 1, auto: 'current-password' })}
    <div class="row between"><a class="small" href="#/account/password-reset">Forgot password?</a></div>
    <button class="btn btn-primary btn-block" type="submit">Sign In</button></form>
  <p style="margin-top:18px">New to MEA? <a href="#/account/create${qs({ return: safeReturn(q.return) })}"><strong>Create a parent account</strong></a></p>
  <div class="demo-box"><strong>Preview: try the demo accounts</strong><p class="small muted mb0">Password for all demo accounts: <code>demo1234</code></p><div class="row"><button class="btn btn-outline btn-sm" data-act="demoIn" data-role="parent">Parent</button><button class="btn btn-outline btn-sm" data-act="demoIn" data-role="teacher">Teacher</button><button class="btn btn-outline btn-sm" data-act="demoIn" data-role="admin">Admin</button></div></div>`);
});
function signInUser(user, ret) { S.session = user.id; save(); toast(`Welcome back, ${user.name.split(' ')[0]}.`); go(safeReturn(ret) || (user.role === 'parent' && !childrenOf(user.id).length ? '/my-mea/children/add?first=1' : homeFor(user)), true); }
Forms.signin = async (f, v) => {
  // Not strictly an email format: the site admin's username (set in Netlify's environment
  // variables) goes in this same field, and doesn't have to look like an email address.
  const e = {}; if (!v.email) e.email = 'Enter your email address.'; if (!v.password) e.password = 'Enter your password.'; if (!showErrors(f, e)) return;
  if (LIVE_BACKEND) {
    const r = await api('login', { method: 'POST', body: { email: v.email, password: v.password } });
    if (!r.ok) {
      if (r.status === 403 && r.data && r.data.needsVerification) { go('/account/verify-email' + qs({ email: r.data.email }), true); return; }
      showErrors(f, { password: (r.data && r.data.error) || 'That email and password do not match. Check them and try again, or reset your password.' }); return;
    }
    const user = mirrorSignedInUser(r.data.user);
    if (user.role === 'parent') await mirrorChildrenFromServer(user.id);
    if (user.role === 'teacher') await mirrorMyStudents();
    await syncCatalog(user); await mirrorEnrolments(user); await mirrorEnquiries(user); await mirrorDirectory(user); await mirrorAllInvoices(user);
    if (user.role === 'parent') await mirrorAllMyHomework(user.id);
    if (user.role === 'parent') await mirrorMyInvoices();
    signInUser(user, v.return);
    return;
  }
  const user = S.users.find(x => x.email.toLowerCase() === v.email.toLowerCase() && !x.synthetic);
  if (!user || user.pw !== hashPw(v.password, user.email)) { showErrors(f, { password: 'That email and password do not match. Check them and try again, or reset your password.' }); return; }
  if (!user.verified) { go('/account/verify-email' + qs({ email: user.email, return: v.return }), true); return; }
  signInUser(user, v.return);
};
Actions.demoIn = t => { const u = S.users.find(x => x.role === t.dataset.role && (t.dataset.role !== 'teacher' || x.id === 't_aisha') && !x.synthetic); signInUser(u, Q.return); };
R('/account/create', (p, q, u) => {
  if (u) return { redirect: homeFor(u) };
  return authLayout('Create your parent account', 'It takes a few minutes. You will add your children after your account is created.', h`
  <form data-form="create" novalidate><input type="hidden" name="return" value="${safeReturn(q.return)}"><div class="form-grid">
    ${fld({ name: 'name', label: 'Parent / guardian full name', req: 1, full: 1, auto: 'name' })}${fld({ name: 'email', label: 'Email address', type: 'email', req: 1, full: 1, auto: 'email' })}
    ${fld({ name: 'phone', label: 'UK contact number', req: 1, auto: 'tel', ph: '07xxx xxxxxx' })}${fld({ name: 'whatsapp', label: 'WhatsApp number', req: 1, hint: 'We use this to reach you about your child’s classes.', ph: '07xxx xxxxxx' })}
    ${fld({ name: 'password', label: 'Password', type: 'password', req: 1, auto: 'new-password', hint: 'At least 8 characters, including a number.' })}${fld({ name: 'confirm', label: 'Confirm password', type: 'password', req: 1, auto: 'new-password' })}</div>
    <div class="stack" style="margin-top:14px">${chk('terms', h`I agree to the <a href="#/terms" target="_blank">Terms &amp; Conditions</a> and <a href="#/privacy" target="_blank">Privacy Policy</a>. <span aria-hidden="true">*</span>`, false, true)}${chk('marketing', 'Send me occasional news and offers from MEA (optional).', false)}</div>
    <button class="btn btn-pink btn-block" type="submit" style="margin-top:18px">Create Account</button></form>
  <p style="margin-top:18px">Already registered? <a href="#/account/sign-in${qs({ return: safeReturn(q.return) })}"><strong>Sign in</strong></a></p>`);
});
Forms.create = async (f, v) => {
  const e = {};
  if (!v.name) e.name = 'Enter your full name.'; if (!isEmail(v.email)) e.email = 'Enter a valid email address, for example name@example.com.';
  else if (!LIVE_BACKEND && S.users.some(x => x.email.toLowerCase() === v.email.toLowerCase() && !x.synthetic)) e.email = 'An account with this email already exists. Sign in instead, or reset your password.';
  if (!isUKPhone(v.phone)) e.phone = 'Enter a UK phone number, for example 07123 456789.';
  if (!v.whatsapp) e.whatsapp = 'Enter a WhatsApp number.'; else if (!isUKPhone(v.whatsapp)) e.whatsapp = 'Enter a UK number, for example 07123 456789.';
  if (v.password.length < 8 || !/\d/.test(v.password)) e.password = 'Use at least 8 characters, including a number.';
  if (v.confirm !== v.password) e.confirm = 'The passwords do not match.'; if (!v.terms) e.terms = 'You need to accept the terms and privacy policy to create an account.';
  if (!showErrors(f, e)) return;
  if (LIVE_BACKEND) {
    const r = await api('register', { method: 'POST', body: { name: v.name, email: v.email, phone: v.phone, whatsapp: v.whatsapp, password: v.password } });
    if (!r.ok) { showErrors(f, { [(r.data && r.data.field) || 'email']: (r.data && r.data.error) || 'Something went wrong. Please try again.' }); return; }
    if (r.data.needsVerification) { go('/account/verify-email' + qs({ email: r.data.email, return: v.return }), true); return; }
    mirrorSignedInUser(r.data.user);
    await syncCatalog(r.data.user);
    toast('Account created.'); go(safeReturn(v.return) || '/my-mea/children/add?first=1', true);
    return;
  }
  const user = { id: uid('u'), role: 'parent', name: v.name, email: v.email, phone: v.phone, whatsapp: v.whatsapp, pw: hashPw(v.password, v.email), verified: false, marketing: !!v.marketing, notify: { email: true, messages: true, reminders: true, announcements: true }, created: todayISO() };
  S.users.push(user); save(); go('/account/verify-email' + qs({ email: user.email, return: v.return }));
};
R('/account/verify-email', (p, q, u) => {
  const user = S.users.find(x => x.email === q.email);
  if (EMAIL_CONFIGURED) return authLayout('Check your email', '', h`<div class="alert alert-info">${ic('mail')}<span>We’ve sent a verification link to <strong>${q.email || 'your email'}</strong>. Open it on this device to verify your address and sign in.</span></div>
    <p class="small" style="margin-top:18px">Didn’t get it? Check your spam folder, or <button class="link-btn" data-act="resendVerifyReal" data-email="${q.email || ''}">resend the email</button>.</p>
    <p style="margin-top:18px"><a href="#/account/sign-in">Back to sign in</a></p>`);
  return authLayout('Check your email', '', h`<div class="alert alert-info">${ic('mail')}<span>We’ve sent a verification link to <strong>${q.email || 'your email'}</strong>. Open it to verify your address and finish creating your account.</span></div>
  <div class="demo-box" style="margin-top:20px"><strong>Preview only</strong><p class="small muted">No real email is sent in this preview. Use the button to simulate clicking the link in the email.</p><button class="btn btn-primary" data-act="verifyEmail" data-email="${q.email || ''}" data-return="${q.return || ''}" ${user ? '' : raw('disabled')}>Verify my email</button></div>
  <p class="small" style="margin-top:18px">Didn’t get it? <button class="link-btn" data-act="resendVerify">Resend the email</button></p>`);
});
Actions.verifyEmail = t => { const user = S.users.find(x => x.email === t.dataset.email); if (!user) return; user.verified = true; save(); signInUser(user, t.dataset.return); };
Actions.resendVerify = () => toast('Verification email sent again.');
Actions.resendVerifyReal = async t => {
  const r = await api('verify', { method: 'POST', body: { email: t.dataset.email } });
  toast(r.ok ? 'Email sent again — check your inbox.' : ((r.data && r.data.error) || 'Could not resend right now.'));
};

R('/account/verify', (p, q, u) => {
  if (!q.token) return authLayout('Invalid link', '', h`<div class="alert alert-err">${ic('alert-triangle')}<span>This verification link is missing its code. Copy the full link from your email, or request a new one from the sign-in page.</span></div><p style="margin-top:18px"><a href="#/account/sign-in">Back to sign in</a></p>`);
  const res = UI.verifyResult && UI.verifyResult.token === q.token ? UI.verifyResult : null;
  if (res) {
    return authLayout(res.ok ? 'Email confirmed' : 'That link didn’t work', '', res.ok
      ? h`<div class="alert alert-ok">${ic('check-circle')}<span>Email confirmed. Signing you in…</span></div>`
      : h`<div class="alert alert-err">${ic('alert-triangle')}<span>${res.error} <a href="#/account/sign-in">Sign in</a> to request a new one.</span></div>`);
  }
  return authLayout('Confirming your email…', '', h`<div class="alert alert-info">${ic('clock')}<span>One moment…</span></div><p style="margin-top:18px"><a href="#/account/sign-in">Back to sign in</a></p>`, () => completeVerify(q.token, q.return));
});
async function completeVerify(token, ret) {
  const r = await api('verify', { method: 'POST', body: { token } });
  if (r.ok) {
    UI.verifyResult = { token, ok: true };
    const user = mirrorSignedInUser(r.data.user);
    await mirrorChildrenFromServer(user.id); await syncCatalog(user); await mirrorEnrolments(user); await mirrorEnquiries(user); await mirrorAllMyHomework(user.id); await mirrorMyInvoices();
    render({ keepScroll: true });
    setTimeout(() => signInUser(user, ret), 500);
  } else {
    UI.verifyResult = { token, ok: false, error: (r.data && r.data.error) || 'That link is invalid.' };
    render({ keepScroll: true });
  }
}

R('/account/password-reset', (p, q, u) => {
  const st = UI.reset;
  if (EMAIL_CONFIGURED && q.stage === 'set' && q.token) {
    return authLayout('Choose a new password', '', h`<form data-form="setpwReal" data-token="${q.token}" novalidate class="stack">${fld({ name: 'password', label: 'New password', type: 'password', req: 1, auto: 'new-password', hint: 'At least 8 characters, including a number.' })}${fld({ name: 'confirm', label: 'Confirm new password', type: 'password', req: 1, auto: 'new-password' })}<button class="btn btn-primary btn-block" type="submit">Save new password</button></form>`);
  }
  if (EMAIL_CONFIGURED && st && st.stage === 'sent') {
    return authLayout('Check your email', '', h`<div class="alert alert-info">${ic('mail')}<span>If an account exists for <strong>${st.email}</strong>, we’ve sent a link to reset your password.</span></div><p style="margin-top:16px"><a href="#/account/sign-in">Back to sign in</a></p>`);
  }
  if (st && st.stage === 'set') return authLayout('Choose a new password', '', h`<form data-form="setpw" novalidate class="stack">${fld({ name: 'password', label: 'New password', type: 'password', req: 1, auto: 'new-password', hint: 'At least 8 characters, including a number.' })}${fld({ name: 'confirm', label: 'Confirm new password', type: 'password', req: 1, auto: 'new-password' })}<button class="btn btn-primary btn-block" type="submit">Save new password</button></form>`);
  if (st && st.stage === 'sent') return authLayout('Check your email', '', h`<div class="alert alert-info">${ic('mail')}<span>If an account exists for <strong>${st.email}</strong>, we’ve sent a link to reset your password.</span></div><div class="demo-box" style="margin-top:20px"><strong>Preview only</strong><p class="small muted">No real email is sent in this preview. Use the button to simulate opening the reset link.</p><button class="btn btn-primary" data-act="openReset">Open the reset link</button></div><p style="margin-top:16px"><a href="#/account/sign-in">Back to sign in</a></p>`);
  return authLayout('Reset your password', 'Enter your email and we’ll send you a link to choose a new password.', h`<form data-form="reset" novalidate class="stack">${fld({ name: 'email', label: 'Email address', type: 'email', req: 1, auto: 'email' })}<button class="btn btn-primary btn-block" type="submit">Send reset link</button></form><p style="margin-top:16px"><a href="#/account/sign-in">Back to sign in</a></p>`);
});
Forms.reset = async (f, v) => {
  if (!showErrors(f, isEmail(v.email) ? {} : { email: 'Enter a valid email address.' })) return;
  if (EMAIL_CONFIGURED && LIVE_BACKEND) { await api('reset', { method: 'POST', body: { email: v.email } }); }
  UI.reset = { stage: 'sent', email: v.email }; render();
};
Actions.openReset = () => { UI.reset.stage = 'set'; render(); };
Forms.setpw = (f, v) => {
  const e = {}; if (v.password.length < 8 || !/\d/.test(v.password)) e.password = 'Use at least 8 characters, including a number.'; if (v.confirm !== v.password) e.confirm = 'The passwords do not match.';
  if (!showErrors(f, e)) return;
  const user = S.users.find(x => x.email.toLowerCase() === (UI.reset.email || '').toLowerCase() && !x.synthetic);
  if (user) { user.pw = hashPw(v.password, user.email); user.verified = true; save(); }
  UI.reset = null; toast('Password updated. You can now sign in.'); go('/account/sign-in', true);
};
Forms.setpwReal = async (f, v) => {
  const e = {}; if (v.password.length < 8 || !/\d/.test(v.password)) e.password = 'Use at least 8 characters, including a number.'; if (v.confirm !== v.password) e.confirm = 'The passwords do not match.';
  if (!showErrors(f, e)) return;
  const r = await api('reset', { method: 'PATCH', body: { token: f.dataset.token, password: v.password } });
  if (!r.ok) { showErrors(f, { password: (r.data && r.data.error) || 'That reset link is invalid or has expired.' }); return; }
  const user = mirrorSignedInUser(r.data.user);
  await mirrorChildrenFromServer(user.id); await syncCatalog(user); await mirrorEnrolments(user); await mirrorEnquiries(user); await mirrorAllMyHomework(user.id); await mirrorMyInvoices();
  toast('Password updated.'); signInUser(user);
};
