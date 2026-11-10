// Cashfree web checkout — same order/verify endpoints as the mobile app.
// Backend returns { cashfree_order: { payment_session_id, order_id }, cashfree_env }.
import { load } from "@cashfreepayments/cashfree-js";
import { apiFetch, unwrap } from "./api";

let cfPromise = null;
function getCashfree(env) {
  const mode = String(env || "SANDBOX").toUpperCase() === "PRODUCTION" ? "production" : "sandbox";
  if (!cfPromise) cfPromise = load({ mode });
  return cfPromise;
}

// Opens the Cashfree modal checkout for an order payload and resolves when the
// modal closes (payment attempted or cancelled). Caller then verifies.
export async function openCheckout({ payment_session_id, env }) {
  const cashfree = await getCashfree(env);
  return cashfree.checkout({
    paymentSessionId: payment_session_id,
    redirectTarget: "_modal",
  });
}

// Poll a verify endpoint (app parity: 5 tries, 2s apart — webhook race).
export async function pollVerify(path, body, { tries = 5, delayMs = 2000 } = {}) {
  let lastErr = null;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await apiFetch(path, { method: "POST", body: JSON.stringify(body) });
      return unwrap(res);
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr || new Error("Payment verification failed");
}

// Full purchase runner: create order → modal checkout → verify.
// createOrder: () => Promise<{cashfree_order, cashfree_env, is_free?}>
export async function runPurchase({ createOrder, verifyPath }) {
  const orderData = await createOrder();
  if (!orderData) throw new Error("Could not create payment order");
  if (orderData.is_free) return { free: true };

  const cf = orderData.cashfree_order || orderData;
  const env = orderData.cashfree_env || orderData.env || "PRODUCTION";
  if (!cf?.payment_session_id) throw new Error("No payment session returned");

  await openCheckout({ payment_session_id: cf.payment_session_id, env });
  const verified = await pollVerify(verifyPath, { order_id: cf.order_id });
  return { verified, order_id: cf.order_id };
}

// Client-side price breakdown shown across the app: fee + 18% GST + 2% platform.
export function priceBreakdown(price) {
  const fee = Number(price) || 0;
  const gst = +(fee * 0.18).toFixed(2);
  const platform = +(fee * 0.02).toFixed(2);
  return { fee, gst, platform, total: +(fee + gst + platform).toFixed(2) };
}
