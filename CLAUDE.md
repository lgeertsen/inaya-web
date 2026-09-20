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
- `anon.ts` (`createAnonClient()`) — cookie-free anon client for reading RLS-public data during
  rendering without touching `cookies()` (used for `site_texts` overrides in `i18n/request.ts`).
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

## Foster families

Admin-only (`/admin/foster`, plus a "Famille d'accueil" tab on each animal); data layer in
`lib/foster.ts`, schema in `0017_foster.sql`. `foster_families` (contact details — personal data,
admin-only RLS) → `foster_placements` (history; the row with `ended_on is null` is the current
stay, at most one per animal) → `foster_checkins` (call/visit/message log; the next check-in is due
`checkin_interval_days` after the last one, computed in `lib/foster.ts`, and overdue ones feed the
overview's "À traiter" panel). `animals.location` is derived: DB triggers set it to `foster_family`
when a placement opens and back to `shelter` when it ends, and recording an outcome
(`animal_outcomes`) auto-closes an open placement — so `AnimalForm` locks the location select while
a placement is open. A family can be linked to a volunteer login (`foster_families.user_id`,
unique) so it can upload photos; the only volunteer-facing read is the `my_foster_animal_ids()`
security-definer RPC (ids only), which `/admin/animals` uses to list a fosterer's own animals first.
Families with placement history can't be deleted (FK `restrict`) — set them `inactive`.

## Entries/exits register

Admin-only (`/admin/register`), the yearly legal register: on-page summary plus a French PDF from
`GET /api/admin/register/pdf?year=` (`jspdf` + `jspdf-autotable`; labels always from the `fr`
`admin.register` namespace, never the browsing locale). Data layer in `lib/register.ts`, PDF in
`lib/register-pdf.ts`. It's event-based: one row per `animal_intakes` / `animal_outcomes` row, with
the Provenance / Destinataire contact fields and `document_ref` added in `0018_register_contacts.sql`.
Several of our reasons fold into one register column (`owner_surrender`+`abandoned`,
`deceased`+`euthanized`) — see `toIntakeCause` / `toOutcomeCause`.

## i18n

`next-intl`. French is the default locale; routes are locale-prefixed under `app/[locale]/`. All
user-facing copy lives in `i18n/messages/fr.json` and `en.json` — never hardcode strings in
components. See the `i18n-copy-sync` skill.

**Admin-editable texts.** The JSON files are only the *defaults*: an admin can override any public
string (except the French-only `admin.*` namespace) from `/admin/texts`. Overrides live in the
`site_texts` table (one row per locale + dotted key such as `home.title` or `adopt.steps.2`;
migration `0014_site_texts.sql`) and are merged over the JSON in `i18n/request.ts` via
`lib/site-texts.ts` (`getOverrides` is `unstable_cache`d under the `site-texts` tag and falls back
to the JSON if Supabase is unreachable). Saves go through `PUT /api/admin/site-texts`, which
validates the key against the shipped JSON and requires identical ICU placeholders (`lib/icu.ts`),
then invalidates the tag. Consequences: a shipped-copy change won't show for a key an admin has
already overridden; renaming or removing a key orphans its row (ignored at runtime).
`lib/site-text-pages.ts` maps key prefixes to the page each string is edited under — add new
namespaces there (unmapped keys fall into an "Autres textes" bucket). The editor previews the real
public page in an iframe and finds each string in the DOM by matching rendered text
(`components/admin/texts/preview-controller.ts`), so the public components need no extra markup.

## Site images

Public-page photo spots are `<SiteImage slot="…">` (`components/site/SiteImage.tsx`), never a bare
`ImagePlaceholder`. Admins upload the photos from `/admin/images`; until one exists the slot renders
its placeholder. The slots are a registry in `lib/site-images.ts` (stable id, owning page, aspect
ratio, `sizes`, and the message key whose text is the photo's `alt`/caption) — a new spot needs a
registry entry plus a `<SiteImage>` at the call site, and its aspect lives only in the registry.
Uploads live in the `site_images` table (`0016_site_images.sql`, one row per slot) and the public,
admin-write-only `site-images` bucket; uploads (POST), crop focus (PATCH) and removal (DELETE) go
through `/api/admin/site-images/[slot]`, which converts to WebP, gives every upload a fresh storage path, and
invalidates the `site-images` cache tag (same pattern as `site_texts`). One photo serves both
locales; only its alt text is per-locale.

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

Everything under `/admin` needs a login, and Claude must not type credentials into forms (even
ones in `.env.local`). To verify admin UI in the Browser pane, ask the user to sign in there
themselves first; the session then persists. Don't spend time trying to reach `/admin` logged out.
The public site (e.g. `/fr`) can be checked without a login.

**Text editor preview (`components/admin/texts/`).** `PreviewFrame` measures its container and sizes
a scaled iframe to fit. Keep that measurement independent of its own content: the container is
`absolute inset-0` inside a `relative` wrapper, is `overflow-hidden`, and the frame's border is
subtracted from the measured space on both axes. Anything that makes the frame even 1px larger than
the measured space, or lets the container's height follow its content, creates a resize feedback
loop (page grows, or layout flickers several times a second). Below `lg` the layout stacks and the
preview column must be `flex-none` so its `70vh` height applies.

## Deployment

Heroku, via `Procfile`.
