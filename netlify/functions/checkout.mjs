import { readToken } from "./_lib/auth.mjs";
import { getInvoice } from "./_lib/invoices.mjs";
import { getParent } from "./_lib/parents.mjs";
import { createCheckoutSession, stripeConfigured } from "./_lib/stripe.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req) => {
  if (req.method !== "POST") return err(405, "Method not allowed.");
  const payload = readToken(req);
  if (!payload || payload.role !== "parent") return err(401, "Sign in first.");
  if (!stripeConfigured()) return err(400, "Online payment isn't connected on this site yet.");

  let body; try { body = await req.json(); } catch { return err(400, "Invalid request."); }
  if (!body.invoiceId) return err(400, "Missing invoice id.");

  const invoice = await getInvoice(payload.id, body.invoiceId);
  if (!invoice) return err(404, "That invoice wasn't found on your account.");
  if (invoice.status === "Paid") return err(400, "This invoice is already paid.");

  const account = await getParent(payload.id);
  const origin = new URL(req.url).origin;
  const { url, error } = await createCheckoutSession({
    invoiceId: invoice.id,
    amountPence: Math.round(invoice.total * 100),
    description: `MEA invoice ${invoice.id} — ${invoice.period}`,
    successUrl: `${origin}/#/my-mea/payments/invoices/${invoice.id}?paid=1`,
    cancelUrl: `${origin}/#/my-mea/payments/invoices/${invoice.id}`,
    customerEmail: account?.email,
  });
  if (error) return err(400, error);
  return json({ url });
};

export const config = { path: "/api/checkout" };
