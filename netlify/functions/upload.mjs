import { readToken } from "./_lib/auth.mjs";
import { uploadFile } from "./_lib/storage.mjs";
import { clientIp, allowAction, tooMany } from "./_lib/ratelimit.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return err(405, "Method not allowed.");
  const payload = readToken(req);
  if (!payload) return err(401, "Sign in first.");

  const ip = clientIp(req, context);
  const allowed = await allowAction("upload", ip, { max: 30, windowMs: 60 * 60 * 1000 });
  if (!allowed) return err(429, tooMany(60));

  let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
  const result = await uploadFile(body);
  if (!result.ok) return err(400, result.error);
  return json(result);
};

export const config = { path: "/api/upload" };
