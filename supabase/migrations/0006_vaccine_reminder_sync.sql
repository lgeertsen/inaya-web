-- Vaccine follow-up reminders sync to a separate "Vaccins" Google Calendar
-- (distinct from the "Veto" calendar vet_visits sync to — see
-- lib/google-calendar.ts). Same sync-state shape as vet_visits
-- (google_event_id / google_sync_error, see 0003_vet_visits.sql); no RLS
-- change needed, the existing "admin full access vaccines" policy from
-- 0004_volunteer_accounts.sql already covers these columns.

alter table animal_vaccines
  add column google_event_id text,
  add column google_sync_error text;
