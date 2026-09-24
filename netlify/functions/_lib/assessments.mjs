import crypto from "node:crypto";
import { getNamedStore } from "./store.mjs";

const store = () => getNamedStore("assessments");

export async function listAssessmentsForChild(childId) {
  const { blobs } = await store().list({ prefix: `as:${childId}:` });
  const out = [];
  for (const b of blobs) { const v = await store().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}
export async function addAssessment(childId, { classId, title, date, score, maxScore, comment }) {
  if (!title) return { error: "Enter a title." };
  const id = crypto.randomUUID();
  const rec = { id, childId, classId, title: String(title).trim(), date: date || "", score: score == null ? null : +score, maxScore: maxScore ? +maxScore : 100, comment: comment || "", createdAt: Date.now() };
  await store().setJSON(`as:${childId}:${id}`, rec);
  return { assessment: rec };
}
