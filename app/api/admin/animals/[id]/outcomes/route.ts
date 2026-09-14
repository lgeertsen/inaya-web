import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { animalOutcomeFormSchema } from "@/lib/validation";
import { createAnimalOutcome } from "@/lib/animal-care";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = animalOutcomeFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const outcome = await createAnimalOutcome(supabase, id, parsed.data, user.id);
  return NextResponse.json(outcome, { status: 201 });
}
