import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAnimalVaccine, updateAnimalVaccine } from "@/lib/animal-care";
import { getAnimalById } from "@/lib/animals";
import { createVaccineReminderEvent, updateVaccineReminderEvent } from "@/lib/google-calendar";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; vaccineId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { id, vaccineId } = await params;
  const vaccine = await getAnimalVaccine(supabase, vaccineId);
  if (!vaccine) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!vaccine.followUpDate) {
    return NextResponse.json({ error: "no_follow_up_date" }, { status: 400 });
  }

  const animal = await getAnimalById(supabase, id);
  const reminder = {
    animalName: animal?.name ?? "",
    vaccineName: vaccine.name,
    date: vaccine.followUpDate,
  };

  try {
    let eventId: string;
    if (vaccine.googleEventId) {
      await updateVaccineReminderEvent(vaccine.googleEventId, reminder);
      eventId = vaccine.googleEventId;
    } else {
      eventId = await createVaccineReminderEvent(reminder);
    }
    const updated = await updateAnimalVaccine(supabase, vaccineId, {
      googleEventId: eventId,
      googleSyncError: null,
    });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const updated = await updateAnimalVaccine(supabase, vaccineId, { googleSyncError: message });
    return NextResponse.json(updated, { status: 502 });
  }
}
