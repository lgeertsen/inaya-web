import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { animalFormSchema } from "@/lib/validation";
import { updateAnimal, deleteAnimal } from "@/lib/animals";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = animalFormSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const animal = await updateAnimal(supabase, id, parsed.data);
  return NextResponse.json(animal);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { id } = await params;
  await deleteAnimal(supabase, id);
  return NextResponse.json({ ok: true });
}
