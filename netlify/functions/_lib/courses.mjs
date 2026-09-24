import crypto from "node:crypto";
import { getNamedStore } from "./store.mjs";

const store = () => getNamedStore("courses");
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function listCourses() {
  const { blobs } = await store().list({ prefix: "c:" });
  const out = [];
  for (const b of blobs) { const v = await store().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out;
}
export async function getCourse(id) { return store().get(`c:${id}`, { type: "json" }).catch(() => null); }

export async function createCourse(data) {
  const id = data.id || crypto.randomUUID();
  const course = {
    id, slug: data.slug || `${slugify(data.title)}-${id.slice(0, 6)}`, title: data.title,
    sys: data.sys, level: data.level, subject: data.subject, board: data.board || "", tier: data.tier || "",
    desc: data.desc || "", audience: data.audience || "", topics: Array.isArray(data.topics) ? data.topics : [],
    fee: +data.fee || 0, trial: !!data.trial, active: data.active !== false, needs: data.needs || ""
  };
  await store().setJSON(`c:${id}`, course);
  return course;
}
export async function updateCourse(id, patch) {
  const existing = await getCourse(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  await store().setJSON(`c:${id}`, updated);
  return updated;
}
