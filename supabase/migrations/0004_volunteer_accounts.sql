-- Volunteer accounts: a second, restricted account type for the admin panel.
-- Volunteers may browse animals and upload photos; everything else (editing
-- animal records, calendar, donations, internal shelter-ops data, and
-- choosing which photo is shown publicly) stays admin-only.
--
-- Every existing RLS policy in this database checks `auth.role() =
-- 'authenticated'`, i.e. "any logged-in user" — that was fine when every
-- logged-in user was an admin, but now grants volunteers the same access.
-- This migration introduces an explicit role and tightens every one of those
-- policies to `public.current_role() = 'admin'`, except the couple of
-- policies volunteers need (reading animals, reading/inserting photos).

-- profiles -------------------------------------------------------------------

create type user_role as enum ('admin', 'volunteer');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'volunteer',
  display_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "read own profile" on profiles
  for select using (id = auth.uid());
-- No write policy: role changes are made manually via the SQL editor, the
-- same "provisioned manually, no self-serve" workflow already used for
-- creating accounts in the Supabase Auth dashboard.

-- security definer so it can be used inside other tables' RLS policies
-- (including profiles' own) without recursive-RLS issues — same reasoning
-- as the security invoker function in 0003_vet_visits.sql, just definer
-- since this one must read across the calling user's own row access.
create or replace function public.current_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer
set search_path = '';

-- New Supabase Auth users default to 'volunteer'. Promoting someone to admin
-- is one manual statement: update profiles set role = 'admin' where id = '<uuid>';
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql
security definer
set search_path = '';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: every account that exists today keeps today's full-admin access.
insert into profiles (id, role)
select id, 'admin' from auth.users
on conflict (id) do nothing;

-- animal_photos: featured (publicly shown) photo -----------------------------

alter table animal_photos add column is_featured boolean not null default false;
alter table animal_photos add column uploaded_by uuid references auth.users(id);

create unique index animal_photos_one_featured_per_animal
  on animal_photos (animal_id) where is_featured;

create or replace function animal_photos_enforce_single_featured()
returns trigger as $$
begin
  if new.is_featured then
    update public.animal_photos
    set is_featured = false
    where animal_id = new.animal_id and id <> new.id and is_featured;
  end if;
  return new;
end;
$$ language plpgsql
set search_path = '';

create trigger animal_photos_enforce_single_featured
  before insert or update on animal_photos
  for each row execute function animal_photos_enforce_single_featured();

-- Preserve today's implicit "lowest position wins" behavior as the explicit
-- featured photo, for every animal that already has at least one photo.
with first_photo as (
  select distinct on (animal_id) id
  from animal_photos
  order by animal_id, position
)
update animal_photos
set is_featured = true
where id in (select id from first_photo);

-- RLS: split animals/animal_photos into a staff-readable, admin-writable pair
-------------------------------------------------------------------------------

drop policy "admin full access animals" on animals;

create policy "staff read animals" on animals
  for select using (auth.role() = 'authenticated');

create policy "admin write animals" on animals
  for insert with check (public.current_role() = 'admin');

create policy "admin update animals" on animals
  for update using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "admin delete animals" on animals
  for delete using (public.current_role() = 'admin');

drop policy "admin full access photos" on animal_photos;

create policy "staff read photos" on animal_photos
  for select using (auth.role() = 'authenticated');

create policy "staff upload photos" on animal_photos
  for insert with check (auth.role() = 'authenticated');

create policy "admin update photos" on animal_photos
  for update using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "admin delete photos" on animal_photos
  for delete using (public.current_role() = 'admin');

-- RLS: tighten every other admin policy from "any authenticated user" to
-- "admin only" — volunteers should not see or touch any of this.
-------------------------------------------------------------------------------

drop policy "admin read donations" on donations;
create policy "admin read donations" on donations
  for select using (public.current_role() = 'admin');

drop policy "admin full access internal details" on animal_internal_details;
create policy "admin full access internal details" on animal_internal_details
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

drop policy "admin full access intakes" on animal_intakes;
create policy "admin full access intakes" on animal_intakes
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

drop policy "admin full access outcomes" on animal_outcomes;
create policy "admin full access outcomes" on animal_outcomes
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

drop policy "admin full access vaccines" on animal_vaccines;
create policy "admin full access vaccines" on animal_vaccines
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

drop policy "admin full access treatments" on animal_treatments;
create policy "admin full access treatments" on animal_treatments
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

drop policy "admin full access vet visits" on vet_visits;
create policy "admin full access vet visits" on vet_visits
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

drop policy "admin full access vet visit animals" on vet_visit_animals;
create policy "admin full access vet visit animals" on vet_visit_animals
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- storage.objects is intentionally left unchanged: both roles are
-- "authenticated" and volunteers legitimately need to write photo objects.
-- The real gate on *who* may call the upload endpoint is requireStaff() in
-- lib/auth.ts, matching the existing defense-in-depth split between RLS and
-- Route Handler checks.
