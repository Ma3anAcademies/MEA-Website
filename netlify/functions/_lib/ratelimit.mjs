import crypto from "node:crypto";
import { getNamedStore } from "./store.mjs";

const hashOf = (s) => crypto.createHash("sha256").update(String(s)).digest("hex").slice(0, 32);
const store = () => getNamedStore("auth");

export const clientIp = (req, context) =>
  context?.ip || req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

/** `max` failures inside `windowMs` locks that IP for the rest of the window. */
export async function lockStatus(scope, ip, { max = 5, windowMs = 15 * 60 * 1000 } = {}) {
  const rec = await store().get(`${scope}:${hashOf(ip)}`, { type: "json" });
  const now = Date.now();
  const active = rec && now - rec.first < windowMs ? rec : null;
  if (active && active.count >= max) return { locked: true, minutes: Math.ceil((windowMs - (now - active.first)) / 60000), rec: active };
  return { locked: false, minutes: 0, rec: active };
}
export async function recordFailure(scope, ip, status, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const active = status?.rec && now - status.rec.first < windowMs ? status.rec : null;
  await store().setJSON(`${scope}:${hashOf(ip)}`, { count: (active?.count ?? 0) + 1, first: active?.first ?? now });
}
export async function clearFailures(scope, ip) { await store().delete(`${scope}:${hashOf(ip)}`); }

/** Simple counter limit for actions (not failures, e.g. registrations per hour). Returns true if allowed. */
export async function allowAction(scope, ip, { max, windowMs }) {
  const s = store();
  const key = `${scope}:${hashOf(ip)}`;
  const rec = await s.get(key, { type: "json" });
  const now = Date.now();
  const active = rec && now - rec.first < windowMs ? rec : null;
  if (active && active.count >= max) return false;
  await s.setJSON(key, { count: (active?.count ?? 0) + 1, first: active?.first ?? now });
  return true;
}

export const tooMany = (minutes) => `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
