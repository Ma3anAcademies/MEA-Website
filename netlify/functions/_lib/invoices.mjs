import crypto from "node:crypto";
import { getNamedStore } from "./store.mjs";

const store = () => getNamedStore("invoices");
const key = (parentId, id) => `i:${parentId}:${id}`;

export async function listForParent(parentId) {
  const { blobs } = await store().list({ prefix: `i:${parentId}:` });
  const out = [];
  for (const b of blobs) { const v = await store().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
export async function listAll() {
  const { blobs } = await store().list({ prefix: "i:" });
  const out = [];
  for (const b of blobs) { const v = await store().get(b.key, { type: "json" }).catch(() => null); if (v) out.push(v); }
  return out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
export async function getInvoice(parentId, id) { return store().get(key(parentId, id), { type: "json" }).catch(() => null); }
/** Looked up by id alone (the webhook only knows the invoice id, not which parent folder it's filed under). */
export async function findInvoiceById(id) {
  const all = await listAll();
  return all.find((i) => i.id === id) || null;
}

export async function createInvoice({ parentId, period, dueDate, lines, discountPct }) {
  if (!parentId) return { error: "Missing parent." };
  if (!lines || !lines.length) return { error: "Add at least one line item." };
  const subtotal = lines.reduce((a, l) => a + Number(l.amount || 0), 0);
  const discount = discountPct ? Math.round(subtotal * discountPct) / 100 : 0;
  const id = "INV-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  const invoice = { id, parentId, period, issuedDate: new Date().toISOString().slice(0, 10), dueDate, lines, discountPct: discountPct || 0, subtotal, total: subtotal - discount, status: "Due", paidOn: null, createdAt: Date.now() };
  await store().setJSON(key(parentId, id), invoice);
  return { invoice };
}

export async function markPaid(parentId, id, { manual } = {}) {
  const inv = await getInvoice(parentId, id);
  if (!inv) return { error: "Invoice not found." };
  const updated = { ...inv, status: "Paid", paidOn: new Date().toISOString().slice(0, 10), paidManually: !!manual };
  await store().setJSON(key(parentId, id), updated);
  return { invoice: updated };
}
