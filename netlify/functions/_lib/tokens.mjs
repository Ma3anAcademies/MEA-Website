import crypto from "node:crypto";
import { getNamedStore } from "./store.mjs";

const store = () => getNamedStore("tokens");

/** A short-lived, single-use token for email verification or password reset. */
export async function createToken(type, accountId, ttlMinutes = 60) {
  const token = crypto.randomBytes(24).toString("base64url");
  await store().setJSON(`tok:${token}`, { type, accountId, expires: Date.now() + ttlMinutes * 60000 });
  return token;
}

/** Looks up a token, and — if valid — deletes it immediately (single use). */
export async function consumeToken(type, token) {
  if (!token) return null;
  const rec = await store().get(`tok:${token}`, { type: "json" }).catch(() => null);
  if (!rec || rec.type !== type || rec.expires < Date.now()) return null;
  await store().delete(`tok:${token}`);
  return rec.accountId;
}
