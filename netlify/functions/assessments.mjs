import { readToken } from "./_lib/auth.mjs";
import { getClass } from "./_lib/classes.mjs";
import { listAssessmentsForChild, addAssessment } from "./_lib/assessments.mjs";
import { listChildren } from "./_lib/children.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req) => {
  const payload = readToken(req);
  if (!payload) return err(401, "Sign in first.");
  const url = new URL(req.url);

  if (req.method === "GET") {
    if (payload.role === "parent") {
      const kids = await listChildren(payload.id);
      const all = [];
      for (const k of kids) all.push(...(await listAssessmentsForChild(k.id)));
      return json({ assessments: all });
    }
    const childId = url.searchParams.get("childId");
    if (!childId) return err(400, "Missing childId.");
    if (payload.role !== "teacher" && payload.role !== "admin") return err(403, "Not available for this account type.");
    const assessments = await listAssessmentsForChild(childId);
    return json({ assessments });
  }
  if (req.method === "POST") {
    if (payload.role !== "teacher" && payload.role !== "admin") return err(403, "Only a teacher or admin can record an assessment.");
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    if (!body.childId) return err(400, "Missing childId.");
    if (payload.role === "teacher" && body.classId) {
      const cls = await getClass(body.classId);
      if (!cls || cls.teacherId !== payload.id) return err(403, "That is not your class.");
    }
    const { assessment, error } = await addAssessment(body.childId, body);
    if (error) return err(400, error);
    return json({ assessment });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/assessments" };
