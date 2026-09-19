-- Where an animal currently lives (FR: au refuge / famille d'accueil / bar à chat
-- PawPao). Not null with a default of 'shelter' so every existing animal is
-- backfilled as being at the refuge. Distinct from in_shelter (0012), which is
-- derived from intake/outcome history and means "still in our care at all".
-- No RLS changes needed: the existing "animals" policies are unqualified
-- column-wildcard policies that already cover this column.
create type animal_location as enum ('shelter', 'foster_family', 'cat_bar');

alter table animals
  add column location animal_location not null default 'shelter';
