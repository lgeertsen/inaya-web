import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { vetVisitAddAnimalSchema } from "@/lib/validation";
import { addAnimalToVisit } from "@/lib/vet-visits";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ visitId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { visitId } = await params;
  const body = await request.json();
  const parsed = vetVisitAddAnimalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await addAnimalToVisit(supabase, visitId, parsed.data.animalId);
  return NextResponse.json({ ok: true }, { status: 201 });
}
