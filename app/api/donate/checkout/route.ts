import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { donateCheckoutSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = donateCheckoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { amount, frequency, animalId, locale } = parsed.data;
  const origin = request.nextUrl.origin;
  const amountCents = Math.round(amount * 100);

  const priceData = {
    currency: "eur",
    product_data: { name: "Don — Association Inaya" },
    unit_amount: amountCents,
    ...(frequency === "monthly" ? { recurring: { interval: "month" as const } } : {}),
  };

  const session = await getStripe().checkout.sessions.create({
    mode: frequency === "monthly" ? "subscription" : "payment",
    line_items: [{ price_data: priceData, quantity: 1 }],
    success_url: `${origin}/${locale}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/${locale}/donate/cancel`,
    metadata: {
      frequency,
      ...(animalId ? { animalId } : {}),
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
