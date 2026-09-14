import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { animalTreatmentFormSchema } from "@/lib/validation";
import { updateAnimalTreatment, deleteAnimalTreatment } from "@/lib/animal-care";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; treatmentId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { treatmentId } = await params;
  const body = await request.json();
  const parsed = animalTreatmentFormSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const treatment = await updateAnimalTreatment(supabase, treatmentId, parsed.data);
  return NextResponse.json(treatment);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; treatmentId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { treatmentId } = await params;
  await deleteAnimalTreatment(supabase, treatmentId);
  return NextResponse.json({ ok: true });
}
