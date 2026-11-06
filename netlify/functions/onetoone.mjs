import { readToken } from "./_lib/auth.mjs";
import { listO2O, getO2O, createO2O, updateO2O } from "./_lib/onetoone.mjs";
import { listChildren } from "./_lib/children.mjs";
import { json, err } from "./_lib/http.mjs";

// One-to-one tuition requests: the parent ticks every weekly slot they could do
// (Mon-Fri + Sun, 5pm-10pm); admin then arranges a time that suits and marks it.
export default async (req) => {
  const payload = readToken(req);
  if (!payload) return err(401, "Sign in first.");

  if (req.method === "GET") {
    const all = await listO2O();
    if (payload.role === "admin") return json({ requests: all });
    if (payload.role !== "parent") return err(403, "Not available for this account type.");
    return json({ requests: all.filter((r) => r.parentId === payload.id) });
  }

  let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }

  if (req.method === "POST") {
    if (payload.role !== "parent") return err(403, "Only a parent account can request one-to-one lessons.");
    const child = (await listChildren(payload.id)).find((c) => c.id === body.childId);
    if (!child) return err(403, "That child does not belong to your account.");
    const { request, error } = await createO2O({ child, subject: body.subject, board: body.board, slots: body.slots, level: body.level });
    if (error) return err(400, error);
    return json({ request });
  }

  if (req.method === "PATCH") {
    const existing = body.id ? await getO2O(body.id) : null;
    if (!existing) return err(404, "That request wasn't found.");
    if (payload.role === "parent") {
      if (existing.parentId !== payload.id) return err(403, "That request does not belong to your account.");
      if (body.status !== "Withdrawn") return err(403, "You can only cancel your own request.");
      const { request, error } = await updateO2O(existing.id, { status: "Withdrawn" });
      if (error) return err(400, error);
      return json({ request });
    }
    if (payload.role !== "admin") return err(403, "Only admin can manage requests.");
    const { request, error } = await updateO2O(existing.id, { status: body.status, note: body.note });
    if (error) return err(400, error);
    return json({ request });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/onetoone" };
