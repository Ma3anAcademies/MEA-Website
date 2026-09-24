import crypto from "node:crypto";

// A Google Drive "service account" is Google's mechanism for server-to-server
// access with no person's OAuth consent screen involved: it's its own robot
// account with its own email address, and it can only see files/folders you've
// explicitly shared with that email — exactly one folder, in this setup.

export const configured = (creds) => Boolean(creds?.clientEmail && creds?.privateKey && creds?.folderId);

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken(creds) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({ iss: creds.clientEmail, scope: "https://www.googleapis.com/auth/drive.file", aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now }));
  const unsigned = `${header}.${claims}`;
  let jwt;
  try {
    const key = creds.privateKey.includes("\\n") ? creds.privateKey.replace(/\\n/g, "\n") : creds.privateKey;
    const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), key);
    jwt = `${unsigned}.${base64url(signature).replace(/=+$/, "")}`;
  } catch {
    return { error: "That private key doesn't look valid. Check you copied the whole thing, including the BEGIN/END lines." };
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error_description || "Could not authenticate with Google Drive." };
  return { token: data.access_token };
}

export async function upload({ filename, mime, buffer, creds }) {
  const { token, error } = await getAccessToken(creds);
  if (error) return { ok: false, error };

  const created = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: filename, parents: [creds.folderId] }),
  });
  const file = await created.json().catch(() => ({}));
  if (!created.ok) return { ok: false, error: file.error?.message || "Could not create the file in Drive." };

  const uploaded = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=media`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": mime || "application/octet-stream" },
    body: buffer,
  });
  if (!uploaded.ok) return { ok: false, error: "Could not upload the file content to Drive." };

  await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  const meta = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?fields=webViewLink`, { headers: { Authorization: `Bearer ${token}` } });
  const metaData = await meta.json().catch(() => ({}));
  return { ok: true, ref: file.id, url: metaData.webViewLink || `https://drive.google.com/file/d/${file.id}/view` };
}
