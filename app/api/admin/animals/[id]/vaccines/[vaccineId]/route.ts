import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { animalVaccineFormSchema } from "@/lib/validation";
import { getAnimalVaccine, updateAnimalVaccine, deleteAnimalVaccine } from "@/lib/animal-care";
import { getAnimalById } from "@/lib/animals";
import { createVaccineReminderEvent, updateVaccineReminderEvent, deleteVaccineReminderEvent } from "@/lib/google-calendar";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vaccineId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { id, vaccineId } = await params;
  const body = await request.json();
  const parsed = animalVaccineFormSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let vaccine = await updateAnimalVaccine(supabase, vaccineId, parsed.data);

  const reminderFieldsChanged =
    parsed.data.followUpDate !== undefined ||
    parsed.data.followUpCompleted !== undefined ||
    parsed.data.name !== undefined;

  if (reminderFieldsChanged) {
    const shouldHaveReminder = vaccine.followUpDate && !vaccine.followUpCompleted;

    try {
      if (shouldHaveReminder) {
        const animal = await getAnimalById(supabase, id);
        const reminder = {
          animalName: animal?.name ?? "",
          vaccineName: vaccine.name,
          date: vaccine.followUpDate as string,
        };
        let eventId: string;
        if (vaccine.googleEventId) {
          await updateVaccineReminderEvent(vaccine.googleEventId, reminder);
          eventId = vaccine.googleEventId;
        } else {
          eventId = await createVaccineReminderEvent(reminder);
        }
        vaccine = await updateAnimalVaccine(supabase, vaccineId, {
          googleEventId: eventId,
          googleSyncError: null,
        });
      } else if (vaccine.googleEventId) {
        await deleteVaccineReminderEvent(vaccine.googleEventId);
        vaccine = await updateAnimalVaccine(supabase, vaccineId, {
          googleEventId: null,
          googleSyncError: null,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      vaccine = await updateAnimalVaccine(supabase, vaccineId, { googleSyncError: message });
    }
  }

  return NextResponse.json(vaccine);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; vaccineId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { vaccineId } = await params;
  const vaccine = await getAnimalVaccine(supabase, vaccineId);

  if (vaccine?.googleEventId) {
    try {
      await deleteVaccineReminderEvent(vaccine.googleEventId);
    } catch {
      // Best-effort — the vaccine row is deleted below regardless of Calendar state.
    }
  }

  await deleteAnimalVaccine(supabase, vaccineId);
  return NextResponse.json({ ok: true });
}
