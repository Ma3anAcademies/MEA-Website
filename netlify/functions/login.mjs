import { verifyParentLogin } from "./_lib/parents.mjs";
import { verifyTeacherLogin } from "./_lib/teachers.mjs";
import { adminConfigured, verifyAdminLogin, signToken, sessionCookie, SESSION_SECONDS } from "./_lib/auth.mjs";
import { clientIp, lockStatus, recordFailure, clearFailures, tooMany } from "./_lib/ratelimit.mjs";
import { json, err } from "./_lib/http.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async (req, context) => {
  if (req.method !== "POST") return err(405, "Method not allowed.");

  const ip = clientIp(req, context);
  const status = await lockStatus("login", ip);
  if (status.locked) return err(429, tooMany(status.minutes));

  let body;
  try { body = await req.json(); } catch { return err(400, "Invalid request."); }
  const { email, password } = body;

  // Try a parent account, then a teacher account, then the site admin login (its
  // "username" goes in the same field) — whichever one actually matches.
  const account = await verifyParentLogin(email, password);
  const teacher = !account ? await verifyTeacherLogin(email, password) : null;
  const adminCreds = !account && !teacher && adminConfigured() ? await verifyAdminLogin(email, password) : null;

  if (!account && !teacher && !adminCreds) {
    await recordFailure("login", ip, status);
    await sleep(500);
    return err(401, "That email and password don't match. Check them and try again, or reset your password.");
  }
  if (status.rec) await clearFailures("login", ip);

  if (account && !account.verified) {
    return err(403, "Please confirm your email address before signing in. Check your inbox for the verification link, or request a new one.", { needsVerification: true, email: account.email });
  }

  if (adminCreds) {
    const token = signToken({ role: "admin", id: "admin", name: adminCreds.username, email: "", v: adminCreds.version, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS });
    return json({ ok: true, user: { role: "admin", id: "admin", name: adminCreds.username, email: "" } }, 200, { "set-cookie": sessionCookie(req, token, SESSION_SECONDS) });
  }
  if (teacher) {
    const token = signToken({ role: "teacher", id: teacher.id, name: teacher.name, email: teacher.email, epoch: teacher.epoch, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS });
    return json({ ok: true, user: { role: "teacher", id: teacher.id, name: teacher.name, email: teacher.email, subjects: teacher.subjects, levels: teacher.levels, boards: teacher.boards, qual: teacher.qual, bio: teacher.bio, publish: teacher.publish } }, 200, { "set-cookie": sessionCookie(req, token, SESSION_SECONDS) });
  }
  const token = signToken({ role: "parent", id: account.id, name: account.name, email: account.email, epoch: account.epoch, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS });
  return json(
    { ok: true, user: { role: "parent", id: account.id, name: account.name, email: account.email, phone: account.phone, whatsapp: account.whatsapp || "" } },
    200,
    { "set-cookie": sessionCookie(req, token, SESSION_SECONDS) }
  );
};

export const config = { path: "/api/login" };
