import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { animalFormSchema } from "@/lib/validation";
import { createAnimal } from "@/lib/animals";

export async function POST(request: NextRequest) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const body = await request.json();
  const parsed = animalFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const animal = await createAnimal(supabase, parsed.data, user.id);
  return NextResponse.json(animal, { status: 201 });
}
