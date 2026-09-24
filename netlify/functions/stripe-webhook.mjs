import { verifyWebhookSignature } from "./_lib/stripe.mjs";
import { findInvoiceById, markPaid } from "./_lib/invoices.mjs";
import { json, err } from "./_lib/http.mjs";

export default async (req) => {
  if (req.method !== "POST") return err(405, "Method not allowed.");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return err(400, "Webhook secret isn't configured.");

  const rawBody = await req.text();
  const { event, error } = verifyWebhookSignature(rawBody, req.headers.get("stripe-signature"), secret);
  if (error) return err(400, error);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoiceId;
    if (invoiceId) {
      const invoice = await findInvoiceById(invoiceId);
      if (invoice && invoice.status !== "Paid") await markPaid(invoice.parentId, invoice.id);
    }
  }
  // Always 200 for anything else recognised-but-unhandled, so Stripe doesn't keep retrying it.
  return json({ received: true });
};

export const config = { path: "/api/stripe-webhook" };
