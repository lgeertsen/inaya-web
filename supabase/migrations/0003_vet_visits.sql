-- Vet visits: replaces animal_vet_appointments (one row per animal per visit)
-- with a model that supports one visit covering several animals, plus Google
-- Calendar sync tracking (google_event_id / google_sync_error). Admin-only
-- RLS throughout, same as every other internal-ops table.

create table vet_visits (
  id uuid primary key default gen_random_uuid(),
  scheduled_at timestamptz not null,
  end_at timestamptz not null,
  reason text not null,
  status vet_appointment_status not null default 'pending',
  google_event_id text,
  google_sync_error text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vet_visits_scheduled_at_idx on vet_visits(scheduled_at);

create trigger vet_visits_set_updated_at
  before update on vet_visits
  for each row execute function set_updated_at();

create table vet_visit_animals (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references vet_visits(id) on delete cascade,
  animal_id uuid not null references animals(id) on delete cascade,
  notes text,
  follow_up_date date,
  follow_up_completed boolean not null default false,
  unique (visit_id, animal_id)
);

create index vet_visit_animals_visit_id_idx on vet_visit_animals(visit_id);
create index vet_visit_animals_animal_id_idx on vet_visit_animals(animal_id);

alter table vet_visits enable row level security;
alter table vet_visit_animals enable row level security;

create policy "admin full access vet visits" on vet_visits
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin full access vet visit animals" on vet_visit_animals
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Atomic create (visit + its animals). SECURITY INVOKER (the default), so RLS
-- still applies as the calling admin. search_path is pinned empty like every
-- other function in this repo — table references must be schema-qualified.
create or replace function create_vet_visit(
  p_scheduled_at timestamptz,
  p_end_at timestamptz,
  p_reason text,
  p_status vet_appointment_status,
  p_animal_ids uuid[],
  p_created_by uuid
) returns uuid as $$
declare
  v_visit_id uuid;
begin
  insert into public.vet_visits (scheduled_at, end_at, reason, status, created_by)
  values (p_scheduled_at, p_end_at, p_reason, p_status, p_created_by)
  returning id into v_visit_id;

  insert into public.vet_visit_animals (visit_id, animal_id)
  select v_visit_id, unnest(p_animal_ids);

  return v_visit_id;
end;
$$ language plpgsql
set search_path = '';

-- Preserve the existing single-animal appointment(s) before dropping the old
-- table. Reusing the same id keeps vet_visits/vet_visit_animals in exact
-- correspondence without a fragile join-by-value migration.
insert into vet_visits (id, scheduled_at, end_at, reason, status, created_at, updated_at)
select id, scheduled_at, scheduled_at + interval '30 minutes', reason, status, created_at, updated_at
from animal_vet_appointments;

insert into vet_visit_animals (visit_id, animal_id, follow_up_date, follow_up_completed)
select id, animal_id, follow_up_date, follow_up_completed
from animal_vet_appointments;

drop table animal_vet_appointments;
