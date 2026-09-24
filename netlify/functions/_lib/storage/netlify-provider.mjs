import crypto from "node:crypto";
import { getNamedStore } from "../store.mjs";

const store = () => getNamedStore("files");

export const configured = () => true; // always available, nothing to set up

export async function upload({ filename, mime, buffer }) {
  const id = crypto.randomUUID();
  await store().setBinary(id, buffer, { filename, mime });
  return { ok: true, ref: id, url: `/api/file?id=${id}` };
}

export async function read(id) { return store().getBinary(id); }
