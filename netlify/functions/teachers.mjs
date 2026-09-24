import { readToken } from "./_lib/auth.mjs";
import { listTeachers, createTeacher, updateTeacher } from "./_lib/teachers.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req) => {
  const payload = readToken(req);

  if (req.method === "GET") {
    const teachers = await listTeachers();
    // Never send password hashes/salts to the browser. This GET is intentionally public
    // (no sign-in required): a class's assigned teacher is shown on public course pages
    // and to any signed-in family, not just admin.
    return json({ teachers: teachers.map(({ salt, hash, ...t }) => t) });
  }
  if (!payload || payload.role !== "admin") return err(401, "Admin sign-in required.");

  if (req.method === "POST") {
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    const { teacher, error, field } = await createTeacher(body);
    if (error) return err(400, error, { field });
    const { salt, hash, ...safe } = teacher;
    return json({ teacher: safe });
  }
  if (req.method === "PATCH") {
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    const { id, ...patch } = body || {};
    if (!id) return err(400, "Missing teacher id.");
    delete patch.password; delete patch.salt; delete patch.hash; // password changes need a dedicated flow, not a plain patch
    const { teacher, error } = await updateTeacher(id, patch);
    if (error) return err(404, error);
    const { salt, hash, ...safe } = teacher;
    return json({ teacher: safe });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/teachers" };
