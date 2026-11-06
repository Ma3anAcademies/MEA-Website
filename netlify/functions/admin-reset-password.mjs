import { readToken } from "./_lib/auth.mjs";
import { adminSetParentPassword } from "./_lib/parents.mjs";
import { adminSetTeacherPassword } from "./_lib/teachers.mjs";
import { json, err } from "./_lib/http.mjs";

/** Admin-only: force-sets a parent or teacher's password directly, for when a
    family or staff member can't get into their account any other way (lost
    access to their email, say). A dedicated endpoint rather than folding this
    into teachers.mjs/children.mjs's own PATCH handlers, which deliberately
    refuse password fields on an ordinary profile edit. */
export default async (req) => {
  const payload = readToken(req);
  if (!payload || payload.role !== "admin") return err(401, "Admin sign-in required.");
  if (req.method !== "POST") return err(405, "Method not allowed.");

  let body;
  try { body = await req.json(); } catch { return err(400, "Invalid request."); }
  const { role, id, password } = body || {};
  if (!id || !password) return err(400, "Missing account or new password.");

  if (role === "teacher") {
    const { teacher, error } = await adminSetTeacherPassword(id, password);
    if (error) return err(400, error);
    return json({ ok: true, name: teacher.name });
  }
  if (role === "parent") {
    const { account, error } = await adminSetParentPassword(id, password);
    if (error) return err(400, error);
    return json({ ok: true, name: account.name });
  }
  return err(400, "Unknown account type.");
};

export const config = { path: "/api/admin-reset-password" };
