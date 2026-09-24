import crypto from "node:crypto";
import { getNamedStore } from "./store.mjs";

const store = () => getNamedStore("enquiries");

export async function listEnquiries() {
  const { blobs } = await store().list({ prefix: "q:" });
  const out = [];
  for (const b of blobs) { const v = await store().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function addEnquiry(data) {
  if (!data.name || !data.message) return { error: "Enter your name and a message." };
  const id = crypto.randomUUID();
  const enquiry = {
    id, ref: "MEA-" + Date.now().toString(36).toUpperCase(), createdAt: Date.now(),
    name: String(data.name).trim(), email: data.email || "", phone: data.phone || "", role: data.role || "",
    topic: data.topic || "", team: data.team || "", message: String(data.message).trim(),
    status: "New", portal: !!data.portal
  };
  await store().setJSON(`q:${id}`, enquiry);
  return { enquiry };
}

export async function setEnquiryStatus(id, status) {
  const existing = await store().get(`q:${id}`, { type: "json" }).catch(() => null);
  if (!existing) return { error: "That enquiry wasn't found." };
  const updated = { ...existing, status };
  await store().setJSON(`q:${id}`, updated);
  return { enquiry: updated };
}
