import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteAnimalOutcome } from "@/lib/animal-care";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; outcomeId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { outcomeId } = await params;
  await deleteAnimalOutcome(supabase, outcomeId);
  return NextResponse.json({ ok: true });
}
