import crypto from "node:crypto";
import { getNamedStore } from "./store.mjs";

const store = () => getNamedStore("children");
const keyOf = (parentId, childId) => `${parentId}:${childId}`;

export async function listChildren(parentId) {
  const { blobs } = await store().list({ prefix: `${parentId}:` });
  const out = [];
  for (const b of blobs) { const v = await store().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out.sort((a, b) => a.createdAt - b.createdAt);
}

/** Admin-only: every child, across every family. */
export async function listAllChildren() {
  const { blobs } = await store().list({ prefix: "" });
  const out = [];
  for (const b of blobs) { const v = await store().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out;
}

/** A specific set of children by id, regardless of parent — used to give a teacher
    just the names of students actually enrolled in their own classes, nothing more. */
export async function listChildrenByIds(ids) {
  const idSet = new Set(ids);
  if (!idSet.size) return [];
  const all = await listAllChildren();
  return all.filter((c) => idSet.has(c.id));
}

export async function addChild(parentId, { first, last, sys, stage, dob, school }) {
  if (!first || !last) return { error: "Enter the child's first name and surname." };
  if (!sys || !stage) return { error: "Choose an education system and year." };
  const id = crypto.randomUUID();
  const child = { id, parentId, first: String(first).trim(), last: String(last).trim(), sys, stage, dob: dob || "", school: school || "", status: "Active", createdAt: Date.now() };
  await store().setJSON(keyOf(parentId, id), child);
  return { child };
}

export async function updateChild(parentId, childId, patch) {
  const existing = await store().get(keyOf(parentId, childId), { type: "json" }).catch(() => null);
  if (!existing) return { error: "That child record wasn't found." };
  const updated = { ...existing, ...patch };
  await store().setJSON(keyOf(parentId, childId), updated);
  return { child: updated };
}

export async function removeChild(parentId, childId) {
  await store().delete(keyOf(parentId, childId));
  return { ok: true };
}
