import crypto from "node:crypto";
import { getNamedStore } from "./store.mjs";

const hwStore = () => getNamedStore("homework");
const subStore = () => getNamedStore("submissions");

export async function listHomeworkForClass(classId) {
  const { blobs } = await hwStore().list({ prefix: `h:${classId}:` });
  const out = [];
  for (const b of blobs) { const v = await hwStore().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
export async function getHomework(classId, id) { return hwStore().get(`h:${classId}:${id}`, { type: "json" }).catch(() => null); }

export async function createHomework(classId, { title, description, dueDate }) {
  if (!title) return { error: "Enter a title." };
  if (!dueDate) return { error: "Choose a due date." };
  const id = crypto.randomUUID();
  const hw = { id, classId, title: String(title).trim(), description: description || "", dueDate, createdAt: Date.now() };
  await hwStore().setJSON(`h:${classId}:${id}`, hw);
  return { homework: hw };
}

const subKey = (homeworkId, childId) => `s:${homeworkId}:${childId}`;

export async function listSubmissionsForHomework(homeworkId) {
  const { blobs } = await subStore().list({ prefix: `s:${homeworkId}:` });
  const out = [];
  for (const b of blobs) { const v = await subStore().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out;
}
/** All submissions for a set of homework ids (used to build a parent's own view). */
export async function listSubmissionsForChild(childId) {
  const { blobs } = await subStore().list({ prefix: "s:" });
  const out = [];
  for (const b of blobs) {
    if (!b.key.endsWith(`:${childId}`)) continue;
    const v = await subStore().get(b.key, { type: "json" }).catch(() => null);
    if (v) out.push(v);
  }
  return out;
}

export async function submitHomework(homeworkId, childId, fileName, fileUrl) {
  if (!fileName) return { error: "Choose a file to upload." };
  const sub = { homeworkId, childId, fileName, fileUrl: fileUrl || "", submittedAt: Date.now(), score: null, maxScore: 10, feedback: "", markedAt: null };
  await subStore().setJSON(subKey(homeworkId, childId), sub);
  return { submission: sub };
}

export async function markSubmission(homeworkId, childId, score, feedback) {
  const key = subKey(homeworkId, childId);
  const existing = await subStore().get(key, { type: "json" }).catch(() => null);
  if (!existing) return { error: "That submission wasn't found." };
  const updated = { ...existing, score, feedback: feedback || "", markedAt: Date.now() };
  await subStore().setJSON(key, updated);
  return { submission: updated };
}
