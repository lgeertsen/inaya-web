import type { SupabaseClient } from "@supabase/supabase-js";

// A vet visit can cover several animals at once (vet_visits + vet_visit_animals,
// see supabase/migrations/0003_vet_visits.sql). Admin-only RLS, must never be
// surfaced on public pages. Google Calendar sync state lives on the visit
// (google_event_id / google_sync_error) — see lib/google-calendar.ts.

export type VetAppointmentStatus = "pending" | "completed" | "canceled";

// Vet visits always block exactly one hour — there's no end-time input in the
// UI. `scheduledAt` is a naive "YYYY-MM-DDTHH:mm" datetime-local string (no
// timezone); this does pure calendar arithmetic on the string via a
// timezone-neutral Date.UTC round-trip, rather than parsing it with `new
// Date()` directly (which would apply the server process's local timezone),
// so the block stays exactly one hour regardless of how the DB session
// timezone later interprets the stored value.
export function computeVisitEndAt(scheduledAt: string): string {
  const [datePart, timePart] = scheduledAt.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart ?? "00:00").split(":").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, hour, minute));
  d.setUTCHours(d.getUTCHours() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export interface VetVisit {
  id: string;
  scheduledAt: string;
  endAt: string;
  reason: string;
  status: VetAppointmentStatus;
  googleEventId: string | null;
  googleSyncError: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VetVisitAnimal {
  animalId: string;
  animalName: string;
  notes: string | null;
  followUpDate: string | null;
  followUpCompleted: boolean;
}

export interface VetVisitWithAnimals extends VetVisit {
  animals: VetVisitAnimal[];
}

export interface VetVisitForAnimal extends VetVisit {
  notes: string | null;
  followUpDate: string | null;
  followUpCompleted: boolean;
}

export interface VetVisitInsert {
  scheduledAt: string;
  endAt: string;
  reason: string;
  status?: VetAppointmentStatus;
  animalIds: string[];
}

export interface VetVisitUpdate {
  scheduledAt?: string;
  endAt?: string;
  reason?: string;
  status?: VetAppointmentStatus;
  googleEventId?: string | null;
  googleSyncError?: string | null;
}

export interface VetVisitAnimalUpdate {
  notes?: string | null;
  followUpDate?: string | null;
  followUpCompleted?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const VISIT_SELECT = "*, vet_visit_animals(animal_id, notes, follow_up_date, follow_up_completed, animals(name))";

function toVetVisit(row: Row): VetVisit {
  return {
    id: row.id,
    scheduledAt: row.scheduled_at,
    endAt: row.end_at,
    reason: row.reason,
    status: row.status,
    googleEventId: row.google_event_id,
    googleSyncError: row.google_sync_error,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toVetVisitWithAnimals(row: Row): VetVisitWithAnimals {
  const animalRows: Row[] = row.vet_visit_animals ?? [];
  return {
    ...toVetVisit(row),
    animals: animalRows.map((a: Row) => ({
      animalId: a.animal_id,
      animalName: a.animals?.name ?? "",
      notes: a.notes,
      followUpDate: a.follow_up_date,
      followUpCompleted: a.follow_up_completed,
    })),
  };
}

export async function listVetVisits(
  supabase: SupabaseClient,
  range: { from: string; to: string },
): Promise<VetVisitWithAnimals[]> {
  const { data, error } = await supabase
    .from("vet_visits")
    .select(VISIT_SELECT)
    .gte("scheduled_at", range.from)
    .lt("scheduled_at", range.to)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toVetVisitWithAnimals);
}

export async function getVetVisit(
  supabase: SupabaseClient,
  id: string,
): Promise<VetVisitWithAnimals | null> {
  const { data, error } = await supabase
    .from("vet_visits")
    .select(VISIT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toVetVisitWithAnimals(data) : null;
}

export async function listVetVisitsForAnimal(
  supabase: SupabaseClient,
  animalId: string,
): Promise<VetVisitForAnimal[]> {
  const { data, error } = await supabase
    .from("vet_visit_animals")
    .select("notes, follow_up_date, follow_up_completed, vet_visits(*)")
    .eq("animal_id", animalId);
  if (error) throw error;
  return (data ?? [])
    .map((row: Row) => ({
      ...toVetVisit(row.vet_visits),
      notes: row.notes,
      followUpDate: row.follow_up_date,
      followUpCompleted: row.follow_up_completed,
    }))
    .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1));
}

export async function countUpcomingVetVisits(
  supabase: SupabaseClient,
  fromIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("vet_visits")
    .select("id", { count: "exact", head: true })
    .gte("scheduled_at", fromIso)
    .neq("status", "canceled");
  if (error) throw error;
  return count ?? 0;
}

export async function createVetVisit(
  supabase: SupabaseClient,
  values: VetVisitInsert,
  createdBy: string,
): Promise<VetVisitWithAnimals> {
  const { data: visitId, error } = await supabase.rpc("create_vet_visit", {
    p_scheduled_at: values.scheduledAt,
    p_end_at: values.endAt,
    p_reason: values.reason,
    p_status: values.status ?? "pending",
    p_animal_ids: values.animalIds,
    p_created_by: createdBy,
  });
  if (error) throw error;

  const visit = await getVetVisit(supabase, visitId as string);
  if (!visit) throw new Error("Failed to load newly created vet visit");
  return visit;
}

export async function updateVetVisit(
  supabase: SupabaseClient,
  id: string,
  values: VetVisitUpdate,
): Promise<VetVisit> {
  const row: Record<string, unknown> = {};
  if (values.scheduledAt !== undefined) row.scheduled_at = values.scheduledAt;
  if (values.endAt !== undefined) row.end_at = values.endAt;
  if (values.reason !== undefined) row.reason = values.reason;
  if (values.status !== undefined) row.status = values.status;
  if (values.googleEventId !== undefined) row.google_event_id = values.googleEventId;
  if (values.googleSyncError !== undefined) row.google_sync_error = values.googleSyncError;

  const { data, error } = await supabase
    .from("vet_visits")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return toVetVisit(data);
}

export async function deleteVetVisit(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("vet_visits").delete().eq("id", id);
  if (error) throw error;
}

export async function updateVetVisitAnimal(
  supabase: SupabaseClient,
  visitId: string,
  animalId: string,
  values: VetVisitAnimalUpdate,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (values.notes !== undefined) row.notes = values.notes;
  if (values.followUpDate !== undefined) row.follow_up_date = values.followUpDate;
  if (values.followUpCompleted !== undefined) row.follow_up_completed = values.followUpCompleted;

  const { error } = await supabase
    .from("vet_visit_animals")
    .update(row)
    .eq("visit_id", visitId)
    .eq("animal_id", animalId);
  if (error) throw error;
}

export async function addAnimalToVisit(
  supabase: SupabaseClient,
  visitId: string,
  animalId: string,
): Promise<void> {
  const { error } = await supabase
    .from("vet_visit_animals")
    .insert({ visit_id: visitId, animal_id: animalId });
  if (error) throw error;
}

export async function removeAnimalFromVisit(
  supabase: SupabaseClient,
  visitId: string,
  animalId: string,
): Promise<void> {
  const { error } = await supabase
    .from("vet_visit_animals")
    .delete()
    .eq("visit_id", visitId)
    .eq("animal_id", animalId);
  if (error) throw error;
}
