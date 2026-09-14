import Stripe from "stripe";

let stripeClient: Stripe | null = null;

// Lazily constructed so importing this module (e.g. during `next build`'s
// route analysis) never requires STRIPE_SECRET_KEY to be set — only calling
// a route handler that actually talks to Stripe does.
export function getStripe(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

