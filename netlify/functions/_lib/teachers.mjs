import crypto from "node:crypto";
import { promisify } from "node:util";
import { getNamedStore } from "./store.mjs";
import { hex, normEmail, EMAIL, passwordProblem } from "./auth.mjs";

const scrypt = promisify(crypto.scrypt);
const store = () => getNamedStore("teachers");
const DUMMY_SALT = crypto.randomBytes(16);

export async function listTeachers() {
  const { blobs } = await store().list({ prefix: "t:" });
  const out = [];
  for (const b of blobs) { const v = await store().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out;
}
export async function getTeacher(id) { return store().get(`t:${id}`, { type: "json" }).catch(() => null); }

/** Admin creates a teacher account directly (there's no self-service sign-up for staff). */
export async function createTeacher({ name, email, password, subjects, levels, boards, qual, bio }) {
  const e = normEmail(email);
  if (!name || String(name).trim().length < 2) return { error: "Enter the teacher's name.", field: "name" };
  if (!EMAIL.test(e)) return { error: "Enter a valid email address.", field: "email" };
  const existing = await store().get(`e:${hex(e)}`, { type: "json" }).catch(() => null);
  if (existing) return { error: "A teacher account with this email already exists.", field: "email" };
  const problem = passwordProblem(password);
  if (problem) return { error: problem, field: "password" };
  const id = crypto.randomUUID();
  const salt = crypto.randomBytes(16);
  const hash = (await scrypt(String(password), salt, 64)).toString("hex");
  const teacher = { id, role: "teacher", name: String(name).trim(), email: e, salt: salt.toString("hex"), hash, epoch: 1, subjects: subjects || "", levels: levels || "", boards: boards || "", qual: qual || "", bio: bio || "", publish: false, createdAt: Date.now() };
  await store().setJSON(`t:${id}`, teacher);
  await store().setJSON(`e:${hex(e)}`, id);
  return { teacher };
}

export async function verifyTeacherLogin(email, password) {
  const id = await store().get(`e:${hex(normEmail(email))}`, { type: "json" }).catch(() => null);
  const t = id ? await getTeacher(id) : null;
  const salt = t?.salt ? Buffer.from(t.salt, "hex") : DUMMY_SALT;
  const given = await scrypt(String(password ?? ""), salt, 64);
  if (!t?.hash || !crypto.timingSafeEqual(given, Buffer.from(t.hash, "hex"))) return null;
  return t;
}

export async function updateTeacher(id, patch) {
  const existing = await getTeacher(id);
  if (!existing) return { error: "That teacher wasn't found." };
  const updated = { ...existing, ...patch };
  await store().setJSON(`t:${id}`, updated);
  return { teacher: updated };
}

/** Admin-only: permanently removes a teacher's sign-in account. Any classes
    assigned to them are NOT deleted — they're left with no teacher assigned
    (teacherId cleared) so admin can reassign rather than losing the class. */
export async function deleteTeacher(id) {
  const existing = await getTeacher(id);
  if (!existing) return { error: "That teacher wasn't found." };
  await store().delete(`t:${id}`);
  await store().delete(`e:${hex(normEmail(existing.email))}`);
  return { ok: true };
}
