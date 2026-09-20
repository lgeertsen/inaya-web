import { NextRequest, NextResponse } from "next/server";
import { getPathname } from "@/i18n/navigation";
import { getStripe } from "@/lib/stripe";
import { colors } from "@/theme/tokens";
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

  // Stripe fetches the icon from this URL, so it only works on a publicly
  // reachable origin — skip it for localhost rather than break the session.
  const isPublicOrigin = origin.startsWith("https://") && !origin.includes("localhost");

  const session = await getStripe().checkout.sessions.create({
    mode: frequency === "monthly" ? "subscription" : "payment",
    locale,
    // Mirrors theme/tokens.ts (background, accent). Stripe only offers a fixed
    // font list, so Karla/Bricolage Grotesque can't be used — Lato is the closest.
    branding_settings: {
      display_name: "Association Inaya",
      background_color: colors.background,
      button_color: colors.accent,
      border_style: "rounded",
      font_family: "lato",
      ...(isPublicOrigin ? { icon: { type: "url" as const, url: `${origin}/logo.png` } } : {}),
    },
    line_items: [{ price_data: priceData, quantity: 1 }],
    success_url: `${origin}${getPathname({ href: "/donate/success", locale })}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${getPathname({ href: "/donate/cancel", locale })}`,
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
