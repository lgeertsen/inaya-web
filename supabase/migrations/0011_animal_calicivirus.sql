-- Cat-only calicivirus flag, structurally identical to special_needs (plain
-- boolean, no CHECK constraint — "cat-only" is enforced at the app layer, not
-- the DB). No RLS changes needed: the existing "animals" policies are
-- unqualified column-wildcard policies that already cover this column.
alter table animals
  add column calicivirus boolean not null default false;
