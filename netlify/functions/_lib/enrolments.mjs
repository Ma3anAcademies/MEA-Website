import crypto from "node:crypto";
import { getNamedStore } from "./store.mjs";
import { getClass } from "./classes.mjs";

const store = () => getNamedStore("enrolments");
const OCCUPY = new Set(["Active", "Pending Confirmation"]);

export async function listEnrolments() {
  const { blobs } = await store().list({ prefix: "en:" });
  const out = [];
  for (const b of blobs) { const v = await store().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out;
}
export async function getEnrolment(id) { return store().get(`en:${id}`, { type: "json" }).catch(() => null); }

/** Decides Pending Confirmation vs Waitlisted from the real, current seat count — never trusts the client for this.
    billingPeriod ("month" or "term") is the family's choice of how they'll be charged — fees are per
    lesson, and this decides how many lessons each invoice covers. Defaults to "month". */
export async function requestEnrolment(childId, classId, billingPeriod) {
  const cls = await getClass(classId);
  if (!cls) return { error: "That class could not be found." };
  if (!cls.enrolOpen || cls.status !== "Running") return { error: "Enrolment is closed for this class." };
  const all = await listEnrolments();
  if (all.some((e) => e.childId === childId && e.classId === classId && ["Active", "Pending Confirmation", "Waitlisted"].includes(e.status)))
    return { error: "There is already a request for this child in this class." };
  const filled = all.filter((e) => e.classId === classId && OCCUPY.has(e.status)).length;
  const status = filled < cls.capacity ? "Pending Confirmation" : "Waitlisted";
  const id = crypto.randomUUID();
  const rec = { id, childId, classId, status, billingPeriod: billingPeriod === "term" ? "term" : "month", created: Date.now() };
  await store().setJSON(`en:${id}`, rec);
  return { enrolment: rec };
}

/** Admin-only: directly places a child into a class as Active, bypassing the
    parent-request/pending-confirmation workflow — used from Admin → Teachers
    to add a student straight into one of a teacher's classes. Still respects
    capacity so a class can never be oversubscribed by this path either. */
export async function adminEnrol(childId, classId, billingPeriod) {
  const cls = await getClass(classId);
  if (!cls) return { error: "That class could not be found." };
  const all = await listEnrolments();
  if (all.some((e) => e.childId === childId && e.classId === classId && ["Active", "Pending Confirmation", "Waitlisted"].includes(e.status)))
    return { error: "This child already has a request or place in this class." };
  const filled = all.filter((e) => e.classId === classId && OCCUPY.has(e.status)).length;
  if (filled >= cls.capacity) return { error: "This class is full. Increase its capacity first, or choose another class." };
  const id = crypto.randomUUID();
  const rec = { id, childId, classId, status: "Active", billingPeriod: billingPeriod === "term" ? "term" : "month", created: Date.now() };
  await store().setJSON(`en:${id}`, rec);
  return { enrolment: rec };
}

export async function setEnrolmentStatus(id, status) {
  const existing = await getEnrolment(id);
  if (!existing) return { error: "That enrolment wasn't found." };
  if (status === "Active") {
    const cls = await getClass(existing.classId);
    if (cls) {
      const all = await listEnrolments();
      const filled = all.filter((e) => e.id !== id && e.classId === existing.classId && OCCUPY.has(e.status)).length;
      if (filled >= cls.capacity) return { error: "This class is already full. Increase its capacity first, or move this request to another class." };
    }
  }
  const updated = { ...existing, status };
  await store().setJSON(`en:${id}`, updated);
  return { enrolment: updated };
}
export async function setBillingPeriod(id, billingPeriod) {
  const existing = await getEnrolment(id);
  if (!existing) return { error: "That enrolment wasn't found." };
  const updated = { ...existing, billingPeriod: billingPeriod === "term" ? "term" : "month" };
  await store().setJSON(`en:${id}`, updated);
  return { enrolment: updated };
}
export async function moveEnrolment(id, classId) {
  const existing = await getEnrolment(id);
  if (!existing) return { error: "That enrolment wasn't found." };
  const updated = { ...existing, classId };
  await store().setJSON(`en:${id}`, updated);
  return { enrolment: updated };
}
