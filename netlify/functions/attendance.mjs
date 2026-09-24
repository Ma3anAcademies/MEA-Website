import { readToken } from "./_lib/auth.mjs";
import { getClass } from "./_lib/classes.mjs";
import { listAttendanceForSession, listAttendanceForChild, setAttendance } from "./_lib/attendance.mjs";
import { listChildren } from "./_lib/children.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req) => {
  const payload = readToken(req);
  if (!payload) return err(401, "Sign in first.");
  const url = new URL(req.url);

  if (req.method === "GET") {
    if (payload.role === "parent") {
      const kids = await listChildren(payload.id);
      const all = [];
      for (const k of kids) all.push(...(await listAttendanceForChild(k.id)));
      return json({ attendance: all });
    }
    const classId = url.searchParams.get("classId"), date = url.searchParams.get("date");
    if (!classId || !date) return err(400, "Missing classId or date.");
    if (payload.role === "teacher") {
      const cls = await getClass(classId);
      if (!cls || cls.teacherId !== payload.id) return err(403, "That is not your class.");
    } else if (payload.role !== "admin") return err(403, "Not available for this account type.");
    const attendance = await listAttendanceForSession(classId, date);
    return json({ attendance });
  }
  if (req.method === "POST") {
    if (payload.role !== "teacher" && payload.role !== "admin") return err(403, "Only a teacher or admin can record attendance.");
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    const { classId, date, childId, status } = body || {};
    if (!classId || !date || !childId || !status) return err(400, "Missing information.");
    if (payload.role === "teacher") {
      const cls = await getClass(classId);
      if (!cls || cls.teacherId !== payload.id) return err(403, "That is not your class.");
    }
    const { attendance, error } = await setAttendance(classId, date, childId, status);
    if (error) return err(400, error);
    return json({ attendance });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/attendance" };
