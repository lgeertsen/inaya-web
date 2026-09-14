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
  `status` to `"completed"`, matched by `stripe_subscription_id`. The route reads the subscription
  ID from `invoice.parent?.subscription_details?.subscription`, falling back to the older
  `invoice.subscription` field. Stripe moved this field under `parent.subscription_details` in API
  version `2025-03-31.basil`; this project's `stripe` package (`node_modules/stripe`) pins a newer
  version than that, so the `parent.subscription_details` path is the one that actually populates —
  `invoice.subscription` is only there as a defensive fallback. If you ever see the subscription ID
  come back `null`, check which field the installed SDK version is actually populating before
  assuming the webhook logic is broken.

## Triggering test events with the CLI

`stripe trigger <event>` fires a **generic fixture** — it does not carry the `metadata.frequency`
/`metadata.animalId` fields this webhook depends on unless you add them explicitly with `--add`.
Running the bare command below will "succeed" but silently record a one-time, unlinked donation
instead of exercising the metadata-reading code path:

```bash
# Wrong: no metadata, so frequency defaults to one_time and animalId is null
stripe trigger checkout.session.completed
```

Add the fields the route actually reads (`app/api/donate/checkout/route.ts` sets these same keys
when it creates a real session):

```bash
stripe trigger checkout.session.completed \
  --add checkout_session:metadata.frequency=monthly \
  --add checkout_session:metadata.animalId=<an-existing-animal-id>
```

For `invoice.paid`, the trigger creates a **brand-new fixture subscription** unrelated to anything
in your `donations` table — there's nothing for the webhook's `UPDATE ... WHERE stripe_subscription_id
= ...` to match, so it's a silent no-op. To actually test this path, either:
- Go through a real test-mode Checkout session first (monthly frequency, card `4242 4242 4242 4242`)
  so a matching `donations` row and real subscription exist, then let the natural `invoice.paid`
  event fire, or
- Override the fixture's subscription ID to match an existing row:
  `stripe trigger invoice.paid --override invoice:subscription=<existing-stripe-subscription-id>`
  (verify with `--add`/`--override` help via `stripe trigger --help` if the exact path differs by
  CLI version).

## Verifying the result

Check the `donations` table (via the Supabase dashboard or `createClient()` in a script) for a row
matching the `stripe_session_id`/`stripe_subscription_id` from the triggered event, with the
expected `frequency`, `status`, `donor_name`/`donor_email`, and `animal_id`. If you used the bare
`stripe trigger` commands without `--add`/`--override` as described above, don't expect `frequency`
or `animal_id` to be populated — that's expected given the fixture, not a bug.
