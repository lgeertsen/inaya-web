-- Foster-home tracking. 0015 added animals.location = 'foster_family' but not
-- *which* family, since when, or how the placement is going. This adds:
--   foster_families   — the households (contact details are personal data, so
--                       admin-only RLS, no public policy), optionally linked to
--                       a volunteer login (user_id) so fosterers can upload
--                       photos of their animals like any other volunteer.
--   foster_placements — history of animal → family stays. The open row
--                       (ended_on is null) is the current placement; a partial
--                       unique index allows at most one per animal.
--   foster_checkins   — call/visit/message log per placement. The next check-in
--                       is due checkin_interval_days after the last one (or the
--                       placement start); computed in app code.
-- Triggers keep animals.location in step with placements, and close an open
-- placement when an outcome (adopted, deceased, ...) is recorded.

create type foster_family_status as enum ('active', 'paused', 'inactive');
create type foster_end_reason as enum ('returned_to_shelter', 'adopted', 'deceased', 'other');
create type foster_checkin_type as enum ('call', 'visit', 'message');

-- foster_families -------------------------------------------------------------

create table foster_families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  city text,
  capacity int not null default 1 check (capacity >= 0),
  accepted_species animal_species[] not null default '{}',
  status foster_family_status not null default 'active',
  notes text,
  -- Optional login for this household. unique: one account belongs to at most
  -- one family. set null: revoking the account keeps the family record.
  user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger foster_families_set_updated_at
  before update on foster_families
  for each row execute function set_updated_at();

-- foster_placements -----------------------------------------------------------

create table foster_placements (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animals(id) on delete cascade,
  -- restrict: a family with history can't be deleted, only set to 'inactive'.
  foster_family_id uuid not null references foster_families(id) on delete restrict,
  started_on date not null,
  ended_on date,
  end_reason foster_end_reason,
  notes text,
  checkin_interval_days int not null default 14 check (checkin_interval_days > 0),
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((ended_on is null) = (end_reason is null)),
  check (ended_on is null or ended_on >= started_on)
);

create unique index foster_placements_one_open_per_animal
  on foster_placements (animal_id) where ended_on is null;
create index foster_placements_animal_id_idx on foster_placements(animal_id);
create index foster_placements_family_id_idx on foster_placements(foster_family_id);

create trigger foster_placements_set_updated_at
  before update on foster_placements
  for each row execute function set_updated_at();

-- foster_checkins -------------------------------------------------------------

create table foster_checkins (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references foster_placements(id) on delete cascade,
  occurred_on date not null,
  type foster_checkin_type not null,
  notes text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index foster_checkins_placement_id_idx on foster_checkins(placement_id);

-- RLS: admin-only ---------------------------------------------------------------

alter table foster_families enable row level security;
alter table foster_placements enable row level security;
alter table foster_checkins enable row level security;

create policy "admin full access foster families" on foster_families
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "admin full access foster placements" on foster_placements
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "admin full access foster checkins" on foster_checkins
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- Which animals the signed-in volunteer currently fosters. Security definer so
-- a fosterer can learn their own animal ids without being granted read access
-- to the family row (admin notes) or the placement rows (notes, check-ins).
create or replace function public.my_foster_animal_ids()
returns setof uuid as $$
  select p.animal_id
  from public.foster_placements p
  join public.foster_families f on f.id = p.foster_family_id
  where f.user_id = auth.uid() and p.ended_on is null;
$$ language sql stable security definer
set search_path = '';

-- EXECUTE is granted to PUBLIC by default, so `revoke ... from anon, authenticated`
-- alone leaves it callable; PUBLIC must be revoked explicitly too.
revoke execute on function public.my_foster_animal_ids() from public, anon;
grant execute on function public.my_foster_animal_ids() to authenticated;

-- Triggers ----------------------------------------------------------------------

-- Keep animals.location in sync however a placement row is opened, ended or
-- removed. Ending/removing only resets a location that is still 'foster_family',
-- so it never overwrites a location an admin changed by hand.
create or replace function public.sync_animal_foster_location()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.ended_on is null then
      update public.animals set location = 'foster_family' where id = new.animal_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.ended_on is null and new.ended_on is not null then
      update public.animals set location = 'shelter'
      where id = new.animal_id and location = 'foster_family';
    elsif old.ended_on is not null and new.ended_on is null then
      update public.animals set location = 'foster_family' where id = new.animal_id;
    end if;
  elsif tg_op = 'DELETE' then
    if old.ended_on is null then
      update public.animals set location = 'shelter'
      where id = old.animal_id and location = 'foster_family';
    end if;
  end if;
  return null;
end;
$$ language plpgsql
set search_path = '';

create trigger foster_placements_sync_location
  after insert or update or delete on foster_placements
  for each row execute function public.sync_animal_foster_location();

-- Recording an outcome (adopted, deceased, ...) ends any open placement, so
-- history and location can't drift from the intake/outcome flow. greatest()
-- keeps the ended_on >= started_on check from failing the outcome insert.
create or replace function public.close_foster_placement_on_outcome()
returns trigger as $$
begin
  update public.foster_placements
  set ended_on = greatest(new.occurred_on, started_on),
      end_reason = case
        when new.reason = 'adopted' then 'adopted'::public.foster_end_reason
        when new.reason in ('deceased', 'euthanized') then 'deceased'::public.foster_end_reason
        else 'other'::public.foster_end_reason
      end
  where animal_id = new.animal_id and ended_on is null;
  return new;
end;
$$ language plpgsql
set search_path = '';

create trigger animal_outcomes_close_foster_placement
  after insert on animal_outcomes
  for each row execute function public.close_foster_placement_on_outcome();

-- Trigger-only functions: not meant to be callable through /rest/v1/rpc
-- (same reasoning as handle_new_user() in 0005).
revoke execute on function public.sync_animal_foster_location() from public, anon, authenticated;
revoke execute on function public.close_foster_placement_on_outcome() from public, anon, authenticated;
