import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";
import { getSiteImageSlot, SITE_IMAGE_BUCKET, SITE_IMAGES_TAG } from "@/lib/site-images";

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 82;
// Cap on the original file, before it is shrunk to WebP — phone photos are a few MB.
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

type Context = { params: Promise<{ slot: string }> };

/** Makes the public (statically generated) pages pick up the change on their next visit. */
function revalidatePublicSite() {
  revalidateTag(SITE_IMAGES_TAG, { expire: 0 });
  revalidatePath("/[locale]", "layout");
}

// Sets or replaces the photo for one slot. Each upload gets a fresh storage
// path (never overwriting the old object) so browser and image-optimizer caches
// can't keep serving the previous photo.
export async function POST(request: NextRequest, { params }: Context) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { slot } = await params;
  if (!getSiteImageSlot(slot)) {
    return NextResponse.json({ error: "unknown_slot" }, { status: 404 });
  }

  const file = (await request.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  let webpBuffer: Buffer;
  try {
    webpBuffer = await sharp(Buffer.from(await file.arrayBuffer()))
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
    return NextResponse.json({ error: "invalid_image" }, { status: 400 });
  }

  const { data: previous } = await supabase
    .from("site_images")
    .select("storage_path")
    .eq("slot_id", slot)
    .maybeSingle();

  const path = `${slot}/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from(SITE_IMAGE_BUCKET)
    .upload(path, webpBuffer, { contentType: "image/webp" });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // A new photo starts centered: the old focal point was picked for a different picture.
  const { error: rowError } = await supabase.from("site_images").upsert(
    { slot_id: slot, storage_path: path, focal_x: 0.5, focal_y: 0.5, updated_by: user.id },
    { onConflict: "slot_id" },
  );
  if (rowError) {
    await supabase.storage.from(SITE_IMAGE_BUCKET).remove([path]);
    return NextResponse.json({ error: rowError.message }, { status: 500 });
  }

  if (previous?.storage_path) {
    await supabase.storage.from(SITE_IMAGE_BUCKET).remove([previous.storage_path]);
  }

  revalidatePublicSite();
  return NextResponse.json({ ok: true });
}

// Moves the point of the photo that stays visible when it is cropped into the slot's box.
export async function PATCH(request: NextRequest, { params }: Context) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { slot } = await params;
  if (!getSiteImageSlot(slot)) {
    return NextResponse.json({ error: "unknown_slot" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const focalX = body?.focalX;
  const focalY = body?.focalY;
  if (
    typeof focalX !== "number" || typeof focalY !== "number" ||
    !(focalX >= 0 && focalX <= 1) || !(focalY >= 0 && focalY <= 1)
  ) {
    return NextResponse.json({ error: "invalid_focal_point" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("site_images")
    .update({ focal_x: focalX, focal_y: focalY, updated_by: user.id })
    .eq("slot_id", slot)
    .select("slot_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });

  revalidatePublicSite();
  return NextResponse.json({ ok: true });
}

// Removes the photo, so the slot goes back to showing its placeholder.
export async function DELETE(_request: NextRequest, { params }: Context) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { slot } = await params;
  if (!getSiteImageSlot(slot)) {
    return NextResponse.json({ error: "unknown_slot" }, { status: 404 });
  }

  const { data: row } = await supabase
    .from("site_images")
    .select("storage_path")
    .eq("slot_id", slot)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { error } = await supabase.from("site_images").delete().eq("slot_id", slot);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.storage.from(SITE_IMAGE_BUCKET).remove([row.storage_path]);

  revalidatePublicSite();
  return NextResponse.json({ ok: true });
}
