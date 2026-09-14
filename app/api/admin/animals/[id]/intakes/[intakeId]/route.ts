import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteAnimalIntake } from "@/lib/animal-care";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; intakeId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { intakeId } = await params;
  await deleteAnimalIntake(supabase, intakeId);
  return NextResponse.json({ ok: true });
}
