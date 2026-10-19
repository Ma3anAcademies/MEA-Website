import { readToken } from "./_lib/auth.mjs";
import { listForParent, listAll, createInvoice, markPaid } from "./_lib/invoices.mjs";
import { listChildren, listAllChildren } from "./_lib/children.mjs";
import { listEnrolments, markCustomBilled } from "./_lib/enrolments.mjs";
import { listCourses } from "./_lib/courses.mjs";
import { listClasses } from "./_lib/classes.mjs";
import { periodTotal } from "./_lib/pricing.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req) => {
  const payload = readToken(req);
  if (!payload) return err(401, "Sign in first.");

  if (req.method === "GET") {
    if (payload.role === "admin") return json({ invoices: await listAll() });
    if (payload.role !== "parent") return err(403, "Not available for this account type.");
    return json({ invoices: await listForParent(payload.id) });
  }

  if (req.method === "POST") {
    if (payload.role !== "admin") return err(403, "Only admin can create invoices.");
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }

    if (body.generateForPeriod) {
      // One invoice per parent with an active enrolment, built from their children's real
      // active classes - the same billing run a small tuition business does monthly.
      // Fees are per lesson: each enrolment's own billing-period choice ("month" or "term",
      // picked by the family at enrolment) decides how many of that class's real weekly
      // lessons the invoice line covers.
      const [allEnrolments, allChildren, allClasses, allCourses] = await Promise.all([listEnrolments(), listAllChildren(), listClasses(), listCourses()]);
      const active = allEnrolments.filter((e) => e.status === "Active");
      const byParent = new Map();
      const customBilledIds = [];
      for (const e of active) {
        // A "custom" booking is a fixed one-off block of lessons agreed at enrolment
        // time (not a recurring monthly/termly charge) — bill it once, the first time
        // invoices are generated after it starts, then never again.
        if (e.billingPeriod === "custom" && e.customBilled) continue;
        const child = allChildren.find((c) => c.id === e.childId); if (!child) continue;
        const cls = allClasses.find((c) => c.id === e.classId); if (!cls) continue;
        const course = allCourses.find((c) => c.id === cls.courseId); if (!course) continue;
        const period = e.billingPeriod === "term" ? "term" : e.billingPeriod === "custom" ? "custom" : "month";
        const { feePerLesson, lessons, total: rawTotal } = periodTotal(cls, course, period, null, e);
        const bundlePct = Math.max(0, Math.min(100, Number(e.bundleDiscountPct) || 0));
        const total = bundlePct ? Math.round(rawTotal * (1 - bundlePct / 100) * 100) / 100 : rawTotal;
        const periodLabel = period === "term" ? "this term" : period === "custom" ? "one-off block" : "this month";
        const desc = `${course.title} (${lessons} lesson${lessons === 1 ? "" : "s"} × £${feePerLesson.toFixed(2)}, ${periodLabel}${bundlePct ? `, ${bundlePct}% multi-course discount applied` : ""})`;
        const list = byParent.get(child.parentId) || []; list.push({ child: child.first, desc, amount: total }); byParent.set(child.parentId, list);
        if (period === "custom") customBilledIds.push(e.id);
      }
      const period = body.period || new Date().toLocaleString("en-GB", { month: "long", year: "numeric" });
      const created = [];
      for (const [parentId, lines] of byParent) {
        const kids = new Set(lines.map((l) => l.child));
        const { invoice } = await createInvoice({ parentId, period, dueDate: body.dueDate, lines, discountPct: kids.size >= 2 ? Number(body.siblingDiscountPct || 0) : 0 });
        if (invoice) created.push(invoice);
      }
      await Promise.all(customBilledIds.map((id) => markCustomBilled(id)));
      return json({ created: created.length });
    }

    const { invoice, error } = await createInvoice(body);
    if (error) return err(400, error);
    return json({ invoice });
  }

  if (req.method === "PATCH") {
    if (payload.role !== "admin") return err(403, "Only admin can update invoices.");
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    if (!body.parentId || !body.id) return err(400, "Missing invoice.");
    const { invoice, error } = await markPaid(body.parentId, body.id, { manual: true });
    if (error) return err(404, error);
    return json({ invoice });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/invoices" };
