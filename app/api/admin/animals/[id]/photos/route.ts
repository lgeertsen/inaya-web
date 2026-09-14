import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { addAnimalPhoto, deleteAnimalPhoto, PHOTO_BUCKET } from "@/lib/animals";

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
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${id}/${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, arrayBuffer, { contentType: file.type });

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
