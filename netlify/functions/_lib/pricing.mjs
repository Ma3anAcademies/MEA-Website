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
    window, so it reflects how many lessons are genuinely still to come. */
export function lessonsForPeriod(cls, period, termEnd) {
  const today = todayISO();
  if (period === "term") return countSessions(cls, today, termEnd || cls.endDate);
  return countSessions(cls, today, endOfMonthISO(today));
}

/** The per-lesson fee for a class: its own override, or the course's fee. */
export function classFeePerLesson(cls, course) {
  return cls.feeOverride != null && cls.feeOverride !== "" ? Number(cls.feeOverride) : Number(course.fee || 0);
}

/** Full total for a class + billing period: { feePerLesson, lessons, total }. */
export function periodTotal(cls, course, period, termEnd) {
  const feePerLesson = classFeePerLesson(cls, course);
  const lessons = lessonsForPeriod(cls, period, termEnd);
  return { feePerLesson, lessons, total: Math.round(feePerLesson * lessons * 100) / 100 };
}
