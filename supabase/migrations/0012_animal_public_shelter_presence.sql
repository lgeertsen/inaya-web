-- Derive an animal's public "currently at the shelter" visibility from actual
-- intake/outcome history instead of the manually-maintained `status` field.
-- animal_internal_details.in_shelter (0002) already tracks this for staff,
-- kept in sync by sync_animal_in_shelter() whenever an intake/outcome row is
-- inserted. Mirror it onto the public `animals` table so public pages can
-- filter on it under RLS, and drop the now-redundant `status` column — an
-- animal that has left (any outcome, not just 'adopted') simply stops being
-- offered/shown, with no separate status to keep in sync by hand.

alter table animals add column in_shelter boolean not null default true;

update animals a
set in_shelter = d.in_shelter
from animal_internal_details d
where d.animal_id = a.id;

drop index animals_track_status_idx;
create index animals_track_in_shelter_idx on animals(track, in_shelter);

alter table animals drop column status;
drop type animal_status;

create or replace function sync_animal_in_shelter()
returns trigger as $$
begin
  update public.animal_internal_details
  set in_shelter = (TG_TABLE_NAME = 'animal_intakes'), updated_at = now()
  where animal_id = new.animal_id;

  update public.animals
  set in_shelter = (TG_TABLE_NAME = 'animal_intakes')
  where id = new.animal_id;

  return new;
end;
$$ language plpgsql
set search_path = '';
