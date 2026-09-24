import { getNamedStore } from "./store.mjs";

const store = () => getNamedStore("attendance");
const key = (classId, date, childId) => `a:${classId}:${date}:${childId}`;

export async function listAttendanceForSession(classId, date) {
  const { blobs } = await store().list({ prefix: `a:${classId}:${date}:` });
  const out = [];
  for (const b of blobs) { const v = await store().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out;
}
export async function listAttendanceForChild(childId) {
  const { blobs } = await store().list({ prefix: "a:" });
  const out = [];
  for (const b of blobs) {
    if (!b.key.endsWith(`:${childId}`)) continue;
    const v = await store().get(b.key, { type: "json" }).catch(() => null);
    if (v) out.push(v);
  }
  return out;
}
export async function setAttendance(classId, date, childId, status) {
  if (!["Present", "Late", "Absent", "Excused"].includes(status)) return { error: "Invalid status." };
  const rec = { classId, date, childId, status, recordedAt: Date.now() };
  await store().setJSON(key(classId, date, childId), rec);
  return { attendance: rec };
}
