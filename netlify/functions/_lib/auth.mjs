import crypto from "node:crypto";
import { promisify } from "node:util";
import { getNamedStore } from "./store.mjs";

const scrypt = promisify(crypto.scrypt);
export const COOKIE = "mea_session";
const ADMIN_CRED_KEY = "admin-credentials";
export const SESSION_SECONDS = 14 * 24 * 60 * 60; // 14 days
export const MIN_PASSWORD = 8;

const secret = () => {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 16 ? s : null;
};
export const sessionSecretSet = () => Boolean(secret());
export const adminConfigured = () => Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && secret());

export const sha256 = (s) => crypto.createHash("sha256").update(String(s)).digest();
const same = (a, b) => crypto.timingSafeEqual(sha256(a ?? ""), sha256(b ?? ""));
export const hex = (s) => sha256(s).toString("hex");

export function passwordProblem(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters, including a number.`;
  if (password.length > 200) return "That password is too long.";
  if (!/[0-9]/.test(password)) return `Use at least ${MIN_PASSWORD} characters, including a number.`;
  return null;
}
export const EMAIL = /^[^\s@<>"',;]{1,64}@[^\s@<>"',;]{1,190}\.[A-Za-z]{2,}$/;
export const normEmail = (e) => String(e ?? "").trim().toLowerCase();

// ---------------------------------------------------------------------------
// Admin credentials: ADMIN_USERNAME / ADMIN_PASSWORD (set in Netlify's own
// Environment Variables) are the initial login and the emergency reset. Once
// changed from the admin panel, the new (scrypt-hashed) credentials are
// stored and used instead — until the env vars themselves change, which
// always wins (so you can always regain access by resetting the env vars).
// ---------------------------------------------------------------------------
const envFingerprint = () => sha256(`${process.env.ADMIN_USERNAME}\n${process.env.ADMIN_PASSWORD}`).toString("hex");

export async function currentAdminCredentials() {
  let rec = null;
  try { rec = await getNamedStore("auth").get(ADMIN_CRED_KEY, { type: "json" }); } catch { /* no override yet */ }
  if (rec && rec.envFp === envFingerprint()) {
    return { source: "panel", username: rec.username, salt: rec.salt, hash: rec.hash, version: rec.hash.slice(0, 16) };
  }
  return { source: "deploy", username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD, version: `env-${envFingerprint().slice(0, 16)}` };
}

export async function verifyAdminLogin(username, password) {
  const c = await currentAdminCredentials();
  const okUser = same(username, c.username);
  let okPass;
  if (c.source === "panel") {
    const given = await scrypt(String(password ?? ""), Buffer.from(c.salt, "hex"), 64);
    okPass = crypto.timingSafeEqual(given, Buffer.from(c.hash, "hex"));
  } else okPass = same(password, c.password);
  return okUser && okPass ? c : null;
}

export async function saveAdminCredentials({ username, password }) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  await getNamedStore("auth").setJSON(ADMIN_CRED_KEY, { username: username.trim(), salt: salt.toString("hex"), hash: hash.toString("hex"), envFp: envFingerprint(), updatedAt: Date.now() });
  return currentAdminCredentials();
}

// ---------------------------------------------------------------------------
// Sessions: a signed, expiring token in an HttpOnly cookie. Works the same
// for parents and admin — the payload just carries a different role.
// ---------------------------------------------------------------------------
export function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}
export function verifyToken(token) {
  if (!secret() || typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}
export function sessionCookie(req, token, maxAge) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}
export function clearCookie(req) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}
export function readToken(req) {
  const raw = req.headers.get("cookie") || "";
  const hit = raw.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  return hit ? verifyToken(hit.slice(COOKIE.length + 1)) : null;
}
