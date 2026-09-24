import crypto from "node:crypto";

// Microsoft's equivalent of a service account: an Azure "app registration" with
// its own client ID/secret, given access to one specific drive - no individual
// person's OneDrive login is used or stored.

export const configured = (creds) => Boolean(creds?.tenantId && creds?.clientId && creds?.clientSecret && creds?.driveId);

async function getAccessToken(creds) {
  const res = await fetch(`https://login.microsoftonline.com/${creds.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: creds.clientId, client_secret: creds.clientSecret, scope: "https://graph.microsoft.com/.default" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error_description || "Could not authenticate with OneDrive." };
  return { token: data.access_token };
}

export async function upload({ filename, mime, buffer, creds }) {
  const { token, error } = await getAccessToken(creds);
  if (error) return { ok: false, error };

  const safeName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${filename}`;
  const folder = creds.folderId ? `items/${creds.folderId}:` : "root:";
  const uploaded = await fetch(`https://graph.microsoft.com/v1.0/drives/${creds.driveId}/${folder}/${encodeURIComponent(safeName)}:/content`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": mime || "application/octet-stream" },
    body: buffer,
  });
  const item = await uploaded.json().catch(() => ({}));
  if (!uploaded.ok) return { ok: false, error: item.error?.message || "Could not upload the file to OneDrive." };

  const linked = await fetch(`https://graph.microsoft.com/v1.0/drives/${creds.driveId}/items/${item.id}/createLink`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "view", scope: "anonymous" }),
  });
  const linkData = await linked.json().catch(() => ({}));
  return { ok: true, ref: item.id, url: linkData.link?.webUrl || item.webUrl };
}
