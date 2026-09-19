-- Admin-editable website texts. i18n/messages/{fr,en}.json stay the shipped
-- defaults; this table holds only the strings an admin has overridden from
-- /admin/texts. Each row is one leaf string, addressed by its dotted path in
-- the messages file (e.g. 'home.title', 'adopt.steps.2'). Deleting a row
-- restores the shipped copy. Rows whose key no longer exists in the JSON
-- (after a rename/removal) are simply ignored at runtime.

create table site_texts (
  locale text not null check (locale in ('fr', 'en')),
  key text not null,
  value text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (locale, key)
);

alter table site_texts enable row level security;

-- The public site reads every override on each (static) render, before any
-- session exists, so reading is open to everyone — same as published animals.
create policy "public read site texts" on site_texts
  for select using (true);

create policy "admin insert site texts" on site_texts
  for insert with check (public.current_role() = 'admin');

create policy "admin update site texts" on site_texts
  for update using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "admin delete site texts" on site_texts
  for delete using (public.current_role() = 'admin');

create trigger site_texts_set_updated_at
  before update on site_texts
  for each row execute function set_updated_at();
