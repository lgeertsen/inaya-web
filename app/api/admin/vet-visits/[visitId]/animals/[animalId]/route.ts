import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { vetVisitAnimalFormSchema } from "@/lib/validation";
import { updateVetVisitAnimal, removeAnimalFromVisit } from "@/lib/vet-visits";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ visitId: string; animalId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { visitId, animalId } = await params;
  const body = await request.json();
  const parsed = vetVisitAnimalFormSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await updateVetVisitAnimal(supabase, visitId, animalId, parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ visitId: string; animalId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { visitId, animalId } = await params;
  await removeAnimalFromVisit(supabase, visitId, animalId);
  return NextResponse.json({ ok: true });
}
