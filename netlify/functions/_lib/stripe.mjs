import crypto from "node:crypto";

// Calls Stripe's real REST API directly (form-encoded, as Stripe expects) rather
// than pulling in their SDK as a dependency - consistent with the rest of this
// project (Resend is called the same way). Every function here checks whether
// STRIPE_SECRET_KEY is set and returns a clear "not configured" result if not,
// so nothing here can break the site when payments haven't been set up yet.

export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
const KEY = () => process.env.STRIPE_SECRET_KEY;

function toForm(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (typeof v === "object" && !Array.isArray(v)) out.push(...toForm(v, key));
    else if (Array.isArray(v)) v.forEach((item, i) => out.push(...(typeof item === "object" ? toForm(item, `${key}[${i}]`) : [[`${key}[${i}]`, item]])));
    else out.push([key, v]);
  }
  return out;
}
async function stripeCall(path, params) {
  const body = new URLSearchParams(toForm(params));
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY()}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error?.message || `Stripe request failed (${res.status})` };
  return { data };
}

/** A hosted Stripe Checkout page for a single invoice. Card details never touch
    this site at all - Stripe handles the whole payment page. */
export async function createCheckoutSession({ invoiceId, amountPence, description, successUrl, cancelUrl, customerEmail }) {
  if (!stripeConfigured()) return { error: "Payments are not connected on this site yet." };
  const { data, error } = await stripeCall("checkout/sessions", {
    mode: "payment",
    "payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": "gbp",
    "line_items[0][price_data][product_data][name]": description,
    "line_items[0][price_data][unit_amount]": amountPence,
    "line_items[0][quantity]": 1,
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    "metadata[invoiceId]": invoiceId,
  });
  if (error) return { error };
  return { id: data.id, url: data.url };
}

/** Verifies a webhook really came from Stripe, using the same HMAC scheme Stripe
    itself documents - no SDK needed for this either. Rejects anything more than
    5 minutes old, which stops a captured request being replayed later. */
export function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return { error: "Missing signature." };
  const parts = Object.fromEntries(signatureHeader.split(",").map((p) => p.split("=")));
  const timestamp = parts.t, expectedSig = parts.v1;
  if (!timestamp || !expectedSig) return { error: "Malformed signature." };
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return { error: "Signature too old." };
  const signedPayload = `${timestamp}.${rawBody}`;
  const computed = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  const a = Buffer.from(computed), b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { error: "Signature mismatch." };
  try { return { event: JSON.parse(rawBody) }; } catch { return { error: "Invalid payload." }; }
}
