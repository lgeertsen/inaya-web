import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { vetVisitFormSchema } from "@/lib/validation";
import { createVetVisit, updateVetVisit, computeVisitEndAt } from "@/lib/vet-visits";
import { createCalendarEvent } from "@/lib/google-calendar";

export async function POST(request: NextRequest) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const body = await request.json();
  const parsed = vetVisitFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let visit = await createVetVisit(
    supabase,
    { ...parsed.data, endAt: computeVisitEndAt(parsed.data.scheduledAt) },
    user.id,
  );

  try {
    const eventId = await createCalendarEvent({
      reason: visit.reason,
      scheduledAt: visit.scheduledAt,
      endAt: visit.endAt,
      animalNames: visit.animals.map((a) => a.animalName),
    });
    await updateVetVisit(supabase, visit.id, { googleEventId: eventId, googleSyncError: null });
    visit = { ...visit, googleEventId: eventId, googleSyncError: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await updateVetVisit(supabase, visit.id, { googleSyncError: message });
    visit = { ...visit, googleSyncError: message };
  }

  return NextResponse.json(visit, { status: 201 });
}
