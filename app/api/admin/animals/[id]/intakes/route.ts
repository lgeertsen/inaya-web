import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { animalIntakeFormSchema } from "@/lib/validation";
import { createAnimalIntake } from "@/lib/animal-care";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = animalIntakeFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const intake = await createAnimalIntake(supabase, id, parsed.data, user.id);
  return NextResponse.json(intake, { status: 201 });
}
