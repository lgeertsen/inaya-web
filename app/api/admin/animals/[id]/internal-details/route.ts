import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { animalInternalDetailsFormSchema } from "@/lib/validation";
import { updateAnimalInternalDetails } from "@/lib/animal-care";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = animalInternalDetailsFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const details = await updateAnimalInternalDetails(supabase, id, parsed.data);
  return NextResponse.json(details);
}
