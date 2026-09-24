import crypto from "node:crypto";
import { getNamedStore } from "./store.mjs";

const store = () => getNamedStore("classes");

export async function listClasses() {
  const { blobs } = await store().list({ prefix: "cl:" });
  const out = [];
  for (const b of blobs) { const v = await store().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out;
}
export async function getClass(id) { return store().get(`cl:${id}`, { type: "json" }).catch(() => null); }

export async function createClass(data) {
  const id = data.id || crypto.randomUUID();
  const cls = {
    id, courseId: data.courseId, teacherId: data.teacherId || "",
    days: Array.isArray(data.days) ? data.days : [], term: data.term || "", startDate: data.startDate || "", endDate: data.endDate || "",
    capacity: +data.capacity || 8, meetingUrl: data.meetingUrl || "", feeOverride: data.feeOverride ?? null,
    enrolOpen: data.enrolOpen !== false, status: data.status || "Running"
  };
  await store().setJSON(`cl:${id}`, cls);
  return cls;
}
export async function updateClass(id, patch) {
  const existing = await getClass(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  await store().setJSON(`cl:${id}`, updated);
  return updated;
}
