---
name: stripe-donation-testing
description: Use when testing or debugging the donation/checkout flow locally (Stripe Checkout sessions, the webhook at app/api/webhooks/stripe, or the donations table) — covers local webhook forwarding and the event/metadata contract this repo relies on.
---

# Stripe donation flow testing (inaya-web)

The donation flow is: `app/api/donate/checkout` creates a Stripe Checkout session ->
`app/api/webhooks/stripe/route.ts` handles the resulting webhook events and writes to the
`donations` table using `createAdminClient()` (service-role, bypasses RLS — this is the only
writer of that table).

## Local webhook forwarding

Stripe webhooks can't reach `localhost` directly, so forward them with the Stripe CLI while
`next dev` is running:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` signing secret it prints into `STRIPE_WEBHOOK_SECRET` in `.env.local` — the
webhook route calls `getStripe().webhooks.constructEvent(...)` with that secret and returns
`invalid_signature` if it doesn't match.

## Events the webhook actually handles

Only two event types are handled in `app/api/webhooks/stripe/route.ts` — anything else is a no-op
that still returns `{ received: true }`:

- **`checkout.session.completed`** — upserts a `donations` row keyed on `stripe_session_id`,
  reading `session.metadata.frequency` (`"monthly"` or defaults to `"one_time"`) and
  `session.metadata.animalId`. **The checkout session must set these metadata fields when it's
  created** (in `app/api/donate/checkout`) or the webhook will record the donation as one-time
  with no linked animal.
- **`invoice.paid`** — for recurring (monthly) donations, updates the existing `donations` row's
  `status` to `"completed"`, matched by `stripe_subscription_id`.

Trigger test events with the CLI to exercise both paths:

```bash
stripe trigger checkout.session.completed
stripe trigger invoice.paid
```

## Verifying the result

Check the `donations` table (via the Supabase dashboard or `createClient()` in a script) for a row
matching the `stripe_session_id`/`stripe_subscription_id` from the triggered event, with the
expected `frequency`, `status`, `donor_name`/`donor_email`, and `animal_id`.
