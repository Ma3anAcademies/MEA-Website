import { readToken } from "./_lib/auth.mjs";
import { setMessagePref } from "./_lib/notify.mjs";
import { json, err } from "./_lib/http.mjs";

// Saves the "email me about new messages" switch for the signed-in parent or teacher.
export default async (req) => {
  const payload = readToken(req);
  if (!payload) return err(401, "Sign in first.");
  if (req.method !== "POST") return err(405, "Method not allowed.");
  let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
  await setMessagePref(payload.id, body.messages !== false);
  return json({ ok: true });
};
export const config = { path: "/api/notify-prefs" };
