---
name: supabase-migration
description: Use when adding or editing a Supabase SQL migration in this project (new table, column, policy, or trigger under supabase/migrations/) — walks through the RLS, trigger, and seed-data conventions this repo already follows.
---

# Supabase migration workflow (inaya-web)

This project has no local Supabase CLI stack (no `config.toml`, no `functions/`) — migrations are
plain numbered SQL files applied manually against the remote project. Follow the conventions
already established in `supabase/migrations/0001_init.sql`.

## Steps

1. **Create the file**: `supabase/migrations/000N_description.sql`, numbered sequentially after
   the highest existing migration.

2. **Enable RLS on every new table**:
   ```sql
   alter table <table> enable row level security;
   ```
   Do this even if you think a table is admin-only — the existing migration enables it on all
   three tables (`animals`, `animal_photos`, `donations`) unconditionally.

3. **Add explicit policies**, matching the existing split:
   - A `public read` policy, but only for rows that are safe to expose — gate it on something
     like `is_published = true`, the way `animals` and `animal_photos` do. If nothing about the
     table is public, skip the read policy entirely (see `donations`, which has an admin-only read
     policy and no public one).
   - An `admin full access` policy using `auth.role() = 'authenticated')` for both `using` and
     `with check` — this project treats any authenticated user as an admin (see `lib/auth.ts`),
     there's no separate role system.
   - If a table should only ever be written by a server-side service-role client (e.g. driven by
     a webhook, like `donations`), skip the admin write policy and add a comment explaining that
     writes go through `createAdminClient()` and bypass RLS — don't invent a write policy that
     nothing will use.

4. **Reuse the existing `updated_at` trigger** rather than redefining it — if the table has an
   `updated_at` column, add:
   ```sql
   create trigger <table>_set_updated_at
     before update on <table>
     for each row execute function set_updated_at();
   ```
   `set_updated_at()` is already defined in `0001_init.sql`; don't recreate it in a later
   migration.

5. **Update `supabase/seed.sql`** with a couple of representative rows for local dev if the new
   table needs sample data to exercise the UI.

6. **Storage buckets**, if relevant, follow the `animal-photos` pattern at the bottom of
   `0001_init.sql`: an idempotent `insert into storage.buckets ... on conflict (id) do nothing`,
   a public-read policy on `storage.objects` scoped to the bucket, and an authenticated-write
   policy scoped the same way.

## After writing the migration

Since there's no local Supabase stack, the migration can't be applied with a local `supabase db
reset`. Confirm the SQL is correct by inspection (or against a Supabase branch/project if one is
available), then apply it manually via the Supabase SQL editor or CLI against the target project.
