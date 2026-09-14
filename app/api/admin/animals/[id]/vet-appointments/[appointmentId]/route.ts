import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { animalVetAppointmentFormSchema } from "@/lib/validation";
import { updateAnimalVetAppointment, deleteAnimalVetAppointment } from "@/lib/animal-care";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appointmentId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { appointmentId } = await params;
  const body = await request.json();
  const parsed = animalVetAppointmentFormSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const appointment = await updateAnimalVetAppointment(supabase, appointmentId, parsed.data);
  return NextResponse.json(appointment);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; appointmentId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { appointmentId } = await params;
  await deleteAnimalVetAppointment(supabase, appointmentId);
  return NextResponse.json({ ok: true });
}
