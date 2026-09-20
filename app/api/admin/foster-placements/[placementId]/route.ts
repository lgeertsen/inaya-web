import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { fosterPlacementEndSchema } from "@/lib/validation";
import { deleteFosterPlacement, endFosterPlacement } from "@/lib/foster";

// PATCH ends the placement (the animal leaves the family).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ placementId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { placementId } = await params;
  const body = await request.json();
  const parsed = fosterPlacementEndSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await endFosterPlacement(supabase, placementId, parsed.data);
  return NextResponse.json({ ok: true });
}

// DELETE removes a placement recorded by mistake (and its check-ins).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ placementId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { placementId } = await params;
  await deleteFosterPlacement(supabase, placementId);
  return NextResponse.json({ ok: true });
}
