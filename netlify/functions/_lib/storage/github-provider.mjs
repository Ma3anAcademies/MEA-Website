import crypto from "node:crypto";

// Included because it was asked for, but worth being direct about: a git
// repository is not really built for this job. Every upload becomes a
// permanent commit (the repo only ever grows, nothing is ever truly removed),
// there's no per-file access control, and — critically — files are only
// reachable at the returned URL if the repository is public. For family
// homework submissions, Netlify Blobs or Drive/OneDrive are a much better fit.
// This exists so you can compare it yourself rather than take that on faith.

export const configured = (creds) => Boolean(creds?.owner && creds?.repo && creds?.token);

export async function upload({ filename, mime, buffer, creds }) {
  const branch = creds.branch || "main";
  const folder = (creds.path || "uploads").replace(/^\/+|\/+$/g, "");
  const safeName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${filename}`;
  const filePath = `${folder}/${safeName}`;

  const res = await fetch(`https://api.github.com/repos/${creds.owner}/${creds.repo}/contents/${filePath}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${creds.token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: JSON.stringify({ message: `Add uploaded file: ${filename}`, content: buffer.toString("base64"), branch }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.message || "Could not upload the file to GitHub." };
  return { ok: true, ref: filePath, url: data.content?.download_url || `https://raw.githubusercontent.com/${creds.owner}/${creds.repo}/${branch}/${filePath}` };
}
