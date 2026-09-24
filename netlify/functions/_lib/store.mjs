/**
 * Storage layer. On Netlify this is Netlify Blobs — built in, automatically
 * available to every Netlify Function, no database and no third-party
 * account to set up. For local testing (npm run preview, or automated
 * tests) set USE_MEMORY_STORE=1 to use a throwaway in-memory store instead,
 * so this file never needs the real @netlify/blobs package installed to
 * run its logic locally. On an actual Netlify deploy, USE_MEMORY_STORE is
 * never set, so the real package (installed from package.json) is used.
 */
function memoryStore(name) {
  const all = (globalThis.__memStores ??= new Map());
  if (!all.has(name)) all.set(name, new Map());
  const data = all.get(name);
  return {
    async setJSON(key, value) { data.set(key, JSON.stringify(value)); },
    async get(key, opts) {
      const v = data.get(key);
      if (v === undefined) return null;
      return opts?.type === "json" ? JSON.parse(v) : v;
    },
    async list({ prefix = "" } = {}) {
      const blobs = [...data.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key }));
      return { blobs, directories: [] };
    },
    async delete(key) { data.delete(key); },
    // Binary data (file bytes) plus its metadata, stored as two related keys —
    // simpler and more portable across Blobs SDK versions than relying on a
    // combined get-with-metadata call.
    async setBinary(key, buffer, metadata) { data.set(key, buffer); data.set(`${key}:meta`, JSON.stringify(metadata || {})); },
    async getBinary(key) {
      const buf = data.get(key); if (buf === undefined) return null;
      const meta = data.get(`${key}:meta`);
      return { data: buf, metadata: meta ? JSON.parse(meta) : {} };
    },
  };
}

// The real package is only ever imported when actually needed (i.e. really
// running on Netlify), so local tests never require it to be installed.
let blobsMod = null;
const loadBlobs = () => (blobsMod ??= import("@netlify/blobs"));
function realStore(name) {
  const client = async () => { const { getStore } = await loadBlobs(); return getStore({ name, consistency: "strong" }); };
  return {
    async setJSON(key, value) { return (await client()).setJSON(key, value); },
    async get(key, opts) { return (await client()).get(key, opts); },
    async list(opts) { return (await client()).list(opts); },
    async delete(key) { return (await client()).delete(key); },
    async setBinary(key, buffer, metadata) {
      const c = await client();
      await c.set(key, buffer);
      await c.setJSON(`${key}:meta`, metadata || {});
    },
    async getBinary(key) {
      const c = await client();
      const data = await c.get(key, { type: "arrayBuffer" });
      if (data === null) return null;
      const metadata = (await c.get(`${key}:meta`, { type: "json" })) || {};
      return { data: Buffer.from(data), metadata };
    },
  };
}

export function getNamedStore(name) {
  return process.env.USE_MEMORY_STORE === "1" ? memoryStore(name) : realStore(name);
}
