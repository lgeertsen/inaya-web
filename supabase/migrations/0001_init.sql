-- Inaya shelter website — initial schema
-- Animals (adoption + lifetime sponsorship tracks) and donations (Stripe).

create extension if not exists "pgcrypto";

create type animal_species as enum ('cat', 'dog', 'horse', 'goat', 'other');
create type animal_track as enum ('adoption', 'sponsorship'); -- adoptable vs. permanent resident
create type animal_status as enum ('available', 'pending', 'adopted'); -- meaningful for track='adoption'
create type animal_sex as enum ('male', 'female', 'unknown');

create table animals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  species animal_species not null,
  track animal_track not null default 'adoption',
  status animal_status not null default 'available',
  breed text,
  sex animal_sex not null default 'unknown',
  birth_year int,
  birth_month int,
  size text,
  arrival_date date,
  bio_fr text,
  bio_en text,
  special_needs boolean not null default false,
  is_published boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table animal_photos (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animals(id) on delete cascade,
  storage_path text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index animal_photos_animal_id_idx on animal_photos(animal_id);
create index animals_species_idx on animals(species);
create index animals_track_status_idx on animals(track, status);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = '';

create trigger animals_set_updated_at
  before update on animals
  for each row execute function set_updated_at();

alter table animals enable row level security;
alter table animal_photos enable row level security;

create policy "public read published animals" on animals
  for select using (is_published = true);

create policy "admin full access animals" on animals
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read photos of published animals" on animal_photos
  for select using (
    exists (
      select 1 from animals
      where animals.id = animal_photos.animal_id
        and animals.is_published = true
    )
  );

create policy "admin full access photos" on animal_photos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Donations (Stripe Checkout) --------------------------------------------

create type donation_frequency as enum ('one_time', 'monthly');
create type donation_status as enum ('pending', 'completed', 'failed', 'refunded');

create table donations (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  amount_cents int not null,
  currency text not null default 'eur',
  frequency donation_frequency not null default 'one_time',
  status donation_status not null default 'pending',
  donor_name text,
  donor_email text,
  animal_id uuid references animals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger donations_set_updated_at
  before update on donations
  for each row execute function set_updated_at();

alter table donations enable row level security;

create policy "admin read donations" on donations
  for select using (auth.role() = 'authenticated');
-- No insert/update/delete policy: donations are written only by the Stripe
-- webhook route handler using the service-role key, which bypasses RLS.

-- Storage ------------------------------------------------------------------
-- Run once (idempotent): public-read bucket for animal photos, writable only
-- by authenticated (admin) users.

insert into storage.buckets (id, name, public)
values ('animal-photos', 'animal-photos', true)
on conflict (id) do nothing;

create policy "public read animal photos" on storage.objects
  for select using (bucket_id = 'animal-photos');

create policy "admin write animal photos" on storage.objects
  for all using (bucket_id = 'animal-photos' and auth.role() = 'authenticated')
  with check (bucket_id = 'animal-photos' and auth.role() = 'authenticated');
