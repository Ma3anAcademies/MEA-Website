// Emails someone when a new message arrives for them (parent, teacher or admin).
// - Sent only if email is set up (RESEND_API_KEY); otherwise silently skipped.
// - Never contains the message text (privacy); it links to the sign-in page.
// - At most one email per conversation every 10 minutes, so a back-and-forth
//   chat doesn't flood anyone's inbox.
// - Respects the "Messages" switch in Settings > Notifications.
import { getNamedStore } from "./store.mjs";
import { getParent } from "./parents.mjs";
import { getTeacher } from "./teachers.mjs";
import { emailConfigured, sendNewMessageEmail } from "./email.mjs";

const prefs = () => getNamedStore("prefs");
const GAP = 10 * 60 * 1000;

export async function setMessagePref(userId, on) { await prefs().setJSON(`m:${userId}`, { on: !!on }); }
async function wantsMessages(userId) { const v = await prefs().get(`m:${userId}`, { type: "json" }).catch(() => null); return !v || v.on !== false; }

async function nameOf(role, id) {
  if (role === "parent") { const p = await getParent(id); return p ? p.name : "A parent"; }
  if (role === "teacher") { const t = await getTeacher(id); return t ? t.name : "A teacher"; }
  return "MEA Support Team";
}

/** thread = the conversation; sender = { id, role }; origin = the site's address, e.g. https://meatuition.org.uk */
export async function notifyNewMessage(thread, sender, origin) {
  try {
    if (!emailConfigured()) return;
    const toParent = sender.role !== "parent";
    const key = `t:${thread.id}:${toParent ? "p" : "s"}`;
    const last = await prefs().get(key, { type: "json" }).catch(() => null);
    if (last && Date.now() - last.at < GAP) return;

    let to = "", name = "", userId = "", link = "";
    if (toParent) {
      const p = await getParent(thread.parentId); if (!p) return;
      to = p.email; name = p.name; userId = p.id; link = `${origin}/#/my-mea/messages/${thread.id}`;
    } else if (thread.staffId === "admin") {
      to = process.env.ADMIN_NOTIFY_EMAIL || ""; name = "MEA Support"; userId = "admin"; link = `${origin}/#/admin/support?tab=messages`;
    } else {
      const t = await getTeacher(thread.staffId); if (!t) return;
      to = t.email; name = t.name; userId = t.id; link = `${origin}/#/teacher/messages`;
    }
    if (!to || !(await wantsMessages(userId))) return;
    const from = toParent ? await nameOf(sender.role, sender.id) : await nameOf("parent", thread.parentId);
    await sendNewMessageEmail(to, name, from, link);
    await prefs().setJSON(key, { at: Date.now() });
  } catch (e) { console.error("notifyNewMessage failed", e); }
}
