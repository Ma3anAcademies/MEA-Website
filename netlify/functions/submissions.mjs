import { readToken } from "./_lib/auth.mjs";
import { getClass } from "./_lib/classes.mjs";
import { getHomework, listSubmissionsForHomework, listSubmissionsForChild, submitHomework, markSubmission } from "./_lib/homework.mjs";
import { listChildren } from "./_lib/children.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req) => {
  const payload = readToken(req);
  if (!payload) return err(401, "Sign in first.");
  const url = new URL(req.url);

  if (req.method === "GET") {
    if (payload.role === "parent") {
      // A parent's own children's submissions (for showing status/feedback in the app).
      const kids = await listChildren(payload.id);
      const all = [];
      for (const k of kids) all.push(...(await listSubmissionsForChild(k.id)));
      return json({ submissions: all });
    }
    // Teacher/admin: submissions for one piece of homework (needs classId to check ownership + homeworkId).
    const classId = url.searchParams.get("classId"), homeworkId = url.searchParams.get("homeworkId");
    if (!classId || !homeworkId) return err(400, "Missing classId or homeworkId.");
    if (payload.role === "teacher") {
      const cls = await getClass(classId);
      if (!cls || cls.teacherId !== payload.id) return err(403, "That is not your class.");
    } else if (payload.role !== "admin") return err(403, "Not available for this account type.");
    const submissions = await listSubmissionsForHomework(homeworkId);
    return json({ submissions });
  }

  if (req.method === "POST") {
    if (payload.role !== "parent") return err(403, "Only a parent can submit homework.");
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    const mine = new Set((await listChildren(payload.id)).map((c) => c.id));
    if (!body.childId || !mine.has(body.childId)) return err(403, "That child does not belong to your account.");
    if (!body.homeworkId) return err(400, "Missing homework id.");
    const { submission, error } = await submitHomework(body.homeworkId, body.childId, body.fileName, body.fileUrl);
    if (error) return err(400, error);
    return json({ submission });
  }

  if (req.method === "PATCH") {
    if (payload.role !== "teacher" && payload.role !== "admin") return err(403, "Only a teacher or admin can mark homework.");
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    const { homeworkId, childId, classId, score, feedback } = body || {};
    if (!homeworkId || !childId || !classId) return err(400, "Missing homework, child or class id.");
    if (payload.role === "teacher") {
      const cls = await getClass(classId);
      if (!cls || cls.teacherId !== payload.id) return err(403, "That is not your class.");
    }
    if (typeof score !== "number" || score < 0 || score > 10) return err(400, "Enter a score from 0 to 10.");
    const hw = await getHomework(classId, homeworkId);
    if (!hw) return err(404, "That homework wasn't found.");
    const { submission, error } = await markSubmission(homeworkId, childId, score, feedback);
    if (error) return err(404, error);
    return json({ submission });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/submissions" };
