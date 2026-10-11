import { readToken } from "./_lib/auth.mjs";
import { getParent } from "./_lib/parents.mjs";
import { getTeacher } from "./_lib/teachers.mjs";
import { emailConfigured } from "./_lib/email.mjs";
import { stripeConfigured } from "./_lib/stripe.mjs";
import { json } from "./_lib/http.mjs";

export default async (req) => {
  const payload = readToken(req);
  const emailOn = emailConfigured(), paymentsOn = stripeConfigured();
  if (!payload) return json({ user: null, emailConfigured: emailOn, paymentsConfigured: paymentsOn });

  if (payload.role === "admin") {
    return json({ user: { role: "admin", id: "admin", name: payload.name, email: "" }, emailConfigured: emailOn, paymentsConfigured: paymentsOn });
  }
  if (payload.role === "teacher") {
    const teacher = await getTeacher(payload.id);
    if (!teacher || teacher.epoch !== payload.epoch) return json({ user: null, emailConfigured: emailOn, paymentsConfigured: paymentsOn });
    return json({ user: { role: "teacher", id: teacher.id, name: teacher.name, email: teacher.email, subjects: teacher.subjects, levels: teacher.levels, boards: teacher.boards, qual: teacher.qual, bio: teacher.bio, publish: teacher.publish }, emailConfigured: emailOn, paymentsConfigured: paymentsOn });
  }
  const account = await getParent(payload.id);
  if (!account || account.epoch !== payload.epoch) return json({ user: null, emailConfigured: emailOn, paymentsConfigured: paymentsOn });
  return json({ user: { role: "parent", id: account.id, name: account.name, email: account.email, phone: account.phone, whatsapp: account.whatsapp || "" }, emailConfigured: emailOn, paymentsConfigured: paymentsOn });
};

export const config = { path: "/api/session" };
