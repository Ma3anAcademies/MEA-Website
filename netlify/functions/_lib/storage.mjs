import { getActiveProviderConfig, PROVIDER_FIELDS } from "./storage-settings.mjs";
import * as netlify from "./storage/netlify-provider.mjs";
import * as gdrive from "./storage/gdrive-provider.mjs";
import * as onedrive from "./storage/onedrive-provider.mjs";
import * as github from "./storage/github-provider.mjs";

const PROVIDERS = { netlify, gdrive, onedrive, github };
export const PROVIDER_NAMES = { netlify: "Netlify (built in)", gdrive: "Google Drive", onedrive: "OneDrive", github: "GitHub" };

const MAX_BYTES = 15 * 1024 * 1024; // 15MB — comfortably covers a photographed page or a PDF

export async function uploadFile({ filename, mime, base64 }) {
  if (!filename) return { ok: false, error: "Missing file name." };
  let buffer;
  try { buffer = Buffer.from(base64, "base64"); } catch { return { ok: false, error: "Invalid file data." }; }
  if (buffer.length === 0) return { ok: false, error: "That file appears to be empty." };
  if (buffer.length > MAX_BYTES) return { ok: false, error: "That file is too large (15MB limit)." };

  const { provider, credentials } = await getActiveProviderConfig();
  const impl = PROVIDERS[provider] || netlify;
  if (provider !== "netlify" && !impl.configured(credentials)) {
    return { ok: false, error: `${PROVIDER_NAMES[provider]} is selected as the file storage provider but isn't fully set up yet. Fill in its details in Admin → Setup & Integrations, or switch back to Netlify.` };
  }
  const result = await impl.upload({ filename, mime, buffer, creds: credentials });
  return { ...result, provider };
}
