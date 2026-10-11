'use strict';
/* =====================================================================
   MEA – public pages, part 1: Home, About, Courses & Subjects, Course detail
   ===================================================================== */
function banner({ title, sub, img, alt, actions, crumbs }) {
  return h`<section class="banner ${img ? '' : 'no-photo'}"><div class="wrap"><div>${crumbs || ''}<h1>${title}</h1>${sub ? h`<p class="sub">${sub}</p>` : ''}${actions ? h`<div class="actions">${actions}</div>` : ''}</div>${img ? h`<div class="photo"><img src="${img}" alt="${alt || ''}" width="960" height="480" loading="lazy"></div>` : ''}</div></section>`;
}
function ctaBand(title, text, buttons) {
  return h`<section class="band"><div class="wrap"><div class="lft"><div class="cap">${ic('graduation-cap')}</div><div><h2>${title}</h2><p>${text}</p></div></div><div class="actions">${buttons}</div></div></section>`;
}
const stdCTA = (u) => ctaBand('Ready to find the right class for your child?', 'Join families across the UK who trust MEA for their children’s education.',
  h`${btn('Find a Course', '/courses' + qs({ at: 'course-finder' }), 'btn-yellow', 'arrow-right')}${u ? btn('Go to My MEA', homeFor(u), 'btn-white') : btn('Create Parent Account', '/account/create', 'btn-white')}${btn('Contact MEA', '/contact', 'btn-outline-light')}`);
const subjIco = (sid, cls = '') => { const s = subj(sid); return h`<span class="ico c-${s.grp} ${cls}">${ic(s.icon)}</span>`; };
const LV_ICON = { ks1: 'backpack', ks2: 'backpack', sprimary: 'backpack', ks3: 'layers', s1s3: 'layers', gcse: 'graduation-cap', n5: 'graduation-cap', alevel: 'trophy', higher: 'trophy', adv: 'trophy', btec: 'briefcase' };
const LV_COLOR = { ks1: 'blue', ks2: 'blue', sprimary: 'blue', ks3: 'yellow', s1s3: 'yellow', gcse: 'pink', n5: 'pink', alevel: 'blue', higher: 'blue', adv: 'purple', btec: 'green' };

function enrolLink(cl, u) {
  const co = clsCourse(cl), a = avail(cl); if (a.k === 'closed') return null;
  const full = a.k === 'full', label = full ? 'Join Waitlist' : 'Enrol';
  if (!u) return { href: '/account/sign-in' + qs({ return: '/courses/' + co.slug }), label };
  if (u.role === 'parent') { const kq = UI.kid && childById(UI.kid) && childById(UI.kid).parentId === u.id ? qs({ child: UI.kid }) : ''; return { href: (full ? '/my-mea/courses/waitlist/' : '/my-mea/courses/enrol/') + cl.id + kq, label }; }
  return null;
}
function classCard(cl, u, year, levelLabel) {
  const co = clsCourse(cl), a = avail(cl), sc = schedText(cl), el = enrolLink(cl, u);
  // When shown as a per-year row (course finder), the year is the headline and
  // the key-stage/level is a small secondary icon chip — not the other way round.
  const mainTitle = year || co.title;
  const subLine = year ? subj(co.subject).name : subj(co.subject).name;
  const levelChip = year ? chip(levelLabel || levelName(co.level), 'chip-grey', LV_ICON[co.level] || 'layers') : chip(levelName(co.level), 'chip-blue', LV_ICON[co.level] || 'layers');
  return h`<article class="ccard acc-${grpOf(co.subject)}"><div class="chips">${levelChip}${co.board ? chip(co.board, 'chip-grey') : ''}${chip(a.label, a.cls, a.icon)}</div>
  <h3><a href="#/courses/${co.slug}">${mainTitle}</a></h3><div class="small muted">${subLine}</div>
  <div class="meta"><div>${ic('calendar')}<span>${sc.days}</span></div><div>${ic('clock')}<span>${sc.time} (UK time)</span></div><div>${ic('laptop')}<span>Live online classes</span></div><div>${ic('layers')}<span>${startsLater(cl) ? 'Starts ' + fmtDate(cl.startDate) : cl.term}</span></div></div>
  <div class="foot"><div class="fee">${money(classFee(cl))} <small>/ lesson</small></div>${co.trial ? chip('Trial class available', 'chip-purple', 'sparkles') : ''}</div>
  <div class="btns"><a class="btn btn-outline btn-sm" href="#/courses/${co.slug}">View Course</a>${el ? h`<a class="btn ${a.k === 'full' ? 'btn-outline-pink' : 'btn-pink'} btn-sm" href="#${el.href}">${el.label}</a>` : ''}</div></article>`;
}

/* ---------------- HOME ---------------- */
function finderHome() {
  const f = S.finder, sys = f.system, lv = sys && f.year ? levelOfStage(sys, f.year) : null;
  const subs = sys ? (lv ? subjectsAt(sys, lv) : SUBJECTS.filter(s => findClasses({ sys, subject: s.id }).length)) : [];
  return h`<div class="wrap" id="quick-finder"><div class="finder"><h2>Find the right class for your child</h2><p class="muted mb0">Choose your education system, then your child’s year and subject.</p>
  <div class="sysopts" role="group" aria-label="Step 1: education system">
    ${Object.values(SYS).map(s => h`<button type="button" class="sysopt" data-act="finderSys" data-sys="${s.id}" aria-pressed="${f.system === s.id}">${flag(s.id)}<span><span class="t">${s.short}</span><br><span class="s">Find your level</span></span></button>`)}
    <a class="sysopt" href="#/resources/choosing-the-right-level" style="text-decoration:none">${flag('none')}<span><span class="t">Not sure which level?</span><br><span class="s">Read our quick guide</span></span></a></div>
  ${sys ? h`<form class="finder-steps" data-form="finder" novalidate>
    <div class="field"><label for="f_year"><span class="stepnum" aria-hidden="true">2</span>Child’s year or stage</label><select class="sel" id="f_year" name="year" data-on="finderYear"><option value="">Choose year</option>${activeLevels(sys).map(l => h`<optgroup label="${l.name} (ages ${l.ages})">${l.years.map(y => h`<option value="${y}" ${f.year === y ? raw('selected') : ''}>${y}</option>`)}</optgroup>`)}</select></div>
    <div class="field"><label for="f_subject"><span class="stepnum" aria-hidden="true">3</span>Subject</label><select class="sel" id="f_subject" name="subject" data-on="finderSubject"><option value="">Any subject</option>${subs.map(s => h`<option value="${s.id}" ${f.subject === s.id ? raw('selected') : ''}>${s.name}</option>`)}</select></div>
    <button class="btn btn-primary" type="submit">${ic('search')}Show classes</button></form>` : h`<p class="form-note" style="margin:0"><span class="stepnum" aria-hidden="true">1</span>Choose your education system to begin.</p>`}</div></div>`;
}
Actions.finderSys = t => { S.finder = { system: t.dataset.sys, year: '', subject: '' }; save(); render({ keepScroll: true }); };
Changes.finderYear = el => { S.finder.year = el.value; S.finder.subject = ''; save(); render({ keepScroll: true }); };
Changes.finderSubject = el => { S.finder.subject = el.value; save(); };
Forms.finder = (f, v) => { S.finder.year = v.year; S.finder.subject = v.subject; save(); go('/courses' + qs({ system: S.finder.system, year: v.year, subject: v.subject, at: 'results' })); };

function subjectAges(sid) {
  const ages = []; S.classes.forEach(cl => { const co = clsCourse(cl); if (co.subject === sid) { const l = levelInfo(co.level); ages.push(...l.ages.split('–').map(Number)); } });
  return ages.length ? `Ages ${Math.min(...ages)}–${Math.max(...ages)}` : '';
}
/** Splits a level's stated age range evenly across its individual years, so a
    single year (e.g. "Year 3") can show its own approximate age range rather
    than the whole key stage's. */
function yearAge(level, idx) {
  const [lo, hi] = level.ages.split('–').map(Number), n = level.years.length;
  if (n <= 1) return `${lo}–${hi}`;
  const step = (hi - lo) / n;
  return `${Math.round(lo + step * idx)}–${Math.round(lo + step * (idx + 1))}`;
}
function whyCards() {
  const W = [['award', 'Quality teaching', 'Subject-focused teaching designed to support progress and confidence.', 'blue'], ['heart', 'Affordable access', 'Transparent, accessible fees, with any reduced-fee arrangements shown only where they are currently offered.', 'pink'], ['clock', 'Flexible learning', 'Online class times that work around school and family commitments.', 'yellow'],
    ['layers', 'Broad curriculum coverage', 'Support across multiple stages, subjects and major UK exam boards.', 'green'], ['users', 'Family-centred portal', 'One parent account manages multiple children, courses, timetables and learning resources.', 'purple'], ['target', 'Focused academic support', 'Learning resources, homework and progress information organised around each course.', 'navy']];
  return h`<div class="grid g3">${W.map(([i, t, d, c]) => h`<div class="card feat"><span class="ico c-${c}">${ic(i)}</span><div><h3>${t}</h3><p>${d}</p></div></div>`)}</div>`;
}
function stepsFive() {
  const st = [['user-plus', 'Create a parent account', 'Sign up in minutes to get started.'], ['users', 'Add your children', 'Add one or more children to the same account.'], ['globe', 'Choose system and stage', 'Pick England / Wales / NI or Scotland, then the year.'], ['book-open', 'Select courses', 'Choose suitable classes and class times.'], ['laptop', 'Start learning in My MEA', 'Use your timetable, lesson resources and homework.']];
  return h`<ol class="steps" style="list-style:none;padding:0;margin:0">${st.map(([i, t, d], n) => h`<li class="step"><span class="n">${n + 1}</span><span class="ico c-blue">${ic(i)}</span><h3>${t}</h3><p>${d}</p></li>`)}</ol>`;
}
R('/', (p, q, u) => {
  const boards = new Set(S.courses.map(c => c.board).filter(Boolean)), testis = S.testimonials.filter(x => x.pub), stories = S.stories.filter(x => x.pub);
  const levels = Object.values(SYS).reduce((a, s) => a + activeLevels(s.id).length, 0);
  const successItems = raw(testis.map(t => h`<figure class="card quote car-item-lg" style="margin:0"><div class="stars" aria-label="5 out of 5 stars">${[1, 2, 3, 4, 5].map(() => ic('star'))}</div><blockquote style="margin:8px 0 0"><p class="q">“${t.q}”</p></blockquote><figcaption class="by">${t.by}, ${t.role}<small>${t.place}</small></figcaption></figure>`).join('') + stories.map(s => h`<article class="card story car-item-lg"><img src="${IMG[s.img]}" alt="Portrait of ${s.name}" width="120" height="110"><div><div class="chips" style="margin-bottom:6px">${chip(levelName(s.level), 'chip-blue')}${chip(subj(s.subject).name, 'chip-grey')}</div><h3>${s.title}</h3><p class="small muted">${s.summary}</p><a class="strong small" href="#/student-success/${s.slug}">Read ${s.name}’s story ${'→'}</a></div></article>`).join(''));
  return {
    title: 'Online tuition for every UK stage', body: h`
    ${S.siteNotice ? h`<div class="notice"><div class="wrap">${ic('megaphone')}<span>${S.siteNotice}</span></div></div>` : ''}
    <section class="hero"><span class="dots" aria-hidden="true"></span><div class="wrap"><div>
      <h1>Helping every child <span class="t-blue">learn,</span> <span class="hl">grow</span> and <span class="t-pink">succeed.</span></h1>
      <p class="lead">Flexible, high-quality tuition and academic support for learners across the UK education system. Expert teachers, live online classes and a parent portal that keeps everything in one place.</p>
      <div class="actions">${btn('Find a Course', '/courses' + qs({ at: 'course-finder' }), 'btn-primary', 'search')}${u ? btn('Go to My MEA', homeFor(u), 'btn-pink') : btn('Create Parent Account', '/account/create', 'btn-pink', 'user-plus')}${u ? '' : h`<a class="btn btn-ghost" href="#/account/sign-in">Sign In</a>`}</div></div>
      <div class="hero-photo"><img src="${IMG.home}" alt="A mother and father smiling as they watch their son learn online with headphones on a laptop" width="976" height="516"></div></div></section>
    <section class="sec" style="padding-bottom:0"><div class="wrap"><div class="grid g4">${[['globe', Object.keys(SYS).length, 'Education systems'], ['book-open', activeSubjects().length, 'Subjects taught'], ['layers', levels, 'Levels & stages'], ['award', boards.size, 'Exam boards supported']].map(([i, n, l]) => h`<div class="card metric"><span class="ico c-blue">${ic(i)}</span><div><div class="num">${n}</div><div class="lab">${l}</div></div></div>`)}</div></div></section>
    <section class="sec"><div class="wrap grid g2" style="gap:40px;align-items:center"><div><h2>Together, we help every child succeed</h2><p>Ma3an Education Academies (MEA) is an education community committed to helping children and young people reach their potential through accessible, high-quality learning. We support students across different stages of the UK education system with tuition, exam preparation and academic guidance delivered around the needs of families.</p><p>The name “Ma3an” means <strong>“Together”</strong>, reflecting our belief that students achieve more when teachers, families and learners work in partnership.</p><div class="row">${btn('About MEA', '/about', 'btn-outline')}</div></div>
      <div class="card" style="background:var(--blue-50)"><div class="feat"><span class="ico c-blue">${ic('eye')}</span><div><h3>Our vision</h3><p class="mb0">To be the UK’s most trusted online learning partner, empowering every student to achieve their potential and build a brighter future.</p></div></div></div></div></div></section>
    ${testis.length || stories.length ? h`<section class="sec soft"><div class="wrap"><div class="sec-head"><h2>Student success</h2><p>Real progress and growing confidence. Read the stories behind the results.</p></div>
      ${carousel('home-success-car', successItems, 'Testimonials and achievement stories')}
      <div class="center" style="margin-top:10px">${btn('See Student Success', '/student-success', 'btn-outline', 'arrow-right')}</div></div></section>` : ''}
    <section class="sec"><div class="wrap"><div class="sec-head"><h2>Why families choose MEA</h2><p class="mb0">Hover or tap an icon to find out more.</p></div>${featHov([['award', 'Quality teaching', 'Subject-focused teaching designed to support progress and confidence.', 'blue'], ['heart', 'Affordable access', 'Transparent, accessible fees, with any reduced-fee arrangements shown only where they are currently offered.', 'pink'], ['clock', 'Flexible learning', 'Online class times that work around school and family commitments.', 'yellow'],
      ['layers', 'Broad curriculum coverage', 'Support across multiple stages, subjects and major UK exam boards.', 'green'], ['users', 'Family-centred portal', 'One parent account manages multiple children, courses, timetables and learning resources.', 'purple'], ['target', 'Focused academic support', 'Learning resources, homework and progress information organised around each course.', 'navy']])}</div></section>
    <section class="sec tint"><div class="wrap"><div class="sec-head"><h2>How MEA works</h2><p>From sign-up to your first class in five simple steps.</p></div>${stepsFive()}</div></section>
    ${stdCTA(u)}`
  };
});

/* ---------------- ABOUT ---------------- */
R('/about', (p, q, u) => {
  const VALUES = [['graduation-cap', 'Quality Education', 'We deliver expert-led, curriculum-aligned teaching that meets the highest academic standards.', 'blue'], ['globe', 'Accessibility', 'Learning should be within everyone’s reach—anytime, anywhere.', 'yellow'], ['heart', 'Family Support', 'We work hand-in-hand with parents to support and guide every step of the journey.', 'pink'], ['clock', 'Flexibility', 'Our online learning adapts to your schedule, your pace, and your goals.', 'blue'], ['trending-up', 'Student Growth', 'We focus on building confidence, skills, and a love for learning that lasts.', 'yellow']];
  const DIFF = [['users', 'Expert Tutors', 'Highly qualified, experienced tutors who are passionate about student success.', 'blue'], ['book-open', 'Curriculum Aligned', 'Fully aligned with UK curricula including National Curriculum, GCSE, National 5 & A-Level.', 'yellow'], ['user', 'Personalised Learning', 'Tailored learning plans, regular assessments, and 1-to-1 support that fit each child’s needs.', 'pink'], ['shield-check', 'Safe & Supportive', 'A positive, inclusive, and respectful environment where students feel safe to learn.', 'blue']];
  return {
    title: 'About MEA', body: h`${banner({ title: 'About Ma3an Education Academies', sub: 'Accessible education. Stronger confidence. Brighter futures.', img: IMG.about, alt: 'A family of four learning together at a laptop', actions: btn('Find a Course', '/courses' + qs({ at: 'course-finder' }), 'btn-primary', 'search') })}
    <section class="sec"><div class="wrap grid g2" style="gap:40px;align-items:start"><div><h2>Our story</h2><p>Ma3an Education Academies (MEA) is an education community committed to helping children and young people reach their potential through accessible, high-quality learning. We support students across different stages of the UK education system with tuition, exam preparation and academic guidance delivered around the needs of families.</p><p>The name “Ma3an” means <strong>“Together”</strong>, reflecting our belief that students achieve more when teachers, families and learners work in partnership.</p></div>
      <div class="grid" style="gap:16px"><div class="card"><div class="feat"><span class="ico c-blue">${ic('eye')}</span><div><h3>Our vision</h3><p>To be a beacon of educational excellence, nurturing young minds and providing equitable access to quality education across the United Kingdom, empowering each child to transform their dreams into reality.</p></div></div></div>
      <div class="card"><div class="feat"><span class="ico c-pink">${ic('target')}</span><div><h3>Our mission</h3><p>To inspire, motivate and guide students towards a future filled with opportunity through high-quality, accessible and flexible education. MEA aims to strengthen knowledge, confidence and academic achievement while supporting families throughout each learner’s education journey.</p></div></div></div></div></div></section>
    <section class="sec soft"><div class="wrap"><div class="sec-head"><h2>Our Values</h2><p class="mb0">Hover or tap an icon to find out more.</p></div>${featHov(VALUES, 'g5')}</div></section>
    <section class="sec"><div class="wrap"><div class="sec-head"><h2>What Makes MEA Different</h2><p class="mb0">Hover or tap an icon to find out more.</p></div>${featHov(DIFF, 'g4')}</div></section>
    ${stdCTA(u)}`
  };
});

/* ---------------- COURSES & SUBJECTS ---------------- */
function courseFilters() {
  const sys = Q.system || S.finder.system || '';
  return { sys, level: Q.level || '', year: Q.year || '', subject: Q.subject || '', board: Q.board || '', day: Q.day ?? '', trial: Q.trial || '', q: Q.q || '' };
}
R('/courses', (p, q, u) => {
  if (q.system && q.system !== S.finder.system) { S.finder = { system: q.system, year: q.year || '', subject: q.subject || '' }; save(); }
  const f = courseFilters(), sys = f.sys;
  const banr = banner({ title: 'Courses & Subjects', sub: 'Find the right subject, level and class for your child.', img: IMG.courses, alt: 'A teenage girl with headphones writing notes while learning online', actions: h`${btn('Find a Course', '/courses' + qs({ at: 'course-finder' }), 'btn-primary', 'search')}${btn('View Timetable', '/timetables-fees', 'btn-outline')}${u && u.role === 'parent' ? btn('Add Child', '/my-mea/children/add', 'btn-outline', 'plus') : ''}` });
  const selector = h`<section class="sec" id="course-finder" style="padding-bottom:20px"><div class="wrap"><div class="sec-head left" style="margin-bottom:18px"><h2>Course Finder</h2><p class="mb0">First choose your education system, so you only see levels and classes that match your child.</p></div>
    <div class="grid g2">${Object.values(SYS).map(s => h`<button type="button" class="sysopt" data-act="setSys" data-sys="${s.id}" aria-pressed="${sys === s.id}" style="padding:20px">${flag(s.id, 56)}<span><span class="t" style="font-size:1.1rem">${s.name}</span><br><span class="s">${s.blurb}</span></span></button>`)}</div></div></section>`;
  if (!sys) return { title: 'Courses & Subjects', body: h`${banr}${selector}<section class="sec" style="padding-top:0"><div class="wrap">${emptyState({ icon: 'globe', title: 'Choose your education system to begin', text: 'Once you choose, you can browse stages and subjects, or narrow classes by year, exam board, day and availability.', action: h`<a class="btn btn-outline" href="#/resources/choosing-the-right-level">Not sure which level?</a>` })}</div></section>` };
  const sysO = SYS[sys], lvId = f.level || (f.year ? levelOfStage(sys, f.year) : '');
  const rows = courseFinderRows(f);
  const subs = SUBJECTS.filter(s => !isOff('subjects', s.id) && findClasses({ sys, level: lvId, subject: s.id }).length);
  const boards = [...new Set(findClasses({ sys, level: lvId, subject: f.subject }).map(c => clsCourse(c).board).filter(Boolean))];
  const days = [1, 2, 3, 4, 5, 6, 0];
  const yv = f.level ? 'L:' + f.level : f.year;
  const filters = h`<div class="filters"><button class="btn btn-outline filters-toggle" type="button" data-act="toggleFilters" aria-expanded="false" aria-controls="fbody">${ic('filter')}Filters</button><div class="fbody" id="fbody"><div class="fgrid">
    <div class="field"><label for="cf_yl">Year / level</label><select class="sel" id="cf_yl" data-on="cfYL"><option value="">All years</option>${activeLevels(sys).map(l => h`<optgroup label="${l.name}"><option value="L:${l.id}" ${yv === 'L:' + l.id ? raw('selected') : ''}>All ${l.name}</option>${l.years.map(y => h`<option value="${y}" ${yv === y ? raw('selected') : ''}>${y}</option>`)}</optgroup>`)}</select></div>
    <div class="field"><label for="cf_subject">Subject</label><select class="sel" id="cf_subject" data-on="cf" data-k="subject"><option value="">All subjects</option>${subs.map(s => h`<option value="${s.id}" ${f.subject === s.id ? raw('selected') : ''}>${s.name}</option>`)}</select></div>
    ${boards.length ? h`<div class="field"><label for="cf_board">Exam board</label><select class="sel" id="cf_board" data-on="cf" data-k="board"><option value="">Any board</option>${boards.map(b => h`<option ${f.board === b ? raw('selected') : ''}>${b}</option>`)}</select></div>` : ''}
    <div class="field"><label for="cf_day">Day</label><select class="sel" id="cf_day" data-on="cf" data-k="day"><option value="">Any day</option>${days.map(d => h`<option value="${d}" ${String(f.day) === String(d) ? raw('selected') : ''}>${DAYS[d]}</option>`)}</select></div>
    <div class="field"><label for="cf_trial">Trial lessons</label><select class="sel" id="cf_trial" data-on="cf" data-k="trial"><option value="">Any</option><option value="1" ${f.trial === '1' ? raw('selected') : ''}>Trial lessons available</option></select></div>
    <div class="field wide"><label for="cf_q">Search</label><input class="inp" id="cf_q" type="search" placeholder="Search by subject or course title" value="${f.q}" data-on="cf" data-k="q"></div>
    <div class="row"><button class="btn btn-outline" type="button" data-act="resetFilters">Reset</button></div></div></div></div>`;
  return {
    title: 'Courses & Subjects', body: h`${banr}${selector}
    <section class="sec" style="padding-top:8px"><div class="wrap">
      <h2 style="font-size:1.4rem">Browse by subject · ${sysO.short}</h2>
      ${carousel('cf-subject-car', raw(SUBJECTS.filter(s => !isOff('subjects', s.id) && findClasses({ sys, subject: s.id }).length).map(s => h`<button type="button" class="subj car-item-sm" data-act="cfSubjectPick" data-subject="${s.id}" aria-pressed="${f.subject === s.id}" style="${f.subject === s.id ? raw('border-color:var(--blue-d);background:var(--blue-50)') : ''}">${subjIco(s.id)}<span class="t">${s.name}</span><span class="s">${subjectAges(s.id)}</span></button>`).join('')), 'Browse by subject')}
      <h2 style="font-size:1.4rem;margin-top:26px">Browse by year · ${sysO.short}</h2>
      ${carousel('cf-year-car', raw((() => { const out = []; let idx = 0; activeLevels(sys).forEach(l => { if (l.id === 'btec') return; l.years.forEach((y, i) => out.push(h`<button type="button" class="stage car-item-sm" data-act="setYear" data-year="${y}" aria-pressed="${f.year === y}"><span class="ico c-${LV_COLOR[l.id]}">${ic(LV_ICON[l.id])}</span><span><span class="t">${y} <small style="font-weight:400;opacity:.65;font-size:.75em">${l.name}</small></span><br><span class="s">Ages ${yearAge(l, i)}</span></span></button>`)); }); const btec = activeLevels(sys).find(l => l.id === 'btec'); if (btec) out.push(h`<button type="button" class="stage car-item-sm" data-act="setLevel" data-level="btec" aria-pressed="${lvId === 'btec'}"><span class="ico c-${LV_COLOR.btec}">${ic(LV_ICON.btec)}</span><span><span class="t">BTEC</span><br><span class="s">Ages ${btec.ages}</span></span></button>`); return out.map(x => x.toString()).join(''); })()), 'Browse by year')}
      ${filters}
      <div class="results-head" id="results"><h2 style="margin:0;font-size:1.4rem">${plural(rows.length, 'class', 'classes')} found</h2>${f.subject ? h`<div class="chips">${chip(subj(f.subject).name, 'chip-blue')}</div>` : ''}</div>
      ${rows.length ? h`<div class="grid g3">${rows.map(r => classCard(r.cl, u, r.year, r.levelLabel))}</div>` : emptyState({ icon: 'search', title: 'No classes match those filters', text: 'Try a different year, subject or day, or reset the filters. If you cannot find what you need, contact us and we will help.', action: h`<div class="row" style="justify-content:center"><button class="btn btn-outline" data-act="resetFilters">Reset filters</button>${btn('Contact MEA', '/contact', 'btn-primary')}</div>` })}
    </div></section>
    <section class="sec soft"><div class="wrap"><div class="card row between" style="padding:26px"><div class="feat"><span class="ico c-yellow">${ic('help-circle')}</span><div><h3>Not sure which course is right for your child?</h3><p>Read our short guide, or tell us your child’s year and subject and we will suggest a class.</p></div></div><div class="row">${btn('Level guide', '/resources/choosing-the-right-level', 'btn-outline')}${btn('Contact MEA', '/contact', 'btn-primary')}</div></div></div></section>${stdCTA(u)}`
  };
});
Actions.setSys = t => { S.finder = { system: t.dataset.sys, year: '', subject: Q.subject || '' }; save(); setQuery({ system: t.dataset.sys, level: '', year: '', board: '', subject: Q.subject || '', day: '', trial: '', q: '', at: '' }, true); };
Actions.setLevel = t => { const on = (Q.level === t.dataset.level); setQuery({ level: on ? '' : t.dataset.level, year: '', subject: '', board: '', at: '' }); };
Actions.setYear = t => { const on = (Q.year === t.dataset.year); setQuery({ year: on ? '' : t.dataset.year, level: '', subject: '', board: '', at: '' }); };
Actions.cfSubjectPick = t => { const on = (Q.subject === t.dataset.subject); setQuery({ subject: on ? '' : t.dataset.subject, board: '', at: '' }); };
Actions.resetFilters = () => setQuery({ level: '', year: '', subject: '', board: '', day: '', trial: '', q: '', at: '' });
Changes.cf = el => { const k = el.dataset.k, patch = { [k]: el.value, at: '' }; if (k === 'subject') patch.board = ''; setQuery(patch); };
Changes.cfYL = el => { const v = el.value; setQuery(v.startsWith('L:') ? { level: v.slice(2), year: '', subject: '', board: '', at: '' } : { year: v, level: '', subject: '', board: '', at: '' }); };

/* ---------------- COURSE DETAIL ---------------- */
R('/courses/:slug', (p, q, u) => {
  const co = courseBySlug(p.slug); if (!co || !co.active) return notFoundView();
  const classes = S.classes.filter(c => c.courseId === co.id), lv = levelInfo(co.level);
  const related = S.courses.filter(c => c.active && c.id !== co.id && c.sys === co.sys && (c.level === co.level || c.subject === co.subject)).slice(0, 3);
  const primary = classes[0], a = avail(primary), el = enrolLink(primary, u);
  const t = teacherOf(primary);
  return {
    title: co.title, body: h`<section class="banner"><div class="wrap" style="grid-template-columns:1fr"><div><div class="crumbs"><a href="#/courses">Courses &amp; Subjects</a> / <a href="#/courses${qs({ system: co.sys, level: co.level })}">${lv.name}</a></div>
      <div class="chips" style="margin-bottom:10px">${chip(SYS[co.sys].short, 'chip-grey', 'globe')}${chip(lv.name, 'chip-blue')}${co.board ? chip(co.board, 'chip-grey') : ''}${co.tier ? chip(co.tier, 'chip-yellow') : ''}${chip(a.label, a.cls, a.icon)}</div>
      <h1>${co.title}</h1><p class="sub">${co.desc}</p>
      <div class="actions">${el ? h`<a class="btn ${a.k === 'full' ? 'btn-outline-pink' : 'btn-pink'}" href="#${el.href}">${a.k === 'full' ? 'Join Waitlist' : 'Enrol Child'}</a>` : ''}${!u ? btn('Create Account', '/account/create' + qs({ return: '/courses/' + co.slug }), 'btn-outline') : ''}${btn('View Timetable', '/timetables-fees', 'btn-outline')}</div>
      ${!u ? h`<p class="small muted" style="margin-top:10px">You will be asked to sign in or create an account, then brought back to this course.</p>` : ''}</div></div></section>
    <section class="sec"><div class="wrap two-col" id="cd">
      <div class="prose" style="max-width:none">
        <h2 style="margin-top:0">Who this course is for</h2><p>${co.audience}</p>
        <h2>What students will learn</h2><ul>${co.topics.map(x => h`<li>${x}</li>`)}</ul>
        ${co.board ? h`<h2>Exam board${co.tier ? ' and tier' : ''}</h2><p>${co.board}${co.tier ? ' – ' + co.tier : ''}. Lessons follow the ${co.board} specification.</p>` : ''}
        <h2>Course duration</h2><p>${primary.term}: ${fmtDate(primary.startDate, 'dmy')} to ${fmtDate(primary.endDate, 'dmy')}.</p>
        <h2>What students need</h2><p>${co.needs}</p>
        <h2>Fee and payment</h2><p>${money(classFee(primary))} per lesson. Choose to pay monthly (${money(periodTotal(primary, 'month').total)} for ${periodTotal(primary, 'month').lessons} lesson${periodTotal(primary, 'month').lessons === 1 ? '' : 's'}) or termly (${money(periodTotal(primary, 'term').total)} for ${periodTotal(primary, 'term').lessons} lesson${periodTotal(primary, 'term').lessons === 1 ? '' : 's'} left this term) when you enrol. Cancel or pause with notice – see our <a href="#/terms">terms</a>.${co.trial ? ' A trial class is available for this course.' : ''}</p>
        ${teacherOf(primary).publish ? h`<h2>Your teacher</h2><p>${t.name} · ${t.qual}</p>` : ''}
      </div>
      <aside class="stack" style="position:sticky;top:96px"><div class="card"><h3>Class options</h3>${classes.map(cl => { const sc = schedText(cl), aa = avail(cl), ee = enrolLink(cl, u); return h`<div style="padding:14px 0;border-top:1px solid var(--line)"><div class="strong">${sc.days}</div><div class="small muted">${sc.time} (UK time)</div><div class="small" style="margin:6px 0">${startsLater(cl) ? 'Starts ' + fmtDate(cl.startDate) : cl.term} · ${money(classFee(cl))} / lesson</div><div class="row">${chip(aa.label, aa.cls, aa.icon)}${ee ? h`<a class="btn ${aa.k === 'full' ? 'btn-outline-pink' : 'btn-pink'} btn-sm" href="#${ee.href}">${ee.label}</a>` : ''}</div></div>`; })}</div>
      <div class="card"><h3>Questions?</h3><p class="small muted">Not sure this is the right class? We are happy to help.</p><a class="btn btn-outline btn-block" href="#/contact">Contact MEA</a></div></aside></div></section>
    ${related.length ? h`<section class="sec soft"><div class="wrap"><h2 style="font-size:1.4rem">Related courses</h2><div class="grid g3">${related.map(c => h`<a class="card link" href="#/courses/${c.slug}"><div class="row">${subjIco(c.subject)}<div><div class="strong">${c.title}</div><div class="small muted">${levelName(c.level)} · ${money(c.fee)} / lesson</div></div></div></a>`)}</div></div></section>` : ''}
    ${stdCTA(u)}`
  };
});
