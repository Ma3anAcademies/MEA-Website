import { consumeVerificationToken, createVerificationToken, getParentByEmail } from "./_lib/parents.mjs";
import { signToken, sessionCookie, SESSION_SECONDS } from "./_lib/auth.mjs";
import { sendVerificationEmail, emailConfigured } from "./_lib/email.mjs";
import { clientIp, allowAction, tooMany } from "./_lib/ratelimit.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return err(405, "Method not allowed.");
  let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }

  // Completing verification from the emailed link.
  if (body.token) {
    const { account, error } = await consumeVerificationToken(body.token);
    if (error) return err(400, error);
    const sessToken = signToken({ role: "parent", id: account.id, name: account.name, email: account.email, epoch: account.epoch, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS });
    return json(
      { ok: true, user: { role: "parent", id: account.id, name: account.name, email: account.email, phone: account.phone, whatsapp: account.whatsapp || "" } },
      200,
      { "set-cookie": sessionCookie(req, sessToken, SESSION_SECONDS) }
    );
  }

  // Requesting the email again.
  if (body.email) {
    const ip = clientIp(req, context);
    const allowed = await allowAction("resend-verify", ip, { max: 5, windowMs: 60 * 60 * 1000 });
    if (!allowed) return err(429, tooMany(60));
    if (!emailConfigured()) return err(400, "Email sending isn't connected on this site yet.");
    const account = await getParentByEmail(body.email);
    if (account && !account.verified) {
      const token = await createVerificationToken(account.id);
      const link = `${new URL(req.url).origin}/#/account/verify?token=${token}`;
      await sendVerificationEmail(account.email, account.name, link);
    }
    // Same response either way, so this can't be used to find out which emails are registered.
    return json({ ok: true });
  }

  return err(400, "Missing token or email.");
};

export const config = { path: "/api/verify" };
