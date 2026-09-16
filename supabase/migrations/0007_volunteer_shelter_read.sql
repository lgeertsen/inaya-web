-- Volunteers may only browse/photograph animals currently at the shelter.
-- animal_internal_details.in_shelter is what the app filters on, but its RLS
-- (0002, tightened in 0004) is admin-only "for all", so a volunteer session
-- silently gets zero rows back — the app can't even check in_shelter to
-- enforce the restriction. Split it the same way 0004 already split
-- animals/animal_photos: staff can read, only admins can write.

drop policy "admin full access internal details" on animal_internal_details;

create policy "staff read internal details" on animal_internal_details
  for select using (auth.role() = 'authenticated');

create policy "admin write internal details" on animal_internal_details
  for insert with check (public.current_role() = 'admin');

create policy "admin update internal details" on animal_internal_details
  for update using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "admin delete internal details" on animal_internal_details
  for delete using (public.current_role() = 'admin');
