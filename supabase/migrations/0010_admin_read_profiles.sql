-- Admins need to read other users' profiles (specifically: which accounts
-- are volunteers) to power the "recent volunteer photos" dashboard card,
-- which distinguishes photos uploaded by volunteers from an admin's own
-- edits. The only existing policy ("read own profile", 0004) restricts
-- every user to id = auth.uid(), so an admin's regular session currently
-- can't see anyone else's role. This adds a read path for admins only;
-- volunteers keep their existing own-profile-only access.

create policy "admin read profiles" on profiles
  for select using (public.current_role() = 'admin');
