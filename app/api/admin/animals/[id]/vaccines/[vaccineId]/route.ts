import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { animalVaccineFormSchema } from "@/lib/validation";
import { updateAnimalVaccine, deleteAnimalVaccine } from "@/lib/animal-care";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vaccineId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { vaccineId } = await params;
  const body = await request.json();
  const parsed = animalVaccineFormSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const vaccine = await updateAnimalVaccine(supabase, vaccineId, parsed.data);
  return NextResponse.json(vaccine);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; vaccineId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { vaccineId } = await params;
  await deleteAnimalVaccine(supabase, vaccineId);
  return NextResponse.json({ ok: true });
}
