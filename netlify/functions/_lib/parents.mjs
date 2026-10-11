import crypto from "node:crypto";
import { promisify } from "node:util";
import { getNamedStore } from "./store.mjs";
import { hex, normEmail, EMAIL, passwordProblem } from "./auth.mjs";
import { emailConfigured } from "./email.mjs";

const scrypt = promisify(crypto.scrypt);
const store = () => getNamedStore("parents");
const getAccount = (id) => store().get(`a:${id}`, { type: "json" }).catch(() => null);
const putAccount = (a) => store().setJSON(`a:${a.id}`, a);
const DUMMY_SALT = crypto.randomBytes(16);
const TOKEN_TTL_MS = 60 * 60 * 1000; // 60 minutes

/** Create a new parent account. If email sending is configured, the account starts
    unverified and { needsVerification, token } is returned for the caller to email —
    otherwise it's auto-verified immediately, so the site still works with zero setup. */
export async function registerParent({ name, email, phone, whatsapp, password }) {
  const e = normEmail(email);
  if (!name || String(name).trim().length < 2) return { error: "Enter your full name.", field: "name" };
  if (!EMAIL.test(e)) return { error: "Enter a valid email address.", field: "email" };
  if (!whatsapp || !String(whatsapp).trim()) return { error: "Enter a WhatsApp number.", field: "whatsapp" };
  const existing = await store().get(`e:${hex(e)}`, { type: "json" }).catch(() => null);
  if (existing) return { error: "An account with this email already exists. Sign in instead, or reset your password.", field: "email" };
  const problem = passwordProblem(password);
  if (problem) return { error: problem, field: "password" };

  const id = crypto.randomUUID();
  const salt = crypto.randomBytes(16);
  const hash = (await scrypt(String(password), salt, 64)).toString("hex");
  const willVerify = emailConfigured();
  const account = { id, role: "parent", name: String(name).trim(), email: e, phone: phone || "", whatsapp: String(whatsapp).trim(), salt: salt.toString("hex"), hash, epoch: 1, createdAt: Date.now(), verified: !willVerify };
  await putAccount(account);
  await store().setJSON(`e:${hex(e)}`, id);
  if (!willVerify) return { account };
  const token = await createVerificationToken(id);
  return { account, needsVerification: true, token };
}

/** Check email + password. Always does the same work, so timing can't reveal which emails exist. */
export async function verifyParentLogin(email, password) {
  const id = await store().get(`e:${hex(normEmail(email))}`, { type: "json" }).catch(() => null);
  const a = id ? await getAccount(id) : null;
  const salt = a?.salt ? Buffer.from(a.salt, "hex") : DUMMY_SALT;
  const given = await scrypt(String(password ?? ""), salt, 64);
  if (!a?.hash || !crypto.timingSafeEqual(given, Buffer.from(a.hash, "hex"))) return null;
  return a;
}

export async function getParent(id) { return getAccount(id); }
export async function getParentByEmail(email) {
  const id = await store().get(`e:${hex(normEmail(email))}`, { type: "json" }).catch(() => null);
  return id ? getAccount(id) : null;
}

/** Admin-only: every parent account, without password fields. */
export async function listAllParents() {
  const { blobs } = await store().list({ prefix: "a:" });
  const out = [];
  for (const b of blobs) {
    const v = await store().get(b.key, { type: "json" }).catch(() => null);
    if (v) out.push({ id: v.id, name: v.name, email: v.email, phone: v.phone, whatsapp: v.whatsapp || "", createdAt: v.createdAt, verified: v.verified });
  }
  return out;
}

export async function changeParentPassword(id, current, next) {
  const a = await getAccount(id);
  if (!a) return { error: "Sign in again first." };
  const given = await scrypt(String(current ?? ""), Buffer.from(a.salt, "hex"), 64);
  if (!crypto.timingSafeEqual(given, Buffer.from(a.hash, "hex"))) return { error: "Your current password isn't right." };
  const problem = passwordProblem(next);
  if (problem) return { error: problem };
  const salt = crypto.randomBytes(16);
  const updated = { ...a, salt: salt.toString("hex"), hash: (await scrypt(String(next), salt, 64)).toString("hex"), epoch: a.epoch + 1 };
  await putAccount(updated);
  return { account: updated };
}

export async function updateParentProfile(id, { name, phone, whatsapp }) {
  const a = await getAccount(id);
  if (!a) return { error: "Sign in again first." };
  const updated = { ...a, name: name ? String(name).trim() : a.name, phone: phone ?? a.phone, whatsapp: whatsapp ?? a.whatsapp };
  await putAccount(updated);
  return { account: updated };
}

// ---------------------------------------------------------------------------
// Email verification and password reset tokens. Both are single-use, expire
// after an hour, and are looked up directly by the (cryptographically random,
// 32-byte) token value — there's no need to hash these the way passwords are,
// since they're short-lived, single-use, and unguessable.
// ---------------------------------------------------------------------------
const tokenStore = () => getNamedStore("auth");
const newToken = () => crypto.randomBytes(32).toString("base64url");

export async function createVerificationToken(parentId) {
  const token = newToken();
  await tokenStore().setJSON(`vtok:${token}`, { parentId, expires: Date.now() + TOKEN_TTL_MS });
  return token;
}
export async function consumeVerificationToken(token) {
  const rec = await tokenStore().get(`vtok:${token}`, { type: "json" }).catch(() => null);
  if (!rec || rec.expires < Date.now()) return { error: "That verification link has expired. Request a new one." };
  await tokenStore().delete(`vtok:${token}`);
  const account = await getAccount(rec.parentId);
  if (!account) return { error: "That account no longer exists." };
  const updated = { ...account, verified: true };
  await putAccount(updated);
  return { account: updated };
}

export async function createResetToken(email) {
  const account = await getParentByEmail(email);
  if (!account) return { account: null }; // caller sends no email but still reports success, for privacy
  const token = newToken();
  await tokenStore().setJSON(`rtok:${token}`, { parentId: account.id, expires: Date.now() + TOKEN_TTL_MS });
  return { account, token };
}
export async function consumeResetToken(token, newPassword) {
  const rec = await tokenStore().get(`rtok:${token}`, { type: "json" }).catch(() => null);
  if (!rec || rec.expires < Date.now()) return { error: "That reset link has expired. Request a new one." };
  const problem = passwordProblem(newPassword);
  if (problem) return { error: problem };
  const account = await getAccount(rec.parentId);
  if (!account) return { error: "That account no longer exists." };
  await tokenStore().delete(`rtok:${token}`);
  const salt = crypto.randomBytes(16);
  const updated = { ...account, salt: salt.toString("hex"), hash: (await scrypt(String(newPassword), salt, 64)).toString("hex"), epoch: account.epoch + 1, verified: true };
  await putAccount(updated);
  return { account: updated };
}
