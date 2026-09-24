import { readToken } from "./_lib/auth.mjs";
import { getClass } from "./_lib/classes.mjs";
import { listHomeworkForClass, createHomework } from "./_lib/homework.mjs";
import { listChildren } from "./_lib/children.mjs";
import { listEnrolments } from "./_lib/enrolments.mjs";
import { json, err } from "./_lib/http.mjs";

async function parentCanSeeClass(parentId, classId) {
  const kidIds = new Set((await listChildren(parentId)).map((k) => k.id));
  const all = await listEnrolments();
  return all.some((e) => kidIds.has(e.childId) && e.classId === classId && ["Active", "Pending Confirmation", "Waitlisted", "Completed"].includes(e.status));
}

export default async (req) => {
  const payload = readToken(req);
  if (!payload) return err(401, "Sign in first.");
  const url = new URL(req.url);

  if (req.method === "GET") {
    const classId = url.searchParams.get("classId");
    if (!classId) return err(400, "Missing classId.");
    if (payload.role === "teacher") {
      const cls = await getClass(classId);
      if (!cls || cls.teacherId !== payload.id) return err(403, "That is not your class.");
    } else if (payload.role === "parent") {
      if (!(await parentCanSeeClass(payload.id, classId))) return err(403, "Your child isn't enrolled in that class.");
    } // admin: no extra check
    const homework = await listHomeworkForClass(classId);
    return json({ homework });
  }

  if (req.method === "POST") {
    if (payload.role !== "teacher" && payload.role !== "admin") return err(403, "Only a teacher or admin can set homework.");
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    if (!body.classId) return err(400, "Missing classId.");
    if (payload.role === "teacher") {
      const cls = await getClass(body.classId);
      if (!cls || cls.teacherId !== payload.id) return err(403, "That is not your class.");
    }
    const { homework, error } = await createHomework(body.classId, body);
    if (error) return err(400, error);
    return json({ homework });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/homework" };
