import crypto from "node:crypto";
import { getNamedStore } from "./store.mjs";

const store = () => getNamedStore("resources");

export async function listResourcesForClass(classId) {
  const { blobs } = await store().list({ prefix: `r:${classId}:` });
  const out = [];
  for (const b of blobs) { const v = await store().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function addResource(classId, { title, type, url, week }) {
  if (!title) return { error: "Enter a title." };
  if (!url || !/^https:\/\//i.test(url)) return { error: "Paste a full link starting with https://" };
  const id = crypto.randomUUID();
  const resource = { id, classId, title: String(title).trim(), type: type || "Lesson slides", url, week: week ? +week : 1, createdAt: Date.now() };
  await store().setJSON(`r:${classId}:${id}`, resource);
  return { resource };
}
