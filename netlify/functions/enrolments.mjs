import { readToken } from "./_lib/auth.mjs";
import { listEnrolments, requestEnrolment, setEnrolmentStatus, moveEnrolment, getEnrolment, adminEnrol, setBillingPeriod } from "./_lib/enrolments.mjs";
import { listChildren } from "./_lib/children.mjs";
import { listClasses } from "./_lib/classes.mjs";
import { json, err } from "./_lib/http.mjs";

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
    if (payload.role === "admin") {
      if (!body.childId || !body.classId) return err(400, "Missing child or class.");
      const { enrolment, error } = await adminEnrol(body.childId, body.classId, body.billingPeriod);
      if (error) return err(400, error);
      return json({ enrolment });
    }
    if (payload.role !== "parent") return err(403, "Only a parent account can request enrolment.");
    const mine = new Set((await listChildren(payload.id)).map((c) => c.id));
    if (!body.childId || !mine.has(body.childId)) return err(403, "That child does not belong to your account.");
    const { enrolment, error } = await requestEnrolment(body.childId, body.classId, body.billingPeriod);
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
    const result = classId ? await moveEnrolment(id, classId) : billingPeriod ? await setBillingPeriod(id, billingPeriod) : await setEnrolmentStatus(id, status);
    if (result.error) return err(400, result.error);
    return json({ enrolment: result.enrolment });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/enrolments" };
