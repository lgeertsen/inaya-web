-- Tracks when a volunteer last did something, for the "Dernière activité"
-- column on /admin/accounts (admin dashboard redesign). The only
-- volunteer-writable action today is uploading an animal photo
-- (app/api/admin/animals/[id]/photos POST), which stamps this column for the
-- signed-in volunteer.
--
-- That upload route runs with the caller's own RLS-bound session (not the
-- service-role client), so volunteers need permission to update their own
-- profiles row. A plain `for update using (id = auth.uid())` policy would be
-- enough for RLS, but Supabase's default project grants give `authenticated`
-- table-level UPDATE on every column — combined with that policy, a
-- volunteer could self-promote via `update profiles set role = 'admin' ...`
-- from the browser. Column-level grants close that: only last_active_at is
-- writable, so the existing "no self-serve role changes" invariant (see
-- 0004_volunteer_accounts.sql) still holds.

alter table profiles add column last_active_at timestamptz;

revoke update on profiles from authenticated;
grant update (last_active_at) on profiles to authenticated;

create policy "update own last_active_at" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
