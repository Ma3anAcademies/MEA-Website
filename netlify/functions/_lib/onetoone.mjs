import crypto from "node:crypto";
import { getNamedStore } from "./store.mjs";
import { getPricing } from "./pricing-settings.mjs";

const store = () => getNamedStore("onetoone");
export const O2O_STATUSES = ["Requested", "Arranged", "Declined", "Withdrawn"];
// Day-of-week numbers (0 = Sunday ... 6 = Saturday): every day except Saturday.
const DAYS = new Set([0, 1, 2, 3, 4, 5]);
// Hour a slot STARTS: 17 = 5pm-6pm ... 21 = 9pm-10pm (so 5pm to 10pm in all).
const HOURS = new Set([17, 18, 19, 20, 21]);

export async function listO2O() {
  const { blobs } = await store().list({ prefix: "o:" });
  const out = [];
  for (const b of blobs) { const v = await store().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out.sort((a, b) => b.created - a.created);
}
export async function getO2O(id) { return store().get(`o:${id}`, { type: "json" }).catch(() => null); }

export function cleanSlots(slots) {
  const seen = new Set(), out = [];
  for (const s of Array.isArray(slots) ? slots : []) {
    const [d, h] = String(s).split("-").map(Number);
    if (!DAYS.has(d) || !HOURS.has(h)) continue;
    const key = `${d}-${h}`; if (seen.has(key)) continue; seen.add(key); out.push(key);
  }
  return out;
}

export async function createO2O({ child, subject, board, slots, level }) {
  const clean = cleanSlots(slots);
  if (!subject) return { error: "Choose a subject." };
  if (!clean.length) return { error: "Tick at least one time you're available." };
  const prices = await getPricing();
  const lp = prices.levelPrices && prices.levelPrices[level];
  const id = crypto.randomUUID();
  const rec = { id, childId: child.id, parentId: child.parentId, subject: String(subject), level: level || "", board: board ? String(board) : "", slots: clean, pricePerLesson: lp ? lp.one2one : null, status: "Requested", note: "", created: Date.now() };
  await store().setJSON(`o:${id}`, rec);
  return { request: rec };
}

export async function updateO2O(id, patch) {
  const existing = await getO2O(id);
  if (!existing) return { error: "That request wasn't found." };
  const updated = { ...existing };
  if (patch.status !== undefined) { if (!O2O_STATUSES.includes(patch.status)) return { error: "Unknown status." }; updated.status = patch.status; }
  if (patch.note !== undefined) updated.note = String(patch.note).slice(0, 500);
  await store().setJSON(`o:${id}`, updated);
  return { request: updated };
}
