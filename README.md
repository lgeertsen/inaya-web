# Inaya — inaya.farm

Bilingual (FR/EN) website for Association Inaya, an animal sanctuary in Villeneuve-sur-Lot, France. Built with Next.js (App Router), Supabase (database, auth, storage) and Stripe (donations).

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript, Turbopack)
- **i18n**: next-intl (`fr` default, `en`), locale-prefixed routes (`/fr/...`, `/en/...`)
- **Database + Auth + Storage**: Supabase
- **Payments**: Stripe Checkout (one-time and monthly donations)
- **Styling**: Tailwind CSS v4, design tokens in `app/globals.css` (`@theme`) sourced from the Claude Design mockup
- **Hosting target**: Heroku (`Procfile` included)

## Prerequisites

- **Node.js 22+** (Next.js 16 requires 20.9+, but `@supabase/supabase-js` is deprecating support for Node 20 and below — use 22 or later, ideally the current LTS). This project develops against **Node 24 LTS**. If your machine's default `node -v` is older, use `nvm`/`nvm-windows` to switch: `nvm use 24.21.0` (or install a current LTS).
- A [Supabase](https://supabase.com) project
- A [Stripe](https://dashboard.stripe.com) account (test mode is fine for local dev)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.local.example` to `.env.local` and fill in real values:

   ```bash
   cp .env.local.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Settings > API Keys >
     "Publishable and secret API keys" tab. Despite the var name, use the `sb_publishable_...` key
     here, not the legacy anon JWT.
   - `SUPABASE_SERVICE_ROLE_KEY` — same tab, the `sb_secret_...` key (not the legacy service_role
     JWT). **Server-only**, never expose to the client.
   - `STRIPE_SECRET_KEY` — from the Stripe dashboard (use a test-mode key while developing).
   - `STRIPE_WEBHOOK_SECRET` — see "Stripe webhook" below.

   A checked-in `.env.local` with placeholder values lets `npm run dev` boot without crashing, but every Supabase-backed page (home, animals listing/detail, admin) and the donation flow will error until you swap in real credentials.

3. **Set up the database**

   In the Supabase SQL editor (or via the CLI), run:

   ```
   supabase/migrations/0001_init.sql
   ```

   This creates the `animals`, `animal_photos`, and `donations` tables, their Row Level Security policies, and the `animal-photos` Storage bucket.

   Optionally seed sample animals for local testing:

   ```
   supabase/seed.sql
   ```

4. **Create your first admin user**

   In the Supabase dashboard under Authentication → Users, invite/create a user with your email and a password. There is no public sign-up — any authenticated Supabase user is treated as an admin (see `lib/auth.ts`). Sign in at `/admin/login`.

5. **Stripe webhook (local dev)**

   Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward events to your local server:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the printed webhook signing secret into `STRIPE_WEBHOOK_SECRET`. Test with card `4242 4242 4242 4242`.

6. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — it redirects to `/fr` (the default locale).

## Project structure

```
app/[locale]/        Public pages + /admin (route-protected via proxy.ts)
app/api/              Route handlers: admin animal CRUD, donation checkout, Stripe webhook
components/ui/        Design-token-driven primitives (Button, Card, Badge, Field, ...)
components/site/      Header, Footer, locale switcher, contact/donate forms
components/animals/   Public animal card/filter components
components/admin/     Admin shell, animal form, photo uploader
lib/                  Supabase clients, auth guard, zod validation, animals data access, Stripe
i18n/                 next-intl routing config + fr.json/en.json message catalogs
theme/tokens.ts       Raw design token values (mirrored into globals.css)
supabase/             SQL migration + seed data
proxy.ts              next-intl locale routing + admin auth gate (Next.js 16's middleware replacement)
```

## Deploying to Heroku

1. `heroku create <app-name>`
2. `heroku config:set NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=...`
3. Push to Heroku (`git push heroku main`) or connect the GitHub repo for auto-deploy.
4. Scale to a non-sleeping dyno tier for production (`heroku ps:scale web=1:basic` or current equivalent).
5. `heroku domains:add www.inaya.farm`, then point the DNS record it gives you at your registrar.
6. Add a Stripe webhook endpoint for `https://www.inaya.farm/api/webhooks/stripe` (events: `checkout.session.completed`, `invoice.paid`) and set its signing secret as `STRIPE_WEBHOOK_SECRET` on Heroku.
7. Switch Stripe to live-mode keys only after verifying the donation flow end-to-end in test mode.

## What's intentionally out of scope for v1

See the project plan for the full rationale — briefly: the old site's `video`, `crowdfunding`, and `news` pages were dropped rather than migrated; French tax receipts ("reçu fiscal") are handled manually by staff rather than automated; and static marketing copy lives in the i18n JSON files rather than a database, since it changes rarely.
