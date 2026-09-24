import { read } from "./_lib/storage/netlify-provider.mjs";
import { err } from "./_lib/http.mjs";

export default async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return err(400, "Missing file id.");
  const file = await read(id);
  if (!file) return err(404, "File not found.");
  return new Response(file.data, {
    status: 200,
    headers: { "content-type": file.metadata?.mime || "application/octet-stream", "content-disposition": `inline; filename="${(file.metadata?.filename || "file").replace(/"/g, "")}"`, "cache-control": "private, max-age=3600" },
  });
};

export const config = { path: "/api/file" };
