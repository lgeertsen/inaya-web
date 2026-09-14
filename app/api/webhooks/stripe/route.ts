import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const frequency = session.metadata?.frequency === "monthly" ? "monthly" : "one_time";
    const animalId = session.metadata?.animalId || null;

    await supabase.from("donations").upsert(
      {
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        stripe_subscription_id:
          typeof session.subscription === "string" ? session.subscription : null,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "eur",
        frequency,
        status: "completed",
        donor_name: session.customer_details?.name ?? null,
        donor_email: session.customer_details?.email ?? null,
        animal_id: animalId,
      },
      { onConflict: "stripe_session_id" },
    );
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    };
    const rawSubscription =
      invoice.parent?.subscription_details?.subscription ?? invoice.subscription;
    const subscriptionId = typeof rawSubscription === "string" ? rawSubscription : null;

    if (subscriptionId) {
      await supabase
        .from("donations")
        .update({ status: "completed" })
        .eq("stripe_subscription_id", subscriptionId);
    }
  }

  return NextResponse.json({ received: true });
}
