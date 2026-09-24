import { readToken } from "./_lib/auth.mjs";
import { listAllParents } from "./_lib/parents.mjs";
import { listAllChildren } from "./_lib/children.mjs";
import { listTeachers } from "./_lib/teachers.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req) => {
  const payload = readToken(req);
  if (!payload || payload.role !== "admin") return err(401, "Admin sign-in required.");
  if (req.method !== "GET") return err(405, "Method not allowed.");

  const [parents, children, teachersRaw] = await Promise.all([listAllParents(), listAllChildren(), listTeachers()]);
  const teachers = teachersRaw.map(({ salt, hash, ...t }) => t);
  return json({ parents, children, teachers });
};

export const config = { path: "/api/admin-directory" };
