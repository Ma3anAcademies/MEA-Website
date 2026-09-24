import { readToken } from "./_lib/auth.mjs";
import { listThreadsFor, getThread, createThread, listMessages, addMessage, markRead } from "./_lib/messages.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req) => {
  const payload = readToken(req);
  if (!payload) return err(401, "Sign in first.");
  const url = new URL(req.url);
  const isParent = payload.role === "parent";

  if (req.method === "GET") {
    const threadId = url.searchParams.get("thread");
    if (threadId) {
      const th = await getThread(threadId);
      if (!th || (isParent ? th.parentId !== payload.id : th.staffId !== payload.id)) return err(403, "Not your conversation.");
      const messages = await listMessages(threadId);
      await markRead(threadId, isParent);
      return json({ thread: th, messages });
    }
    const threads = await Promise.all((await listThreadsFor(payload.id, isParent ? "parent" : "staff")).map((row) => getThread(row.id)));
    return json({ threads: threads.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt) });
  }

  if (req.method === "POST") {
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
    if (body.threadId) {
      // reply on an existing conversation
      const th = await getThread(body.threadId);
      if (!th || (isParent ? th.parentId !== payload.id : th.staffId !== payload.id)) return err(403, "Not your conversation.");
      const { message, error } = await addMessage(body.threadId, payload.id, body.message, isParent);
      if (error) return err(400, error);
      return json({ message });
    }
    if (!isParent) return err(403, "Only a parent can start a new conversation.");
    if (!body.staffId) return err(400, "Missing recipient.");
    const { thread, error } = await createThread(payload.id, body.staffId, body.subject, body.childId, body.classId);
    if (error) return err(400, error);
    const { error: msgErr } = await addMessage(thread.id, payload.id, body.message, true);
    if (msgErr) return err(400, msgErr);
    return json({ thread });
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/messages" };
