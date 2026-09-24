import { readToken } from "./_lib/auth.mjs";
import { listEnquiries, addEnquiry, setEnquiryStatus } from "./_lib/enquiries.mjs";
import { clientIp, allowAction, tooMany } from "./_lib/ratelimit.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req, context) => {
  if (req.method === "POST") {
    const ip = clientIp(req, context);
    const allowed = await allowAction("contact", ip, { max: 10, windowMs: 60 * 60 * 1000 });
    if (!allowed) return err(429, tooMany(60));
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    const { enquiry, error } = await addEnquiry(body);
    if (error) return err(400, error);
    return json({ enquiry });
  }

  // Reading or updating the enquiry list is for admin only (the Support Queue).
  const payload = readToken(req);
  if (!payload || payload.role !== "admin") return err(401, "Admin sign-in required.");

  if (req.method === "GET") {
    const enquiries = await listEnquiries();
    return json({ enquiries });
  }
  if (req.method === "PATCH") {
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    const { id, status } = body || {};
    if (!id || !status) return err(400, "Missing id or status.");
    const { enquiry, error } = await setEnquiryStatus(id, status);
    if (error) return err(404, error);
    return json({ enquiry });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/contact" };
