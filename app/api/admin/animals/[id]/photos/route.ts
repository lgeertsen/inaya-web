import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";
import { addAnimalPhoto, deleteAnimalPhoto, PHOTO_BUCKET } from "@/lib/animals";

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 80;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { id } = await params;
  const formData = await request.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  const { count } = await supabase
    .from("animal_photos")
    .select("id", { count: "exact", head: true })
    .eq("animal_id", id);

  let position = count ?? 0;

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

    await addAnimalPhoto(supabase, id, path, position);
    position += 1;
  }

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
