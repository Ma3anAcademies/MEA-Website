import { readToken } from "./_lib/auth.mjs";
import { getSettings, getSettingsForAdmin, saveProviderCredentials, setActiveProvider } from "./_lib/storage-settings.mjs";
import * as gdrive from "./_lib/storage/gdrive-provider.mjs";
import * as onedrive from "./_lib/storage/onedrive-provider.mjs";
import * as github from "./_lib/storage/github-provider.mjs";
import { json, err } from "./_lib/http.mjs";

const TESTERS = { gdrive, onedrive, github };

export default async (req) => {
  const payload = readToken(req);
  if (!payload || payload.role !== "admin") return err(401, "Admin sign-in required.");

  if (req.method === "GET") return json(await getSettingsForAdmin());

  if (req.method === "POST") {
    let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }

    if (body.setActive) {
      const r = await setActiveProvider(body.setActive);
      if (r.error) return err(400, r.error);
      return json({ ok: true });
    }

    if (body.provider && body.fields) {
      const r = await saveProviderCredentials(body.provider, body.fields);
      if (r.error) return err(400, r.error);
      return json({ ok: true });
    }

    if (body.testProvider) {
      const impl = TESTERS[body.testProvider];
      if (!impl) return err(400, "That provider doesn't need a connection test.");
      const settings = await getSettings();
      const realCreds = settings.credentials[body.testProvider] || {};
      if (!impl.configured(realCreds)) return err(400, "That provider isn't fully filled in yet — fill in every field first.");
      const testBuffer = Buffer.from("MEA connection test file — safe to delete.", "utf8");
      const result = await impl.upload({ filename: "mea-connection-test.txt", mime: "text/plain", buffer: testBuffer, creds: realCreds });
      if (!result.ok) return err(400, result.error);
      return json({ ok: true, url: result.url });
    }

    return err(400, "Nothing to do.");
  }
  return err(405, "Method not allowed.");
};

export const config = { path: "/api/storage-settings" };
