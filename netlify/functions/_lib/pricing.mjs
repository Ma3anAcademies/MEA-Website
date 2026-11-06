/**
 * Shared fee math for per-lesson pricing. Mirrors the frontend's logic in
 * public/js/data3.js (lessonsInTerm / lessonsInMonth / periodTotal) exactly,
 * so an invoice generated here always matches what a family was shown when
 * they chose "pay monthly" or "pay termly" at enrolment.
 */
const todayISO = () => new Date().toISOString().slice(0, 10);
const isoAdd = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
/** Last day (as ISO) of the calendar month containing iso. */
const endOfMonthISO = (iso) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCMonth(d.getUTCMonth() + 1, 0); return d.toISOString().slice(0, 10); };

/** Counts how many of a class's weekly sessions fall within [fromISO, toISO],
    clamped to the class's own start/end dates. */
function countSessions(cls, fromISO, toISO) {
  const from = fromISO > cls.startDate ? fromISO : cls.startDate;
  const to = toISO < cls.endDate ? toISO : cls.endDate;
  if (from > to) return 0;
  const dows = new Set((cls.days || []).map((d) => d.d));
  let count = 0;
  for (let d = from; d <= to; d = isoAdd(d, 1)) {
    const dow = new Date(d + "T12:00:00Z").getUTCDay();
    if (dows.has(dow)) count++;
  }
  return count;
}

/** Lessons in the chosen billing period, counted from today (or the class's
    own start date if that's later), for a class with the given term end.
    "Month" is the rest of the current calendar month, not a fixed 4-week
    window, so it reflects how many lessons are genuinely still to come.
    "Custom" is a fixed one-off block picked at enrolment time: either an exact
    lesson count, or counted from today through a chosen end date. */
export function lessonsForPeriod(cls, period, termEnd, custom) {
  const today = todayISO();
  if (period === "custom") {
    if (custom && custom.customUntil) return countSessions(cls, today, custom.customUntil);
    const n = Math.round(Number(custom && custom.customLessons)) || 1;
    return Math.max(1, Math.min(60, n));
  }
  if (period === "term") return countSessions(cls, today, termEnd || cls.endDate);
  return countSessions(cls, today, endOfMonthISO(today));
}

/** The per-lesson fee for a group class: the class's own override if admin set one,
    otherwise the admin-set group price for the course's level, otherwise the
    course's legacy fee. `prices` is the settings doc from getPricing(). */
export function classFeePerLesson(cls, course, prices) {
  if (cls.feeOverride != null && cls.feeOverride !== "") return Number(cls.feeOverride);
  const lp = prices && prices.levelPrices && prices.levelPrices[course.level];
  if (lp && lp.group != null) return Number(lp.group);
  return Number(course.fee || 0);
}

/** Full total for a class + billing period: { feePerLesson, lessons, total }.
    `custom` carries { customLessons, customUntil } for period === "custom". */
export function periodTotal(cls, course, period, termEnd, custom, prices) {
  const feePerLesson = classFeePerLesson(cls, course, prices);
  const lessons = lessonsForPeriod(cls, period, termEnd, custom);
  return { feePerLesson, lessons, total: Math.round(feePerLesson * lessons * 100) / 100 };
}
