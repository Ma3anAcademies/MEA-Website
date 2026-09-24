import { readToken } from "./_lib/auth.mjs";
import { listClasses, createClass, updateClass } from "./_lib/classes.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req) => {
  if (req.method === "GET") {
    const classes = await listClasses();
    return json({ classes });
  }
  const payload = readToken(req);
  const isStaff = payload && (payload.role === "admin" || payload.role === "teacher");
  if (!isStaff) return err(401, "Sign in required.");

  if (req.method === "POST") {
    if (payload.role !== "admin") return err(403, "Only admin can create classes.");
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    if (!body.courseId) return err(400, "Missing course.");
    const cls = await createClass(body);
    return json({ class: cls });
  }
  if (req.method === "PATCH") {
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    const { id, ...patch } = body || {};
    if (!id) return err(400, "Missing class id.");
    // Teachers may only update their own class's meeting link; everything else is admin-only.
    if (payload.role === "teacher") {
      const allowed = new Set(["meetingUrl"]);
      if (Object.keys(patch).some((k) => !allowed.has(k))) return err(403, "Teachers can only update the class meeting link.");
    }
    const cls = await updateClass(id, patch);
    if (!cls) return err(404, "Class not found.");
    return json({ class: cls });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/classes" };
