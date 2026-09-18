import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin, requireStaff } from "@/lib/auth";
import {
  addAnimalPhoto,
  deleteAnimalPhoto,
  setFeaturedPhoto,
  setPhotoFocalPoint,
  PHOTO_BUCKET,
} from "@/lib/animals";

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 80;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, supabase, response } = await requireStaff();
  if (!user) return response;

  const { id } = await params;

  // Volunteers may only add photos for animals currently at the shelter —
  // re-checked here (not just in the UI) since this endpoint takes an animal
  // id directly and the list page's filtering can't stop a raw request.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    const { data: details } = await supabase
      .from("animal_internal_details")
      .select("in_shelter")
      .eq("animal_id", id)
      .maybeSingle();
    if (!details?.in_shelter) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Powers the "Dernière activité" column on /admin/accounts — see
    // 0008_volunteer_last_active.sql for why this is column-grant-restricted.
    await supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", user.id);
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  const { count } = await supabase
    .from("animal_photos")
    .select("id", { count: "exact", head: true })
    .eq("animal_id", id);

  let position = count ?? 0;
  const hadNoPhotos = position === 0;

  for (const file of files) {
    const path = `${id}/${crypto.randomUUID()}.webp`;

    let webpBuffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      webpBuffer = await sharp(Buffer.from(arrayBuffer))
        .rotate()
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    } catch {
      return NextResponse.json(
        { error: `Could not process image: ${file.name}` },
        { status: 400 },
      );
    }

    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, webpBuffer, { contentType: "image/webp" });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    await addAnimalPhoto(supabase, id, path, position, user.id, hadNoPhotos && position === 0);
    position += 1;
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { id } = await params;
  const { photoId, focalX, focalY } = await request.json();
  if (!photoId) {
    return NextResponse.json({ error: "missing_photo_id" }, { status: 400 });
  }

  if (focalX !== undefined || focalY !== undefined) {
    if (
      typeof focalX !== "number" || typeof focalY !== "number" ||
      focalX < 0 || focalX > 1 || focalY < 0 || focalY > 1
    ) {
      return NextResponse.json({ error: "invalid_focal_point" }, { status: 400 });
    }
    await setPhotoFocalPoint(supabase, id, photoId, focalX, focalY);
    return NextResponse.json({ ok: true });
  }

  await setFeaturedPhoto(supabase, id, photoId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;
  await params;

  const photoId = request.nextUrl.searchParams.get("photoId");
  if (!photoId) {
    return NextResponse.json({ error: "missing_photo_id" }, { status: 400 });
  }

  const { data: photo, error } = await supabase
    .from("animal_photos")
    .select("storage_path")
    .eq("id", photoId)
    .maybeSingle();

  if (error || !photo) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await deleteAnimalPhoto(supabase, photoId, photo.storage_path);
  return NextResponse.json({ ok: true });
}
