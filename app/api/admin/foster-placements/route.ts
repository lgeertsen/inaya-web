import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { fosterPlacementFormSchema } from "@/lib/validation";
import { createFosterPlacement, hasPgErrorCode, PG_UNIQUE_VIOLATION } from "@/lib/foster";

export async function POST(request: NextRequest) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const body = await request.json();
  const parsed = fosterPlacementFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await createFosterPlacement(supabase, parsed.data, user.id);
  } catch (error) {
    // The animal already has an open placement.
    if (hasPgErrorCode(error, PG_UNIQUE_VIOLATION)) {
      return NextResponse.json({ error: "already_placed" }, { status: 409 });
    }
    throw error;
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
