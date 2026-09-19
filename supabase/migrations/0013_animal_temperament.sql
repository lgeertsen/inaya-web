-- Cat-only temperament (FR: sauvage / apprivoisé / semi-sauvage). Nullable —
-- null means "not set", which is also what every non-cat animal holds. "Cat-only"
-- is enforced at the app layer, not the DB, same as calicivirus (0011). No RLS
-- changes needed: the existing "animals" policies are unqualified
-- column-wildcard policies that already cover this column.
create type animal_temperament as enum ('wild', 'tame', 'semi_wild');

alter table animals
  add column temperament animal_temperament;
