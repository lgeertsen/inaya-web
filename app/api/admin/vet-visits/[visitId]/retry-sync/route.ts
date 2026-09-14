import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getVetVisit, updateVetVisit } from "@/lib/vet-visits";
import { createCalendarEvent, updateCalendarEvent } from "@/lib/google-calendar";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ visitId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { visitId } = await params;
  const visit = await getVetVisit(supabase, visitId);
  if (!visit) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const eventInput = {
    reason: visit.reason,
    scheduledAt: visit.scheduledAt,
    endAt: visit.endAt,
    animalNames: visit.animals.map((a) => a.animalName),
  };

  try {
    let eventId: string;
    if (visit.googleEventId) {
      await updateCalendarEvent(visit.googleEventId, eventInput);
      eventId = visit.googleEventId;
    } else {
      eventId = await createCalendarEvent(eventInput);
    }
    const updated = await updateVetVisit(supabase, visitId, {
      googleEventId: eventId,
      googleSyncError: null,
    });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const updated = await updateVetVisit(supabase, visitId, { googleSyncError: message });
    return NextResponse.json(updated, { status: 502 });
  }
}
