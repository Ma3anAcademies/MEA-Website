import { readToken } from "./_lib/auth.mjs";
import { listCourses, createCourse, updateCourse } from "./_lib/courses.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req) => {
  if (req.method === "GET") {
    const courses = await listCourses();
    return json({ courses });
  }
  const payload = readToken(req);
  if (!payload || payload.role !== "admin") return err(401, "Admin sign-in required.");

  if (req.method === "POST") {
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    if (!body.title) return err(400, "Enter a course title.");
    const course = await createCourse(body);
    return json({ course });
  }
  if (req.method === "PATCH") {
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    const { id, ...patch } = body || {};
    if (!id) return err(400, "Missing course id.");
    const course = await updateCourse(id, patch);
    if (!course) return err(404, "Course not found.");
    return json({ course });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/courses" };
