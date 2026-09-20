import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { fosterCheckinFormSchema } from "@/lib/validation";
import { createFosterCheckin } from "@/lib/foster";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ placementId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { placementId } = await params;
  const body = await request.json();
  const parsed = fosterCheckinFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await createFosterCheckin(supabase, placementId, parsed.data, user.id);
  return NextResponse.json({ ok: true }, { status: 201 });
}
