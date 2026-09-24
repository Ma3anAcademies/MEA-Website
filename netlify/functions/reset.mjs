import { createResetToken, consumeResetToken } from "./_lib/parents.mjs";
import { signToken, sessionCookie, SESSION_SECONDS } from "./_lib/auth.mjs";
import { sendPasswordResetEmail, emailConfigured } from "./_lib/email.mjs";
import { clientIp, allowAction, tooMany } from "./_lib/ratelimit.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req, context) => {
  const ip = clientIp(req, context);

  if (req.method === "POST") {
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    if (!body.email) return err(400, "Enter your email address.");
    const allowed = await allowAction("reset-request", ip, { max: 5, windowMs: 60 * 60 * 1000 });
    if (!allowed) return err(429, tooMany(60));
    if (!emailConfigured()) return err(400, "Email sending isn't connected on this site yet.");
    const { account, token } = await createResetToken(body.email);
    if (account && token) {
      const link = `${new URL(req.url).origin}/#/account/password-reset?stage=set&token=${token}`;
      await sendPasswordResetEmail(account.email, account.name, link);
    }
    // Same response whether or not the email is registered, so this can't be used to check that.
    return json({ ok: true });
  }

  if (req.method === "PATCH") {
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    if (!body.token || !body.password) return err(400, "Missing token or password.");
    const status = await allowAction("reset-complete", ip, { max: 10, windowMs: 60 * 60 * 1000 });
    if (!status) return err(429, tooMany(60));
    const { account, error } = await consumeResetToken(body.token, body.password);
    if (error) return err(400, error);
    const sessToken = signToken({ role: "parent", id: account.id, name: account.name, email: account.email, epoch: account.epoch, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS });
    return json(
      { ok: true, user: { role: "parent", id: account.id, name: account.name, email: account.email, phone: account.phone } },
      200,
      { "set-cookie": sessionCookie(req, sessToken, SESSION_SECONDS) }
    );
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/reset" };
