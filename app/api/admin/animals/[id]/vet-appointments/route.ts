import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { animalVetAppointmentFormSchema } from "@/lib/validation";
import { createAnimalVetAppointment } from "@/lib/animal-care";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = animalVetAppointmentFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const appointment = await createAnimalVetAppointment(supabase, id, parsed.data);
  return NextResponse.json(appointment, { status: 201 });
}
