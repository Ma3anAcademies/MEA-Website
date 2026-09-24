// Sends real email via Resend (https://resend.com) — a simple HTTP API, no
// SMTP setup needed. Entirely optional: every function here checks whether
// RESEND_API_KEY is set and quietly does nothing if it isn't, so the site
// works with zero email setup and gains real email the moment a key is added.

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);
const FROM = () => process.env.EMAIL_FROM || "Ma3an Education Academies <onboarding@resend.dev>";

async function send({ to, subject, html }) {
  if (!emailConfigured()) return { skipped: true };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM(), to, subject, html }),
    });
    if (!res.ok) { console.error("Resend error", res.status, await res.text().catch(() => "")); return { error: true }; }
    return { ok: true };
  } catch (e) { console.error("Resend request failed", e); return { error: true }; }
}

const wrap = (title, bodyHtml) => `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="color:#123B63;margin-bottom:4px">${title}</h2>
  ${bodyHtml}
  <p style="color:#8a94a3;font-size:12px;margin-top:32px">Ma3an Education Academies (MEA)</p>
</div>`;

export async function sendVerificationEmail(to, name, link) {
  return send({
    to, subject: "Confirm your MEA account",
    html: wrap("Confirm your email", `
      <p>Hi ${name},</p>
      <p>Thanks for creating a parent account with MEA. Click below to confirm your email address and finish setting up your account.</p>
      <p style="margin:24px 0"><a href="${link}" style="background:#D1174D;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Confirm my email</a></p>
      <p style="color:#5A6E85;font-size:13px">This link works for 60 minutes. If you didn't create this account, you can ignore this email.</p>`),
  });
}

export async function sendPasswordResetEmail(to, name, link) {
  return send({
    to, subject: "Reset your MEA password",
    html: wrap("Reset your password", `
      <p>Hi ${name},</p>
      <p>We received a request to reset your MEA password. Click below to choose a new one.</p>
      <p style="margin:24px 0"><a href="${link}" style="background:#0672AB;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Reset my password</a></p>
      <p style="color:#5A6E85;font-size:13px">This link works for 60 minutes. If you didn't request this, you can ignore this email — your password won't change.</p>`),
  });
}
