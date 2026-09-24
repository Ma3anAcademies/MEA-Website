// Local test harness only — not part of the deployed site. Serves public/
// as static files AND loads netlify/functions/*.mjs (Netlify Functions v2
// signature) on their /api/* paths, using the in-memory store. This mirrors
// what `netlify dev` does, without needing the Netlify CLI or the real
// @netlify/blobs package installed.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

process.env.USE_MEMORY_STORE = "1";
process.env.ADMIN_USERNAME ??= "admin";
process.env.ADMIN_PASSWORD ??= "adminpass123";
process.env.SESSION_SECRET ??= "test-secret-not-for-production-use-only";

// Intercepts only outbound calls to Resend's API (no real network access in this
// sandbox) so the real application code — token generation, email content, the
// whole flow — can still be exercised for real. Captured emails land in
// globalThis.__sentEmails for the test suite to read the verification/reset link
// out of, exactly as a person would from their inbox.
globalThis.__sentEmails = [];
globalThis.__stripeSessions = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  if (String(url).startsWith("https://api.resend.com/")) {
    const body = JSON.parse(opts.body);
    globalThis.__sentEmails.push(body);
    return new Response(JSON.stringify({ id: "test-" + Date.now() }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (String(url).startsWith("https://api.stripe.com/v1/checkout/sessions")) {
    const params = new URLSearchParams(opts.body);
    const id = "cs_test_" + Math.random().toString(36).slice(2);
    const session = { id, metadata: { invoiceId: params.get("metadata[invoiceId]") }, amount: params.get("line_items[0][price_data][unit_amount]") };
    globalThis.__stripeSessions.push(session);
    return new Response(JSON.stringify({ id, url: `https://checkout.stripe.com/test/${id}` }), { status: 200, headers: { "content-type": "application/json" } });
  }

  // --- Google Drive (service account) ---
  if (String(url) === "https://oauth2.googleapis.com/token") {
    const body = new URLSearchParams(opts.body);
    const jwt = body.get("assertion") || "";
    const claims = JSON.parse(Buffer.from(jwt.split(".")[1] || "e30=", "base64url").toString());
    if (claims.iss === "bad@example.com") return new Response(JSON.stringify({ error: "invalid_grant", error_description: "Invalid JWT signature." }), { status: 400, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify({ access_token: "fake-gdrive-token", expires_in: 3600 }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (String(url) === "https://www.googleapis.com/drive/v3/files") {
    const id = "gdrive_" + Math.random().toString(36).slice(2);
    globalThis.__driveUploads = globalThis.__driveUploads || [];
    globalThis.__driveUploads.push({ id, meta: JSON.parse(opts.body) });
    return new Response(JSON.stringify({ id }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (String(url).startsWith("https://www.googleapis.com/upload/drive/v3/files/")) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (String(url).includes("/drive/v3/files/") && String(url).endsWith("/permissions")) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (String(url).includes("/drive/v3/files/") && String(url).includes("fields=webViewLink")) {
    const id = String(url).split("/files/")[1].split("?")[0];
    return new Response(JSON.stringify({ webViewLink: `https://drive.google.com/file/d/${id}/view` }), { status: 200, headers: { "content-type": "application/json" } });
  }

  // --- OneDrive (Microsoft Graph, app registration) ---
  if (String(url).startsWith("https://login.microsoftonline.com/")) {
    const body = new URLSearchParams(opts.body);
    if (body.get("client_secret") === "wrong-secret") return new Response(JSON.stringify({ error: "invalid_client", error_description: "Invalid client secret." }), { status: 401, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify({ access_token: "fake-onedrive-token", expires_in: 3600 }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (String(url).includes("graph.microsoft.com") && String(url).endsWith(":/content")) {
    const id = "od_" + Math.random().toString(36).slice(2);
    return new Response(JSON.stringify({ id, webUrl: `https://onedrive.example.com/items/${id}` }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (String(url).includes("graph.microsoft.com") && String(url).endsWith("/createLink")) {
    return new Response(JSON.stringify({ link: { webUrl: "https://1drv.ms/fake-share-link" } }), { status: 200, headers: { "content-type": "application/json" } });
  }

  // --- GitHub (Contents API, personal access token) ---
  if (String(url).startsWith("https://api.github.com/repos/") && String(url).includes("/contents/")) {
    if (opts.headers.Authorization === "Bearer bad-token") return new Response(JSON.stringify({ message: "Bad credentials" }), { status: 401, headers: { "content-type": "application/json" } });
    const path = String(url).split("/contents/")[1];
    const owner = String(url).split("/repos/")[1].split("/")[0];
    const repo = String(url).split("/repos/")[1].split("/")[1];
    return new Response(JSON.stringify({ content: { download_url: `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}` } }), { status: 201, headers: { "content-type": "application/json" } });
  }
  return realFetch(url, opts);
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fnDir = path.join(root, "netlify/functions");
const pub = path.join(root, "public");
const PORT = Number(process.env.PORT || 8790);

const routes = new Map();
for (const f of fs.readdirSync(fnDir).filter((f) => f.endsWith(".mjs"))) {
  const mod = await import(pathToFileURL(path.join(fnDir, f)).href);
  if (mod.config?.path) routes.set(mod.config.path, mod.default);
}
console.log("Loaded functions:", [...routes.keys()].join(", "));

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".txt": "text/plain" };

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const handler = routes.get(url.pathname);
    if (handler) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const request = new Request(url, { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : body });
      try {
        const response = await handler(request, { ip: req.socket.remoteAddress });
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch (e) { console.error(e); res.writeHead(500).end(String(e)); }
      return;
    }
    if (url.pathname === "/__test/emails") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(globalThis.__sentEmails));
      return;
    }
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = path.join(pub, decodeURIComponent(pathname));
    if (!file.startsWith(pub) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end("not found"); return; }
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`Test server on http://localhost:${PORT}`));
