import { registerParent } from "./_lib/parents.mjs";
import { signToken, sessionCookie, SESSION_SECONDS } from "./_lib/auth.mjs";
import { clientIp, allowAction, tooMany } from "./_lib/ratelimit.mjs";
import { sendVerificationEmail } from "./_lib/email.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return err(405, "Method not allowed.");

  const ip = clientIp(req, context);
  const allowed = await allowAction("register", ip, { max: 8, windowMs: 60 * 60 * 1000 });
  if (!allowed) return err(429, tooMany(60));

  let body;
  try { body = await req.json(); } catch { return err(400, "Invalid request."); }

  const { account, error, field, needsVerification, token } = await registerParent(body);
  if (error) return err(400, error, { field });

  if (needsVerification) {
    const link = `${new URL(req.url).origin}/#/account/verify?token=${token}`;
    await sendVerificationEmail(account.email, account.name, link);
    // No session cookie yet — they need to click the emailed link first.
    return json({ ok: true, needsVerification: true, email: account.email });
  }

  const sessToken = signToken({ role: "parent", id: account.id, name: account.name, email: account.email, epoch: account.epoch, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS });
  return json(
    { ok: true, user: { role: "parent", id: account.id, name: account.name, email: account.email, phone: account.phone } },
    200,
    { "set-cookie": sessionCookie(req, sessToken, SESSION_SECONDS) }
  );
};

export const config = { path: "/api/register" };
