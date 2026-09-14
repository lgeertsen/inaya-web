import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { vetVisitFormSchema } from "@/lib/validation";
import { getVetVisit, updateVetVisit, deleteVetVisit, computeVisitEndAt } from "@/lib/vet-visits";
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ visitId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { visitId } = await params;
  const body = await request.json();
  const parsed = vetVisitFormSchema.omit({ animalIds: true }).partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Keep the one-hour block intact whenever the start time moves.
  const values = parsed.data.scheduledAt
    ? { ...parsed.data, endAt: computeVisitEndAt(parsed.data.scheduledAt) }
    : parsed.data;

  let visit = await updateVetVisit(supabase, visitId, values);

  const scheduleChanged = parsed.data.scheduledAt || parsed.data.reason;
  if (visit.googleEventId && scheduleChanged) {
    const full = await getVetVisit(supabase, visitId);
    try {
      await updateCalendarEvent(visit.googleEventId, {
        reason: visit.reason,
        scheduledAt: visit.scheduledAt,
        endAt: visit.endAt,
        animalNames: full?.animals.map((a) => a.animalName) ?? [],
      });
      visit = await updateVetVisit(supabase, visitId, { googleSyncError: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      visit = await updateVetVisit(supabase, visitId, { googleSyncError: message });
    }
  }

  return NextResponse.json(visit);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ visitId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { visitId } = await params;
  const visit = await getVetVisit(supabase, visitId);

  if (visit?.googleEventId) {
    try {
      await deleteCalendarEvent(visit.googleEventId);
    } catch {
      // Best-effort — the visit is deleted below regardless of Calendar state.
    }
  }

  await deleteVetVisit(supabase, visitId);
  return NextResponse.json({ ok: true });
}
