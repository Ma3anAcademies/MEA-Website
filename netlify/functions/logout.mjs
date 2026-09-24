import { clearCookie } from "./_lib/auth.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req) => {
  if (req.method !== "POST") return err(405, "Method not allowed.");
  return json({ ok: true }, 200, { "set-cookie": clearCookie(req) });
};

export const config = { path: "/api/logout" };
