-- Internal shelter-operations data for animals: microchip/coat/birth date,
-- in-shelter status, intake/outcome history, vaccines, treatments, vet
-- appointments. All admin-only — no public RLS policy on any table here,
-- since the public `animals` RLS policy is row-level and would otherwise
-- expose these columns to anyone querying with the anon key.

create type animal_intake_reason as enum (
  'stray',                       -- trouvé errant
  'police_surrender',            -- confié par la police
  'born_in_care',                -- naissance
  'shelter_transfer',            -- sortie fourrière
  'association_transfer',        -- sortie autre association
  'owner_surrender',             -- cédé
  'abandoned',                   -- abandon
  'cruelty_seizure'              -- saisi maltraitance
);

create type animal_outcome_reason as enum (
  'reunited_with_owner',         -- propriétaire retrouvé
  'deceased',                    -- DCD
  'euthanized',                  -- euthanasie
  'released',                    -- relâché
  'transferred_to_association',  -- parti chez une autre association
  'adopted'                      -- adopté
);

create type treatment_measurement_unit as enum ('pill', 'spoon', 'ml', 'cl');
create type vet_appointment_status as enum ('pending', 'completed', 'canceled');

-- animal_internal_details ---------------------------------------------------
-- 1:1 with animals. A row is created automatically for every animal (trigger
-- below), so app code only ever needs to UPDATE this table, never upsert.

create table animal_internal_details (
  animal_id uuid primary key references animals(id) on delete cascade,
  microchip_number text unique,
  coat text,
  birth_date date,
  in_shelter boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger animal_internal_details_set_updated_at
  before update on animal_internal_details
  for each row execute function set_updated_at();

create or replace function create_animal_internal_details()
returns trigger as $$
begin
  insert into public.animal_internal_details (animal_id) values (new.id);
  return new;
end;
$$ language plpgsql
set search_path = '';

create trigger animals_create_internal_details
  after insert on animals
  for each row execute function create_animal_internal_details();

-- animal_intakes / animal_outcomes ------------------------------------------
-- Intake/outcome history (the Miro board's Entry/Leave). `recorded_by`
-- replaces the board's free-text staff name field, consistent with
-- animals.created_by.

create table animal_intakes (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animals(id) on delete cascade,
  occurred_on date not null,
  reason animal_intake_reason not null,
  description text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table animal_outcomes (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animals(id) on delete cascade,
  occurred_on date not null,
  reason animal_outcome_reason not null,
  description text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index animal_intakes_animal_id_idx on animal_intakes(animal_id);
create index animal_outcomes_animal_id_idx on animal_outcomes(animal_id);

-- Keep animal_internal_details.in_shelter in sync regardless of which code
-- path inserts an intake/outcome row.
create or replace function sync_animal_in_shelter()
returns trigger as $$
begin
  update public.animal_internal_details
  set in_shelter = (TG_TABLE_NAME = 'animal_intakes'), updated_at = now()
  where animal_id = new.animal_id;
  return new;
end;
$$ language plpgsql
set search_path = '';

create trigger animal_intakes_sync_in_shelter
  after insert on animal_intakes
  for each row execute function sync_animal_in_shelter();

create trigger animal_outcomes_sync_in_shelter
  after insert on animal_outcomes
  for each row execute function sync_animal_in_shelter();

-- animal_vaccines ------------------------------------------------------------

create table animal_vaccines (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animals(id) on delete cascade,
  name text not null,
  administered_on date not null,
  follow_up_date date,
  follow_up_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index animal_vaccines_animal_id_idx on animal_vaccines(animal_id);

create trigger animal_vaccines_set_updated_at
  before update on animal_vaccines
  for each row execute function set_updated_at();

-- animal_treatments -----------------------------------------------------------
-- Dosing schedule: `step` orders sequential phases of one treatment plan,
-- `day_step`/`day_times` describe the dosing interval/frequency.

create table animal_treatments (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animals(id) on delete cascade,
  name text not null,
  medicine text not null,
  start_date date not null,
  end_date date,
  step int not null default 1,
  amount numeric not null,
  measurement treatment_measurement_unit not null,
  day_step int,
  day_times int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index animal_treatments_animal_id_idx on animal_treatments(animal_id);

create trigger animal_treatments_set_updated_at
  before update on animal_treatments
  for each row execute function set_updated_at();

-- animal_vet_appointments -----------------------------------------------------

create table animal_vet_appointments (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animals(id) on delete cascade,
  scheduled_at timestamptz not null,
  reason text not null,
  status vet_appointment_status not null default 'pending',
  follow_up_date date,
  follow_up_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index animal_vet_appointments_animal_id_idx on animal_vet_appointments(animal_id);

create trigger animal_vet_appointments_set_updated_at
  before update on animal_vet_appointments
  for each row execute function set_updated_at();

-- RLS -------------------------------------------------------------------------
-- Admin-only across the board. No public policy on any of these tables.

alter table animal_internal_details enable row level security;
alter table animal_intakes enable row level security;
alter table animal_outcomes enable row level security;
alter table animal_vaccines enable row level security;
alter table animal_treatments enable row level security;
alter table animal_vet_appointments enable row level security;

create policy "admin full access internal details" on animal_internal_details
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin full access intakes" on animal_intakes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin full access outcomes" on animal_outcomes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin full access vaccines" on animal_vaccines
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin full access treatments" on animal_treatments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin full access vet appointments" on animal_vet_appointments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Backfill: give existing animals an internal_details row too (the trigger
-- above only fires for future inserts).
insert into animal_internal_details (animal_id)
select id from animals
on conflict (animal_id) do nothing;
