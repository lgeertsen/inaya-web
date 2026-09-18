-- Sample data for local development / manual QA.
-- Run after 0001_init.sql. Photos are left empty (photo_upload happens
-- through the admin UI once Storage is configured) — public pages should
-- render a graceful placeholder when an animal has no photos.

insert into animals
  (name, species, track, breed, sex, birth_year, size, bio_fr, bio_en, special_needs, is_published)
values
  ('Nala', 'cat', 'adoption', null, 'female', 2018, 'medium',
   'Nala est une chatte douce et curieuse, à l''aise avec les autres chats.',
   'Nala is a gentle, curious cat who gets along well with other cats.',
   false, true),
  ('Milo', 'cat', 'adoption', null, 'male', 2023, 'small',
   'Milo est un jeune chaton joueur, en cours de finalisation d''adoption.',
   'Milo is a playful young kitten, currently in the final steps of adoption.',
   false, true),
  ('Pablo', 'dog', 'sponsorship', 'Croisé', 'male', 2013, 'large',
   'Pablo est un résident à vie du sanctuaire, parrainable dès 5€/mois.',
   'Pablo is a lifetime resident of the sanctuary, sponsorable from €5/month.',
   true, true),
  ('Ysée', 'horse', 'sponsorship', null, 'female', 2007, 'large',
   'Ysée coule une retraite paisible au pré avec les autres chevaux.',
   'Ysée enjoys a peaceful retirement in the pasture with the other horses.',
   false, true),
  ('Romarin', 'goat', 'sponsorship', null, 'male', 2021, 'medium',
   'Romarin a rejoint une famille d''accueil chaleureuse.',
   'Romarin has joined a warm foster family.',
   false, true);

-- Internal shelter-ops sample data (0002_animal_internal_operations.sql).
-- Every animal already has an animal_internal_details row (created by
-- trigger/backfill) — these statements just fill in details for Nala.

update animal_internal_details
set microchip_number = '250269812345678', coat = 'Tabby', birth_date = '2018-03-14'
where animal_id = (select id from animals where name = 'Nala');

insert into animal_intakes (animal_id, occurred_on, reason, description)
select id, '2022-06-01', 'stray', 'Trouvée errante près du sanctuaire.'
from animals where name = 'Nala';

-- Romarin has already left (adopted) — this outcome is what now drives his
-- public "no longer with us" state automatically (0012), no status field.
insert into animal_outcomes (animal_id, occurred_on, reason, description)
select id, '2024-03-10', 'adopted', 'Adopté par une famille d''accueil.'
from animals where name = 'Romarin';

insert into animal_vaccines (animal_id, name, administered_on, follow_up_date, follow_up_completed)
select id, 'Rage', '2022-06-15', '2023-06-15', true
from animals where name = 'Nala';

insert into animal_treatments (animal_id, name, medicine, start_date, end_date, amount, measurement, day_step, day_times)
select id, 'Vermifuge', 'Milbemax', '2022-06-01', '2022-06-01', 1, 'pill', 90, 1
from animals where name = 'Nala';

-- Vet visits (0003_vet_visits.sql) — one visit, one animal, as an example.
select create_vet_visit(
  '2022-06-16 10:00+02', '2022-06-16 10:30+02', 'Bilan de santé initial', 'completed',
  array[(select id from animals where name = 'Nala')],
  null
);
