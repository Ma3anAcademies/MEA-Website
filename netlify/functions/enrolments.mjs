import { readToken } from "./_lib/auth.mjs";
import { listEnrolments, requestEnrolment, setEnrolmentStatus, moveEnrolment, getEnrolment, adminEnrol, setBillingPeriod, markCustomBilled } from "./_lib/enrolments.mjs";
import { listChildren, listAllChildren } from "./_lib/children.mjs";
import { listClasses, getClass } from "./_lib/classes.mjs";
import { getCourse } from "./_lib/courses.mjs";
import { createInvoice } from "./_lib/invoices.mjs";
import { periodTotal } from "./_lib/pricing.mjs";
import { getPricing } from "./_lib/pricing-settings.mjs";
import { json, err } from "./_lib/http.mjs";

/** Admin accepting a request (or offering a waitlisted child a place) no longer
    puts the child straight on the roster. Instead it bills the required first
    payment immediately as a one-off invoice and holds the enrolment as
    "Awaiting Payment" — still occupying the seat, just not yet attending —
    until that invoice clears (see markPaid in _lib/invoices.mjs, which flips
    it to Active the moment payment is confirmed, by Stripe or by hand). */
async function acceptWithFirstPayment(existing) {
  const cls = await getClass(existing.classId);
  if (!cls) return { error: "That class could not be found." };
  const course = await getCourse(cls.courseId);
  if (!course) return { error: "That course could not be found." };
  const child = (await listAllChildren()).find((c) => c.id === existing.childId);
  if (!child) return { error: "That child could not be found." };
  const period = existing.billingPeriod === "term" ? "term" : existing.billingPeriod === "custom" ? "custom" : "month";
  const { feePerLesson, lessons, total: rawTotal } = periodTotal(cls, course, period, null, existing, await getPricing());
  const bundlePct = Math.max(0, Math.min(100, Number(existing.bundleDiscountPct) || 0));
  const total = bundlePct ? Math.round(rawTotal * (1 - bundlePct / 100) * 100) / 100 : rawTotal;
  const periodLabel = period === "term" ? "this term" : period === "custom" ? "one-off block" : "this month";
  const desc = `${course.title} (${lessons} lesson${lessons === 1 ? "" : "s"} × £${feePerLesson.toFixed(2)}, first payment${bundlePct ? `, ${bundlePct}% multi-course discount applied` : ""})`;
  const dueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { invoice, error } = await createInvoice({
    parentId: child.parentId,
    period: "First payment",
    dueDate,
    lines: [{ child: child.first, desc, amount: total }],
    enrolmentIds: [existing.id],
  });
  if (error) return { error };
  const { enrolment, error: statusError } = await setEnrolmentStatus(existing.id, "Awaiting Payment");
  if (statusError) return { error: statusError };
  if (period === "custom") await markCustomBilled(existing.id);
  return { enrolment, invoice };
}

export default async (req) => {
  const payload = readToken(req);
  if (!payload) return err(401, "Sign in first.");

  if (req.method === "GET") {
    const all = await listEnrolments();
    if (payload.role === "admin") return json({ enrolments: all });
    if (payload.role === "parent") {
      const mine = new Set((await listChildren(payload.id)).map((c) => c.id));
      return json({ enrolments: all.filter((e) => mine.has(e.childId)) });
    }
    if (payload.role === "teacher") {
      // A teacher sees the real class roster (and only that) for classes assigned to them —
      // needed so their students actually show up to mark homework for, take attendance, etc.
      const myClassIds = new Set((await listClasses()).filter((c) => c.teacherId === payload.id).map((c) => c.id));
      return json({ enrolments: all.filter((e) => myClassIds.has(e.classId) && e.status === "Active") });
    }
    return err(403, "Not available for this account type.");
  }

  if (req.method === "POST") {
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    const opts = { customLessons: body.customLessons, customUntil: body.customUntil, bundleDiscountPct: body.bundleDiscountPct };
    if (payload.role === "admin") {
      if (!body.childId || !body.classId) return err(400, "Missing child or class.");
      const { enrolment, error } = await adminEnrol(body.childId, body.classId, body.billingPeriod, opts);
      if (error) return err(400, error);
      // Arranged one-to-one lessons: hold the seat and bill the first payment, same as
      // an approved group request (becomes Active when the invoice is paid).
      if (body.awaitPayment) {
        const result = await acceptWithFirstPayment(enrolment);
        if (result.error) return err(400, result.error);
        return json({ enrolment: result.enrolment, invoice: result.invoice });
      }
      return json({ enrolment });
    }
    if (payload.role !== "parent") return err(403, "Only a parent account can request enrolment.");
    const mine = new Set((await listChildren(payload.id)).map((c) => c.id));
    if (!body.childId || !mine.has(body.childId)) return err(403, "That child does not belong to your account.");
    const { enrolment, error } = await requestEnrolment(body.childId, body.classId, body.billingPeriod, opts);
    if (error) return err(400, error);
    return json({ enrolment });
  }

  if (req.method === "PATCH") {
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    const { id, status, classId, billingPeriod } = body || {};
    if (!id) return err(400, "Missing enrolment id.");
    const existing = await getEnrolment(id);
    if (!existing) return err(404, "Enrolment not found.");
    if (payload.role === "parent") {
      // A parent may only withdraw their own child's request — nothing else.
      const mine = new Set((await listChildren(payload.id)).map((c) => c.id));
      if (!mine.has(existing.childId)) return err(403, "That enrolment does not belong to your account.");
      if (status !== "Withdrawn" || classId) return err(403, "You can only cancel your own request.");
    } else if (payload.role !== "admin") {
      return err(403, "Only admin can manage enrolments.");
    }
    // Admin accepting a request, or offering a waitlisted child a place: bill the
    // first payment now and hold the enrolment as "Awaiting Payment" rather than
    // putting the child straight on the roster — see acceptWithFirstPayment above.
    if (payload.role === "admin" && status === "Active" && ["Pending Confirmation", "Waitlisted"].includes(existing.status) && !classId) {
      const result = await acceptWithFirstPayment(existing);
      if (result.error) return err(400, result.error);
      return json({ enrolment: result.enrolment, invoice: result.invoice });
    }
    const result = classId ? await moveEnrolment(id, classId) : billingPeriod ? await setBillingPeriod(id, billingPeriod) : await setEnrolmentStatus(id, status);
    if (result.error) return err(400, result.error);
    return json({ enrolment: result.enrolment });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/enrolments" };
