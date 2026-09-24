'use strict';
/* =====================================================================
   MEA – seed data builder. Dates are generated relative to "today" (UK)
   so the demo always looks live. Bump SEED_V to force a fresh seed.
   ===================================================================== */
const SEED_V = 5;
function termInfo(T) {
  const start = isoAdd(mondayOf(T), -14);
  const mid = +isoAdd(start, 28).slice(5, 7);
  const season = mid >= 9 ? 'Autumn' : mid >= 5 ? 'Summer' : mid >= 1 && mid <= 4 ? 'Spring' : 'Autumn';
  return { name: `${season} Term ${isoAdd(start, 28).slice(0, 4)}`, start, end: isoAdd(start, 15 * 7 - 3), season };
}
const CS_NAMES = { gcse: 1, alevel: 1, n5: 1, higher: 1, adv: 1 };
function subjectLabel(sub, lv) { return sub === 'computing' && CS_NAMES[lv] ? 'Computer Science' : subj(sub).name; }
function topicsFor(sub, lv) {
  const b = LEVEL_BUCKET[lv], t = TOPICS[sub] || {};
  const pick = t[b] || t.l || t.e || t.s || t.p || 'Core concepts|Key skills|Practice & application|Review & feedback|Assessment preparation|Extension';
  return pick.split('|');
}
const AUD_YEARS = l => { const y = l.years; return y.length === 1 ? y[0] : `${y[0]}–${y[y.length - 1].replace(/^Year /, '')}`; };
function courseFromRow(r) {
  const lv = levelInfo(r.lv), sn = subjectLabel(r.sub, r.lv);
  const title = r.title || `${lv.name} ${sn}${r.tier ? ' – ' + r.tier : ''}${r.board ? ' (' + r.board + ')' : ''}`;
  const b = LEVEL_BUCKET[r.lv];
  const desc = {
    p: `Engaging, structured ${sn.toLowerCase()} lessons that build strong foundations, confidence and a love of learning.`,
    l: `Builds core ${sn.toLowerCase()} knowledge and study skills, preparing students for the step up to ${r.sys === 'sco' ? 'National 5' : 'GCSE'}.`,
    e: `Focused ${sn.toLowerCase()} preparation${r.board ? ' for ' + r.board : ''}: clear teaching of the course content, exam technique, past papers and regular feedback.`,
    s: `Expert ${sn.toLowerCase()} tuition for top grades and university admission, with in-depth content, exam practice and personal feedback.`
  }[b];
  return {
    id: 'c_' + r.k, slug: r.k, title, sys: r.sys, level: r.lv, subject: r.sub, board: r.board, tier: r.tier, desc,
    audience: `Students in ${lv.years.length > 1 ? lv.years[0] + ' to ' + lv.years[lv.years.length - 1] : lv.years[0]} (ages ${lv.ages}) following the ${SYS[r.sys].short} curriculum.`,
    topics: topicsFor(r.sub, r.lv), fee: r.fee, trial: !!r.trial, active: true,
    needs: 'A computer or tablet with a camera and microphone, a stable internet connection, pen and paper' + (['maths', 'physics', 'chemistry', 'biology', 'science'].includes(r.sub) && b !== 'p' ? ' and a scientific calculator.' : '.')
  };
}
const pickFB = ['Great improvement in this topic – keep it up!', 'Excellent work and clear working shown.', 'Good understanding of the key ideas.', 'Confident, well-organised answers throughout.', 'A strong effort. Check units and final answers carefully.', 'Thoughtful work – push yourself to explain your reasoning.'];
const ASSESS_COMMENTS = ['Excellent understanding of core ideas.', 'Good progress – revisit the topics marked in feedback.', 'Confident and accurate; aim for more detail in extended answers.', 'Solid effort. Regular practice will lift this further.'];

function buildSeed() {
  const T = todayISO(), rnd = mulberry(20260907), term = termInfo(T);
  const S = {
    v: SEED_V, seedDate: T, session: null, term, users: [], children: [], courses: [], classes: [], enrolments: [], resources: [], homework: [], submissions: [],
    attendance: [], assessments: [], announcements: [], notifications: [], threads: [], invoices: [], faqs: [], enquiries: [],
    stories: STORIES.map(x => ({ ...x, pub: true })), testimonials: TESTIMONIALS.map(x => ({ ...x, pub: true })),
    off: { levels: [], subjects: [] }, siteNotice: `${term.season} term classes are open for enrolment. Places are limited in some classes.`, finder: { system: '', year: '', subject: '' },
    /* Editable in Admin → Setup & Integrations → Site Details. Starts as a copy of the SITE
       defaults in core.js so nothing changes until an admin actually saves an edit. */
    settings: JSON.parse(JSON.stringify(SITE)),
    backend: { supabaseUrl: '', supabaseAnonKey: '' } // set automatically once a backend is detected; never edited directly
  };
  const mkUser = (id, role, name, email, extra = {}) => ({ id, role, name, email, pw: hashPw('demo1234', email), verified: true, phone: '', marketing: false, notify: { email: true, messages: true, reminders: true, announcements: true }, created: isoAdd(T, -60), ...extra });
  S.users.push(mkUser('u_salma', 'parent', 'Salma Ahmed', 'salma.ahmed@example.com', { phone: '07123 456789' }));
  TEACHERS.forEach(t => S.users.push(mkUser(t.id, 'teacher', t.name, t.name.replace(/^(Mr|Ms|Dr)\.\s/, '').toLowerCase().replace(/\s+/g, '.') + '@example.com', { subjects: t.subjects, levels: t.levels, boards: t.boards, qual: t.qual, bio: t.bio, publish: true })));
  S.users.push(mkUser('u_admin', 'admin', 'Zainab Hussain', 'admin@example.com'));

  // courses + classes
  const lateStart = isoAdd(mondayOf(T), 11);
  CAT_ROWS.forEach(r => {
    const c = courseFromRow(r); S.courses.push(c);
    S.classes.push({ id: 'cl_' + r.k, courseId: c.id, teacherId: r.t, days: r.sess.map(([d, s, e]) => ({ d, start: s, end: e })), term: term.name, startDate: r.late ? lateStart : term.start, endDate: term.end, capacity: r.cap, meetingUrl: '', feeOverride: null, enrolOpen: true, status: 'Running' });
  });

  // real family
  const kids = [
    { id: 'c_ahmed', first: 'Ahmed', last: 'Ahmed', sys: 'eng', stage: 'Year 10', dob: '2012-03-12' },
    { id: 'c_maryam', first: 'Maryam', last: 'Ahmed', sys: 'eng', stage: 'Year 7', dob: '2014-07-25' },
    { id: 'c_yusuf', first: 'Yusuf', last: 'Ahmed', sys: 'eng', stage: 'Year 4', dob: '2017-11-05' }
  ];
  kids.forEach(k => S.children.push({ ...k, parentId: 'u_salma', status: 'Active', school: '', board: '' }));
  const en = (id, child, cls, status, extra = {}) => S.enrolments.push({ id, childId: child, classId: 'cl_' + cls, status, created: isoAdd(T, -30), ...extra });
  en('en_a1', 'c_ahmed', 'gcse-maths-edexcel', 'Active'); en('en_a2', 'c_ahmed', 'gcse-english-aqa', 'Active'); en('en_a3', 'c_ahmed', 'gcse-physics-aqa', 'Waitlisted', { created: isoAdd(T, -4) });
  en('en_m1', 'c_maryam', 'ks3-science', 'Active'); en('en_m2', 'c_maryam', 'ks3-french', 'Active', { created: isoAdd(T, -10) }); en('en_m3', 'c_maryam', 'ks2-english', 'Completed', { completedOn: isoAdd(T, -66) });
  en('en_y1', 'c_yusuf', 'ks2-computing', 'Active'); en('en_y2', 'c_yusuf', 'ks2-maths', 'Pending Confirmation', { created: isoAdd(T, -3) });

  // synthetic students so class capacity looks real
  const FN = ['Zain', 'Amina', 'Yusuf', 'Layla', 'Idris', 'Maya', 'Omar', 'Sana', 'Ibrahim', 'Hana', 'Adam', 'Noor', 'Ali', 'Safa', 'Bilal', 'Ruqayya', 'Hamza', 'Zara', 'Isa', 'Mariam', 'Musa', 'Aliya', 'Tariq', 'Inaya', 'Rayan', 'Dania', 'Sami', 'Leila', 'Noah', 'Emily', 'Oliver', 'Isla', 'Jack', 'Freya', 'Callum', 'Eilidh', 'Rory', 'Kirsty'];
  const SN = ['Khan', 'Ali', 'Hussain', 'Patel', 'Malik', 'Begum', 'Rahman', 'Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 'Campbell', 'Stewart', 'Murray', 'Iqbal', 'Chaudhry', 'Sheikh', 'Farah', 'Siddiqui'];
  const PF = ['Fatima', 'Khalid', 'Nadia', 'Imran', 'Rabia', 'Tariq', 'Sofia', 'Hasan', 'Amir', 'Emma', 'David', 'Sarah', 'James', 'Morag', 'Iain', 'Nasreen'];
  let n = 0, lastParent = null;
  const pickR = a => a[Math.floor(rnd() * a.length)];
  S.classes.forEach(cl => {
    const row = CAT_ROWS.find(r => 'cl_' + r.k === cl.id), lv = levelInfo(row.lv);
    const occ = S.enrolments.filter(e => e.classId === cl.id && ['Active', 'Pending Confirmation'].includes(e.status)).length;
    for (let i = 0; i < Math.max(0, row.fill - occ); i++) {
      n++;
      const sn = pickR(SN); let pid;
      if (lastParent && rnd() < .15) pid = lastParent; else { pid = 'u_syn' + n; S.users.push(mkUser(pid, 'parent', `${pickR(PF)} ${sn}`, `family${n}@example.com`, { synthetic: true, created: isoAdd(T, -Math.floor(rnd() * 120)) })); lastParent = pid; }
      const cid = 'c_syn' + n;
      S.children.push({ id: cid, parentId: pid, first: pickR(FN), last: sn, sys: row.sys, stage: pickR(lv.years), status: 'Active', school: '', board: '', synthetic: true });
      S.enrolments.push({ id: 'en_syn' + n, childId: cid, classId: cl.id, status: 'Active', created: isoAdd(T, -Math.floor(rnd() * 40) - 7) });
    }
  });

  // resources, homework, submissions, attendance, assessments
  const cw = Math.floor(daysBetween(term.start, T) / 7) + 1;
  const wkDate = (cl, w) => { const ds = cl.days.map(x => (x.d + 6) % 7).sort((a, b) => a - b); return isoAdd(term.start, (w - 1) * 7 + ds[0]); };
  const aisha = new Set(S.classes.filter(c => c.teacherId === 't_aisha').map(c => c.id));
  S.classes.forEach(cl => {
    const co = S.courses.find(c => c.id === cl.courseId), tp = co.topics, b = LEVEL_BUCKET[co.level];
    for (let w = 1; w <= cw; w++) {
      const d0 = wkDate(cl, w); if (d0 < cl.startDate) continue;
      const topic = tp[(w - 1) % tp.length], rid = `r_${cl.id}_${w}_`;
      const add = (k, type, title, date) => S.resources.push({ id: rid + k, classId: cl.id, week: w, topic, title, type, date });
      add('s', 'Lesson slides', `Lesson Slides – Week ${w}`, d0);
      add('w', 'Worksheet', `Worksheet – Week ${w}`, d0);
      if (b === 'e' || b === 's' || co.subject === 'maths') add('x', 'Worked examples', `Worked Examples – Week ${w}`, d0);
      if (isoAdd(d0, 1) <= T) add('a', 'Answer sheet', `Answers – Week ${w}`, isoAdd(d0, 1));
      if (isoAdd(d0, 2) <= T) (b === 'p' || b === 'l') ? add('v', 'Video', `Revision Video – ${topic}`, isoAdd(d0, 2)) : add('g', 'Revision guide', `Revision Guide – ${topic}`, isoAdd(d0, 2));
      S.homework.push({ id: `h_${cl.id}_${w}`, classId: cl.id, week: w, title: `Week ${w} Homework – ${topic}`, desc: `Complete the attached worksheet on ${topic.toLowerCase()}. Show your working and bring any questions to the next class.`, assigned: d0, due: isoAdd(d0, 6), resourceId: rid + 'w' });
    }
  });
  const mark = (hwId, childId, w, marked) => {
    const hw = S.homework.find(x => x.id === hwId); if (!hw) return;
    const sub = { id: 'sb_' + hwId + '_' + childId, hwId, childId, fileName: 'homework-week-' + w + '.pdf', submittedAt: isoAdd(hw.due, -1) + 'T18:20' };
    if (marked) { sub.score = 5 + Math.floor(rnd() * 6); sub.max = 10; sub.feedback = pickFB[Math.floor(rnd() * pickFB.length)]; sub.markedAt = hw.due; }
    S.submissions.push(sub);
  };
  S.enrolments.filter(e => e.status === 'Active').forEach(e => {
    const cl = S.classes.find(c => c.id === e.classId), real = !e.childId.startsWith('c_syn');
    if (!real && !aisha.has(cl.id)) return;
    for (let w = 1; w <= cw; w++) {
      const id = `h_${cl.id}_${w}`; if (!S.homework.find(x => x.id === id)) continue;
      if (w < cw) mark(id, e.childId, w, true);
      else if ((real && e.childId === 'c_ahmed' && cl.id === 'cl_gcse-maths-edexcel') || (!real && rnd() < .55)) mark(id, e.childId, w, false);
    }
  });
  // attendance
  S.enrolments.filter(e => e.status === 'Active').forEach(e => {
    const cl = S.classes.find(c => c.id === e.classId), real = !e.childId.startsWith('c_syn');
    if (!real && !aisha.has(cl.id)) return;
    classSessions(cl, term.start, isoAdd(T, -1)).forEach(s => { const r = rnd(); S.attendance.push({ classId: cl.id, date: s.date, childId: e.childId, status: r < .9 ? 'Present' : r < .96 ? 'Late' : 'Absent' }); });
  });
  // assessments for real kids
  S.enrolments.filter(e => e.status === 'Active' && !e.childId.startsWith('c_syn')).forEach(e => {
    const cl = S.classes.find(c => c.id === e.classId), d0 = wkDate(cl, 1) < cl.startDate ? null : wkDate(cl, 1); if (!d0) return;
    S.assessments.push({ id: 'as_' + e.id + '_1', childId: e.childId, classId: cl.id, title: 'Baseline assessment', date: isoAdd(d0, 1), score: 60 + Math.floor(rnd() * 20), max: 100, comment: ASSESS_COMMENTS[Math.floor(rnd() * 4)] });
    if (cw >= 2) S.assessments.push({ id: 'as_' + e.id + '_2', childId: e.childId, classId: cl.id, title: 'Unit test 1', date: isoAdd(wkDate(cl, 2), 1), score: 68 + Math.floor(rnd() * 24), max: 100, comment: ASSESS_COMMENTS[Math.floor(rnd() * 4)] });
    S.assessments.push({ id: 'as_' + e.id + '_3', childId: e.childId, classId: cl.id, title: 'Unit test 2', date: isoAdd(wkDate(cl, cw + 1), 1), score: null, max: 100, comment: '' });
  });

  // announcements
  const an = (scope, classId, title, body, days, by) => S.announcements.push({ id: uid('an'), scope, classId, title, body, date: isoAdd(T, -days), by });
  an('site', '', `${term.season} Term Timetable Update`, 'New class times are now available in My MEA.', 2, 'MEA');
  an('site', '', 'GCSE Exam Preparation Sessions', 'Special sessions start next week. Check your timetable.', 3, 'MEA');
  an('class', 'cl_gcse-maths-edexcel', 'Class reminder', 'Please bring a calculator to Thursday’s lesson.', 3, 't_hassan');
  an('class', 'cl_ks3-science', 'Reading before Wednesday', 'Please read pages 45–50 before Wednesday’s lesson.', 4, 't_aisha');
  an('staff', '', 'Staff meeting', 'Reminder: staff meeting tomorrow at 7:00pm.', 1, 'u_admin');
  an('staff', '', 'New resources added', 'Updated Year 10 Maths resources are now available.', 2, 'u_admin');
  an('staff', '', 'Parent progress reports', 'Term 1 progress reports will be shared next week.', 3, 'u_admin');

  // notifications (parent)
  const nf = (type, child, text, route, days, read) => S.notifications.push({ id: uid('nt'), parentId: 'u_salma', type, childId: child, text, route, date: isoAdd(T, -days), read: !!read });
  const w3 = S.homework.find(x => x.id === 'h_cl_gcse-maths-edexcel_' + cw);
  nf('Homework', 'c_ahmed', `New homework: ${w3 ? w3.title : 'Week homework'}`, w3 ? '/my-mea/homework/' + w3.id : '/my-mea/homework', 1);
  nf('Announcements', '', `${term.season} Term timetable update: new class times are now available.`, '/my-mea/timetable', 2);
  nf('Enrolments', 'c_yusuf', 'Enrolment requested: KS2 Mathematics is waiting for confirmation.', '/my-mea/courses', 3);
  nf('Enrolments', 'c_ahmed', 'Ahmed is on the waitlist for GCSE Physics (AQA). We will tell you if a place opens.', '/my-mea/courses', 4, true);
  nf('Classes', 'c_ahmed', 'New lesson resources added: GCSE Mathematics (Edexcel).', '/my-mea/learning', 2, true);
  nf('Announcements', '', 'GCSE exam preparation sessions start next week.', '/my-mea/timetable', 3, true);

  // threads
  S.threads.push({ id: 'th_1', parentId: 'u_salma', staffId: 'u_admin', subject: 'Welcome to MEA', unreadParent: true, unreadStaff: false, messages: [{ from: 'u_admin', text: 'Welcome to MEA, Salma! If you need help with enrolments or your timetable, just message us here.', at: isoAdd(T, -6) + 'T10:05' }] });
  S.threads.push({ id: 'th_2', parentId: 'u_salma', staffId: 't_hassan', subject: 'Ahmed – algebra homework', childId: 'c_ahmed', classId: 'cl_gcse-maths-edexcel', unreadParent: true, unreadStaff: false, messages: [
    { from: 'u_salma', text: 'Hi Mr. Hassan, Ahmed found the algebraic fractions homework quite hard. Could you recommend any extra practice?', at: isoAdd(T, -2) + 'T19:40' },
    { from: 't_hassan', text: 'Thanks for letting me know. I’ve added a worked-examples sheet to the Learning Hub and we will revisit the topic in Tuesday’s class.', at: isoAdd(T, -1) + 'T09:15' }] });

  // invoices
  const fees = S.enrolments.filter(e => e.status === 'Active' && e.childId.startsWith('c_') && S.children.find(c => c.id === e.childId).parentId === 'u_salma').map(e => {
    const cl = S.classes.find(c => c.id === e.classId), co = S.courses.find(c => c.id === cl.courseId), ch = S.children.find(c => c.id === e.childId);
    return { child: ch.first, desc: co.title, amt: co.fee };
  });
  const m0 = T.slice(0, 7) + '-01', m1 = isoAdd(m0, 31).slice(0, 7) + '-01';
  S.invoices.push({ id: 'INV-' + m0.slice(0, 4) + '-0091', parentId: 'u_salma', period: fmtDate(m0, 'my'), issued: isoAdd(m0, -7), due: m0, status: 'Paid', paidOn: isoAdd(m0, -2), lines: fees, discountPct: SITE.siblingDiscount });
  S.invoices.push({ id: 'INV-' + m1.slice(0, 4) + '-0114', parentId: 'u_salma', period: fmtDate(m1, 'my'), issued: isoAdd(m1, -7), due: m1, status: 'Due', paidOn: '', lines: fees, discountPct: SITE.siblingDiscount });

  S.faqs = FAQ_SEED.map((a, i) => ({ id: 'f' + i, cat: a[0], q: a[1], a: a[2] }));
  S.enquiries.push({ id: 'q_1', ref: 'MEA-1041', date: isoAdd(T, -2), name: 'Rukhsana Begum', email: 'rukhsana@example.com', phone: '07700 900123', role: 'Parent', topic: 'Course & registration', team: 'Admissions team', message: 'Do you run a Year 6 maths class on Saturdays?', status: 'New' });
  S.enquiries.push({ id: 'q_2', ref: 'MEA-1042', date: isoAdd(T, -1), name: 'Mr. Daniel Reid', email: 'daniel.reid@example.com', phone: '', role: 'Parent', topic: 'Fees / payment', team: 'Accounts team', message: 'Can I pay termly rather than monthly?', status: 'Open' });
  return S;
}
