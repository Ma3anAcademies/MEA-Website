import { getNamedStore } from "./store.mjs";

const store = () => getNamedStore("settings");
const KEY = "file-storage";

const PROVIDERS = ["netlify", "gdrive", "onedrive", "github"];

/** Fields each provider needs, and which of those are secrets (never sent back
    to the browser once saved - the admin UI shows "•••• saved" instead). */
export const PROVIDER_FIELDS = {
  netlify: [],
  gdrive: [
    { key: "clientEmail", label: "Service account email", secret: false },
    { key: "privateKey", label: "Service account private key", secret: true },
    { key: "folderId", label: "Shared Drive folder ID", secret: false },
  ],
  onedrive: [
    { key: "tenantId", label: "Azure tenant ID", secret: false },
    { key: "clientId", label: "Application (client) ID", secret: false },
    { key: "clientSecret", label: "Client secret", secret: true },
    { key: "driveId", label: "Drive ID", secret: false },
    { key: "folderId", label: "Folder ID (optional — root if blank)", secret: false },
  ],
  github: [
    { key: "owner", label: "Repository owner", secret: false },
    { key: "repo", label: "Repository name", secret: false },
    { key: "branch", label: "Branch", secret: false },
    { key: "path", label: "Folder path in the repo", secret: false },
    { key: "token", label: "Personal access token", secret: true },
  ],
};

export async function getSettings() {
  const rec = await store().get(KEY, { type: "json" }).catch(() => null);
  return rec || { provider: "netlify", credentials: {} };
}

/** What the browser is allowed to see: the active provider, which providers have
    credentials saved, and non-secret field values (so the admin form can be
    pre-filled without ever re-sending a saved secret back down). */
export async function getSettingsForAdmin() {
  const s = await getSettings();
  const configured = {};
  const visible = {};
  for (const p of PROVIDERS) {
    const creds = s.credentials[p] || {};
    const fields = PROVIDER_FIELDS[p];
    configured[p] = p === "netlify" || fields.every((f) => !f.secret || creds[f.key]);
    visible[p] = {};
    for (const f of fields) visible[p][f.key] = f.secret ? (creds[f.key] ? "" : "") : creds[f.key] || "";
    for (const f of fields) if (f.secret) visible[p][f.key + "Saved"] = !!creds[f.key];
  }
  return { provider: s.provider, configured, credentials: visible };
}

export async function saveProviderCredentials(provider, fields) {
  if (!PROVIDERS.includes(provider)) return { error: "Unknown provider." };
  const s = await getSettings();
  const existing = s.credentials[provider] || {};
  const merged = { ...existing };
  for (const def of PROVIDER_FIELDS[provider]) {
    const incoming = fields[def.key];
    if (incoming !== undefined && incoming !== "") merged[def.key] = incoming; // blank = keep existing secret
  }
  s.credentials[provider] = merged;
  await store().setJSON(KEY, s);
  return { ok: true };
}

export async function setActiveProvider(provider) {
  if (!PROVIDERS.includes(provider)) return { error: "Unknown provider." };
  const s = await getSettings();
  s.provider = provider;
  await store().setJSON(KEY, s);
  return { ok: true };
}

export async function getActiveProviderConfig() {
  const s = await getSettings();
  return { provider: s.provider, credentials: s.credentials[s.provider] || {} };
}
