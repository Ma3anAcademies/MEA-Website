import { readToken } from "./_lib/auth.mjs";
import { getPricing, savePricing } from "./_lib/pricing-settings.mjs";
import { json, err } from "./_lib/http.mjs";

// Prices are only shown to signed-in users, so reading needs a session too.
export default async (req) => {
  const payload = readToken(req);
  if (!payload) return err(401, "Sign in first.");
  if (req.method === "GET") return json({ pricing: await getPricing() });
  if (req.method === "POST") {
    if (payload.role !== "admin") return err(403, "Only admin can change prices.");
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    return json({ pricing: await savePricing(body || {}) });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/pricing" };
