import crypto from "node:crypto";
import { getNamedStore } from "./store.mjs";

const threads = () => getNamedStore("threads");
const msgs = () => getNamedStore("messages");

export async function listThreadsFor(userId, role) {
  const prefix = role === "parent" ? "p:" : "s:";
  const { blobs } = await threads().list({ prefix: `${prefix}${userId}:` });
  const out = [];
  for (const b of blobs) { const v = await threads().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out;
}
export async function getThread(id) { return threads().get(`t:${id}`, { type: "json" }).catch(() => null); }

export async function createThread(parentId, staffId, subject, childId, classId) {
  if (!subject) return { error: "Enter a subject." };
  const id = crypto.randomUUID();
  const th = { id, parentId, staffId, subject: String(subject).trim(), childId: childId || "", classId: classId || "", unreadParent: false, unreadStaff: true, createdAt: Date.now() };
  await threads().setJSON(`t:${id}`, th);
  // index rows so each side can list their own threads by a cheap prefix scan
  await threads().setJSON(`p:${parentId}:${id}`, { id });
  await threads().setJSON(`s:${staffId}:${id}`, { id });
  return { thread: th };
}

export async function listMessages(threadId) {
  const { blobs } = await msgs().list({ prefix: `m:${threadId}:` });
  const out = [];
  for (const b of blobs) { const v = await msgs().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out.sort((a, b) => a.at - b.at);
}

export async function addMessage(threadId, senderId, body, senderIsParent) {
  if (!body) return { error: "Write a message." };
  const th = await getThread(threadId);
  if (!th) return { error: "That conversation wasn't found." };
  const id = crypto.randomUUID();
  const msg = { id, threadId, from: senderId, body: String(body).trim(), at: Date.now() };
  await msgs().setJSON(`m:${threadId}:${id}`, msg);
  const updated = { ...th, unreadParent: !senderIsParent, unreadStaff: senderIsParent };
  await threads().setJSON(`t:${threadId}`, updated);
  return { message: msg, thread: updated };
}

export async function markRead(threadId, asParent) {
  const th = await getThread(threadId);
  if (!th) return { error: "Not found." };
  const updated = { ...th, unreadParent: asParent ? false : th.unreadParent, unreadStaff: asParent ? th.unreadStaff : false };
  await threads().setJSON(`t:${threadId}`, updated);
  return { thread: updated };
}
