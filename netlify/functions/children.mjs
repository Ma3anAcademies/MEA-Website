import { readToken } from "./_lib/auth.mjs";
import { listChildren, addChild, updateChild, listChildrenByIds } from "./_lib/children.mjs";
import { listEnrolments } from "./_lib/enrolments.mjs";
import { listClasses } from "./_lib/classes.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req) => {
  const payload = readToken(req);
  if (!payload) return err(401, "Sign in first.");

  if (req.method === "GET") {
    if (payload.role === "teacher") {
      // Only the students actually enrolled (for real) in this teacher's own classes —
      // never the wider family/account details a parent or admin would see.
      const myClassIds = new Set((await listClasses()).filter((c) => c.teacherId === payload.id).map((c) => c.id));
      const all = await listEnrolments();
      const childIds = [...new Set(all.filter((e) => myClassIds.has(e.classId) && e.status === "Active").map((e) => e.childId))];
      const children = (await listChildrenByIds(childIds)).map(({ parentId, dob, school, ...safe }) => safe);
      return json({ children });
    }
    if (payload.role !== "parent") return err(401, "Sign in first.");
    const children = await listChildren(payload.id);
    return json({ children });
  }
  if (req.method === "POST") {
    if (payload.role !== "parent") return err(401, "Sign in first.");
    let body;
    try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    const { child, error } = await addChild(payload.id, body);
    if (error) return err(400, error);
    return json({ child });
  }
  if (req.method === "PATCH") {
    if (payload.role !== "parent") return err(401, "Sign in first.");
    let body;
    try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    const { id, ...patch } = body || {};
    if (!id) return err(400, "Missing child id.");
    const { child, error } = await updateChild(payload.id, id, patch);
    if (error) return err(400, error);
    return json({ child });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/children" };
