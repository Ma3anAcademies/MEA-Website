'use strict';
/* =====================================================================
   MEA – selectors & business logic (single source of truth for classes:
   public timetable, course finder and family timetable all read from here)
   ===================================================================== */
const subj = id => SUBJECTS.find(s => s.id === id);
function levelInfo(id) { for (const s of Object.values(SYS)) { const l = s.levels.find(x => x.id === id); if (l) return { ...l, sys: s.id }; } return null; }
const isOff = (kind, id) => S.off[kind].includes(id);
const activeLevels = sys => SYS[sys].levels.filter(l => !isOff('levels', l.id));
const activeSubjects = () => SUBJECTS.filter(s => !isOff('subjects', s.id));
const courseById = id => S.courses.find(c => c.id === id);
const courseBySlug = s => S.courses.find(c => c.slug === s);
const classById = id => S.classes.find(c => c.id === id);
const childById = id => S.children.find(c => c.id === id);
const userById = id => S.users.find(u => u.id === id);
const clsCourse = cl => courseById(cl.courseId);
const teacherOf = cl => userById(cl.teacherId);
const levelName = id => (levelInfo(id) || {}).name || id;
const grpOf = subjectId => (subj(subjectId) || { grp: 'blue' }).grp;
const childrenOf = pid => S.children.filter(c => c.parentId === pid);
const enrolsOf = (cid, statuses) => S.enrolments.filter(e => e.childId === cid && (!statuses || statuses.includes(e.status)));
const OCCUPY = ['Active', 'Pending Confirmation'];
const filledCount = cl => S.enrolments.filter(e => e.classId === cl.id && OCCUPY.includes(e.status)).length;
const seatsLeft = cl => Math.max(0, cl.capacity - filledCount(cl));
/* Fees are priced per lesson. A family pays for a term or a month at a time:
   we work out exactly how many lessons fall in that period from the class's
   real weekly schedule (not a flat assumption), then charge lessons × the
   per-lesson fee. */
const classFee = cl => cl.feeOverride != null && cl.feeOverride !== '' ? +cl.feeOverride : clsCourse(cl).fee;
const lessonsInTerm = cl => { const from = todayISO() > S.term.start ? todayISO() : S.term.start; return classSessions(cl, from, S.term.end).length; };
const lessonsInMonth = (cl, fromISO) => classSessions(cl, fromISO || todayISO(), isoAdd(fromISO || todayISO(), 27)).length;
function periodLessons(cl, period) { return period === 'term' ? lessonsInTerm(cl) : lessonsInMonth(cl); }
function periodTotal(cl, period) {
  const feePerLesson = classFee(cl), lessons = periodLessons(cl, period);
  return { feePerLesson, lessons, total: Math.round(feePerLesson * lessons * 100) / 100 };
}
const weekOf = iso => Math.floor(daysBetween(S.term.start, iso) / 7) + 1;
function levelOfStage(sys, stage) { const l = SYS[sys].levels.find(x => x.years.includes(stage)); return l ? l.id : null; }
const stageMismatch = (child, course) => child.sys !== course.sys || levelOfStage(child.sys, child.stage) !== course.level;

function avail(cl) {
  if (!cl.enrolOpen || cl.status !== 'Running') return { k: 'closed', label: 'Enrolment closed', cls: 'chip-grey', icon: 'lock' };
  const l = seatsLeft(cl);
  if (l === 0) return { k: 'full', label: 'Full – join waitlist', cls: 'chip-pink', icon: 'clock' };
  if (l <= 2) return { k: 'limited', label: 'Limited places', cls: 'chip-yellow', icon: 'alert-triangle' };
  return { k: 'open', label: 'Places available', cls: 'chip-green', icon: 'check-circle' };
}
function classSessions(cl, from, to) {
  const out = [];
  for (let d = from; d <= to; d = isoAdd(d, 1)) {
    if (d < cl.startDate || d > cl.endDate) continue;
    const dw = dowOf(d);
    cl.days.forEach(x => { if (x.d === dw) out.push({ id: `${cl.id}@${d}@${x.start}`, classId: cl.id, date: d, start: x.start, end: x.end }); });
  }
  return out;
}
function sessionById(id) {
  const [classId, date, start] = id.split('@'), cl = classById(classId); if (!cl) return null;
  const x = cl.days.find(d => d.start === start); return x ? { id, classId, date, start, end: x.end } : null;
}
function upcomingSessions(cl, n = 1) {
  const now = ukNow(), out = [];
  classSessions(cl, now.date, isoAdd(now.date, 28)).forEach(s => { if (s.date > now.date || toMin(s.end) > now.min) out.push(s); });
  return out.slice(0, n);
}
const nextSession = cl => upcomingSessions(cl, 1)[0] || null;
function schedText(cl) {
  const groups = [];
  [...cl.days].sort((a, b) => ((a.d + 6) % 7) - ((b.d + 6) % 7)).forEach(x => {
    const g = groups.find(g => g.s === x.start && g.e === x.end); if (g) g.d.push(x.d); else groups.push({ s: x.start, e: x.end, d: [x.d] });
  });
  return { days: groups.map(g => g.d.map(d => DAYS[d] + 's').join(' & ')).join('; '), time: groups.map(g => fmtRange(g.s, g.e)).join('; '), short: groups.map(g => g.d.map(d => DS[d]).join(' & ') + ' ' + fmtRange(g.s, g.e)).join('; ') };
}
const startsLater = cl => cl.startDate > todayISO();

/* class search used by public Course Finder, Timetables & the parent portal.
   The free-text search matches every word in the query independently and in
   any order (so "math" finds all Mathematics classes, and "KS3 English"
   finds every KS3 English year, regardless of word order), rather than
   requiring the whole phrase to appear verbatim. */
function findClasses(f = {}) {
  const words = (f.q || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  return S.classes.filter(cl => {
    const co = clsCourse(cl); if (!co.active) return false;
    if (isOff('levels', co.level) || isOff('subjects', co.subject)) return false;
    if (f.sys && co.sys !== f.sys) return false;
    if (f.level && co.level !== f.level) return false;
    if (f.year) { const l = levelOfStage(co.sys, f.year); if (l !== co.level) return false; }
    if (f.subject && co.subject !== f.subject) return false;
    if (f.board && co.board !== f.board) return false;
    if (f.day !== undefined && f.day !== '' && !cl.days.some(d => d.d === +f.day)) return false;
    if (f.trial && !co.trial) return false;
    if (words.length) {
      const lv = levelInfo(co.level);
      const hay = (co.title + ' ' + subj(co.subject).name + ' ' + levelName(co.level) + ' ' + co.board + ' ' + lv.years.join(' ')).toLowerCase();
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  }).sort((a, b) => SYS[clsCourse(a).sys].levels.findIndex(l => l.id === clsCourse(a).level) - SYS[clsCourse(b).sys].levels.findIndex(l => l.id === clsCourse(b).level) || clsCourse(a).title.localeCompare(clsCourse(b).title));
}
const subjectsAt = (sys, level) => { const ids = new Set(findClasses({ sys, level }).map(c => clsCourse(c).subject)); return SUBJECTS.filter(s => ids.has(s.id)); };
const stagesForSubject = (sys, subject) => { const ids = new Set(findClasses({ sys, subject }).map(c => clsCourse(c).level)); return SYS[sys].levels.filter(l => ids.has(l.id)); };

/* Course Finder results: splits a class whose level spans several years
   (e.g. "KS3 Maths" covering Year 7–9) into one row per individual year, so
   results never group years together — the underlying class, teacher and
   schedule are shared, only the display row is per-year. When a specific
   year is already chosen (via the year carousel or the Year/level filter),
   this naturally yields just that one row. */
function courseFinderRows(f = {}) {
  return findClasses(f).flatMap(cl => {
    const lv = levelInfo(clsCourse(cl).level);
    if (f.year) return [{ cl, year: f.year, levelLabel: lv.name }];
    return lv.years.map(y => ({ cl, year: y, levelLabel: lv.name }));
  });
}

/* homework state for a child */
function subFor(hwId, childId) { return S.submissions.find(s => s.hwId === hwId && s.childId === childId); }
function hwStatus(hw, childId) {
  const s = subFor(hw.id, childId); if (s) return s.score != null ? 'Marked' : 'Submitted';
  const n = daysBetween(todayISO(), hw.due); return n < 0 ? 'Overdue' : n <= 2 ? 'Due soon' : 'To do';
}
/* notifications / messages */
const myNotifs = pid => S.notifications.filter(n => n.parentId === pid).sort((a, b) => b.date.localeCompare(a.date));
const unreadNotifs = pid => myNotifs(pid).filter(n => !n.read).length;
const myThreads = u => S.threads.filter(t => u.role === 'parent' ? t.parentId === u.id : t.staffId === u.id || (u.role === 'admin' && userById(t.staffId).role === 'admin')).sort((a, b) => b.messages[b.messages.length - 1].at.localeCompare(a.messages[a.messages.length - 1].at));
const unreadThreads = u => myThreads(u).filter(t => u.role === 'parent' ? t.unreadParent : t.unreadStaff).length;
function addNotif(parentId, type, childId, text, route) { S.notifications.push({ id: uid('nt'), parentId, type, childId, text, route, date: todayISO(), read: false }); }
const familyDiscount = pid => SITE.siblingDiscount && childrenOf(pid).filter(c => enrolsOf(c.id, ['Active']).length).length >= 2 ? SITE.siblingDiscount : 0;
function invoiceTotals(inv) { const sub = inv.lines.reduce((a, l) => a + l.amt, 0), disc = inv.discountPct ? Math.round(sub * inv.discountPct) / 100 : 0; return { sub, disc, total: sub - disc }; }
const ENQ_TOPICS = { 'Course & registration': 'Admissions team', 'Fees / payment': 'Accounts team', 'Technical / account access': 'Technical support', 'Timetable / class changes': 'Timetable team', 'General enquiry': 'Support team' };
