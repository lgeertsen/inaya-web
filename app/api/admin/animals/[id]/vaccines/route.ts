import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { animalVaccineFormSchema } from "@/lib/validation";
import { createAnimalVaccine, updateAnimalVaccine } from "@/lib/animal-care";
import { getAnimalById } from "@/lib/animals";
import { createVaccineReminderEvent } from "@/lib/google-calendar";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = animalVaccineFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let vaccine = await createAnimalVaccine(supabase, id, parsed.data);

  if (vaccine.followUpDate && !vaccine.followUpCompleted) {
    const animal = await getAnimalById(supabase, id);
    try {
      const eventId = await createVaccineReminderEvent({
        animalName: animal?.name ?? "",
        vaccineName: vaccine.name,
        date: vaccine.followUpDate,
      });
      vaccine = await updateAnimalVaccine(supabase, vaccine.id, {
        googleEventId: eventId,
        googleSyncError: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      vaccine = await updateAnimalVaccine(supabase, vaccine.id, { googleSyncError: message });
    }
  }

  return NextResponse.json(vaccine, { status: 201 });
}
