import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { fosterFamilyFormSchema } from "@/lib/validation";
import {
  deleteFosterFamily,
  hasPgErrorCode,
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
  updateFosterFamily,
} from "@/lib/foster";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { familyId } = await params;
  const body = await request.json();
  const parsed = fosterFamilyFormSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const family = await updateFosterFamily(supabase, familyId, parsed.data);
    return NextResponse.json(family);
  } catch (error) {
    if (hasPgErrorCode(error, PG_UNIQUE_VIOLATION)) {
      return NextResponse.json({ error: "account_already_linked" }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { familyId } = await params;
  try {
    await deleteFosterFamily(supabase, familyId);
  } catch (error) {
    // A family with placement history is kept (set it to "inactive" instead).
    if (hasPgErrorCode(error, PG_FOREIGN_KEY_VIOLATION)) {
      return NextResponse.json({ error: "has_placements" }, { status: 409 });
    }
    throw error;
  }
  return NextResponse.json({ ok: true });
}
