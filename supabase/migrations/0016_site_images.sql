-- Admin-uploadable photos for the public site's image placeholders. Each row
-- fills one named slot (see lib/site-images.ts for the registry, e.g.
-- 'home.hero', 'help.gift'); a slot with no row keeps showing its placeholder,
-- so deleting a row restores it. Rows whose slot no longer exists in the
-- registry are simply ignored at runtime.

create table site_images (
  slot_id text primary key,
  storage_path text not null,
  -- Normalized (0..1) point that stays visible when the photo is cropped into
  -- the slot's fixed aspect ratio — same idea as animal_photos (0009).
  focal_x numeric(4, 3) not null default 0.5
    check (focal_x >= 0 and focal_x <= 1),
  focal_y numeric(4, 3) not null default 0.5
    check (focal_y >= 0 and focal_y <= 1),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table site_images enable row level security;

-- The public site reads every slot on each (static) render, before any session
-- exists, so reading is open to everyone — same as site_texts.
create policy "public read site images" on site_images
  for select using (true);

create policy "admin insert site images" on site_images
  for insert with check (public.current_role() = 'admin');

create policy "admin update site images" on site_images
  for update using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "admin delete site images" on site_images
  for delete using (public.current_role() = 'admin');

create trigger site_images_set_updated_at
  before update on site_images
  for each row execute function set_updated_at();

-- Storage ------------------------------------------------------------------
-- Public-read bucket. Unlike animal-photos (0001), writes are admin-only, not
-- any authenticated user: volunteers must not be able to replace site photos.
-- The upload route converts everything to WebP, so the bucket only accepts that.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 5242880, array['image/webp'])
on conflict (id) do nothing;

create policy "public read site images" on storage.objects
  for select using (bucket_id = 'site-images');

create policy "admin insert site images" on storage.objects
  for insert with check (bucket_id = 'site-images' and public.current_role() = 'admin');

create policy "admin update site images" on storage.objects
  for update using (bucket_id = 'site-images' and public.current_role() = 'admin')
  with check (bucket_id = 'site-images' and public.current_role() = 'admin');

create policy "admin delete site images" on storage.objects
  for delete using (bucket_id = 'site-images' and public.current_role() = 'admin');
