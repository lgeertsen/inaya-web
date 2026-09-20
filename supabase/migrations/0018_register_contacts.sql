-- Entries/exits register (registre d'entrées-sorties): the yearly PDF lists, for every
-- intake, who the animal came from (Provenance) and, for every outcome, who it went to
-- (Destinataire), plus a "Justificatif n°". All optional — historic rows stay blank.
-- Both tables are already admin-only under RLS (0004_volunteer_accounts.sql), which
-- covers the new columns; personal data, so no public read policy.

alter table animal_intakes
  add column contact_name text,
  add column contact_phone text,
  add column contact_address text,
  add column document_ref text;

alter table animal_outcomes
  add column contact_name text,
  add column contact_phone text,
  add column contact_address text,
  add column document_ref text;
