@AGENTS.md

# Project-specific guidance (inaya-web)

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4. Next 16 renamed
`middleware.ts` to `proxy.ts` — this repo uses `proxy.ts`, not `middleware.ts`. Before touching
routing, proxy, or other framework conventions, check
`node_modules/next/dist/docs/01-app/02-guides/ai-agents.md` and
`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` — this Next.js version has
breaking changes vs. training data (see the block above).

## Supabase

Three clients in `lib/supabase/`, pick based on context:
- `client.ts` — browser/Client Components.
- `server.ts` (`createClient()`) — Server Components, Server Actions, Route Handlers. Cookie-based,
  respects RLS. Use this for anything running with a user session.
- `admin.ts` (`createAdminClient()`) — service-role key, bypasses RLS. Server-only, never import
  from client code. Used by the Stripe webhook route (no user session to write `donations` rows
  with) and by the volunteer-account routes (`app/api/admin/accounts/**`, `lib/accounts.ts`), which
  need the Auth admin API to create/list/delete `auth.users` rows.

Auth model (`lib/auth.ts`): two roles, stored in a `profiles` table keyed off `auth.users.id` —
`admin` (full access) and `volunteer` (can browse animals and upload photos only). `requireAdmin()`
gates Route Handlers to admins; `requireStaff()` allows either role; `getPageRole()` is for
Server Components/layouts. There is no public sign-up. Admins can create/delete volunteer accounts
from `/admin/accounts` (backed by the Auth admin API — see above); a DB trigger creates each new
user's `profiles` row, defaulted to `volunteer`. A second admin account still has to be provisioned
manually via the Supabase Auth dashboard, then promoted with
`update profiles set role = 'admin' where id = '<uuid>'` in the SQL editor. RLS policies must key
off `public.current_role() = 'admin'`, not `auth.role() = 'authenticated'` — see
`0004_volunteer_accounts.sql` and the `supabase-migration` skill.

Migrations live in `supabase/migrations/`, applied manually against the remote project — there's
no local Supabase CLI stack (no `config.toml`, no `functions/`). See the `supabase-migration`
skill for the conventions new migrations should follow.

## i18n

`next-intl`. French is the default locale; routes are locale-prefixed under `app/[locale]/`. All
user-facing copy lives in `i18n/messages/fr.json` and `en.json` — never hardcode strings in
components. See the `i18n-copy-sync` skill.

## Design tokens

`theme/tokens.ts` is the source of truth for design tokens and is manually mirrored into the
`@theme` block in `app/globals.css`. A token change means editing both files.

## Payments

`lib/stripe.ts` builds the Stripe client lazily, so importing it never requires
`STRIPE_SECRET_KEY` to be set. Checkout session creation is `app/api/donate/checkout`; the webhook
at `app/api/webhooks/stripe/route.ts` is the only writer of the `donations` table. See the
`stripe-donation-testing` skill for local webhook testing.

## Testing & verification

No test framework or CI is configured yet — don't assume `npm test` exists. Verify changes with
`npm run lint`, `npm run build`, and manual browser checks via the `inaya-web-dev` launch config in
`.claude/launch.json`.

## Deployment

Heroku, via `Procfile`.
