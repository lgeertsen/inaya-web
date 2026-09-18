-- Focal point for non-destructive photo cropping: normalized (0..1) coordinates
-- into the stored image. Display sites render `object-position: {x*100}% {y*100}%`
-- from these instead of the implicit center default, so the same original photo
-- crops correctly across the different fixed aspect-ratio containers it's shown in
-- (4:5 cards, square thumbnails). Defaults to center; no RLS changes needed, the
-- existing "admin update photos" policy on animal_photos is an unqualified
-- column-wildcard `for update` policy that already covers these columns.
alter table animal_photos
  add column focal_x numeric(4, 3) not null default 0.5
    check (focal_x >= 0 and focal_x <= 1),
  add column focal_y numeric(4, 3) not null default 0.5
    check (focal_y >= 0 and focal_y <= 1);
