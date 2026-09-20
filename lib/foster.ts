import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnimalSpecies } from "./animals";

// Foster families and the animals placed with them (see
// supabase/migrations/0017_foster.sql). Admin-only RLS: family contact details
// are personal data and must never be surfaced on public pages. The one
// volunteer-facing read is getMyFosterAnimalIds(), which only exposes animal ids.

export type FosterFamilyStatus = "active" | "paused" | "inactive";
export type FosterEndReason = "returned_to_shelter" | "adopted" | "deceased" | "other";
export type FosterCheckinType = "call" | "visit" | "message";

export interface FosterFamily {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  capacity: number;
  acceptedSpecies: AnimalSpecies[];
  status: FosterFamilyStatus;
  notes: string | null;
  /** The volunteer login of this household, if any. */
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FosterFamilyInsert {
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  capacity: number;
  acceptedSpecies: AnimalSpecies[];
  status: FosterFamilyStatus;
  notes?: string | null;
  userId?: string | null;
}

export interface FosterFamilyWithLoad extends FosterFamily {
  /** Animals currently placed with this family. */
  currentCount: number;
  /** Placements ever recorded, current or past — a family with any can't be deleted. */
  totalPlacements: number;
  overdueCheckinCount: number;
}

export interface FosterCheckin {
  id: string;
  placementId: string;
  occurredOn: string;
  type: FosterCheckinType;
  notes: string | null;
  createdAt: string;
}

export interface FosterCheckinInsert {
  occurredOn: string;
  type: FosterCheckinType;
  notes?: string | null;
}

export interface FosterPlacement {
  id: string;
  animalId: string;
  animalName: string;
  animalSpecies: AnimalSpecies;
  familyId: string;
  familyName: string;
  startedOn: string;
  endedOn: string | null;
  endReason: FosterEndReason | null;
  notes: string | null;
  checkinIntervalDays: number;
  /** Newest first. */
  checkins: FosterCheckin[];
  lastCheckinOn: string | null;
  /** Null once the placement has ended. */
  nextCheckinDue: string | null;
}

export interface FosterPlacementInsert {
  animalId: string;
  familyId: string;
  startedOn: string;
  checkinIntervalDays: number;
  notes?: string | null;
}

export interface FosterPlacementEnd {
  endedOn: string;
  endReason: FosterEndReason;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

/** Postgres error codes the foster routes turn into a 409 instead of a 500. */
export const PG_UNIQUE_VIOLATION = "23505";
export const PG_FOREIGN_KEY_VIOLATION = "23503";

export function hasPgErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === code;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD + N days, as pure calendar arithmetic (no timezone involved). */
export function addDaysToDateString(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) + days * DAY_MS).toISOString().slice(0, 10);
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** The check-in due date: `intervalDays` after the last check-in, or after the placement start if there is none. */
export function computeNextCheckinDue(
  startedOn: string,
  lastCheckinOn: string | null,
  intervalDays: number,
): string {
  return addDaysToDateString(lastCheckinOn ?? startedOn, intervalDays);
}

export function isCheckinOverdue(placement: Pick<FosterPlacement, "endedOn" | "nextCheckinDue">): boolean {
  return placement.endedOn === null && placement.nextCheckinDue !== null && placement.nextCheckinDue < todayDateString();
}

function toFamily(row: Row): FosterFamily {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    city: row.city,
    capacity: row.capacity,
    acceptedSpecies: row.accepted_species ?? [],
    status: row.status,
    notes: row.notes,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCheckin(row: Row): FosterCheckin {
  return {
    id: row.id,
    placementId: row.placement_id,
    occurredOn: row.occurred_on,
    type: row.type,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function toPlacement(row: Row): FosterPlacement {
  const checkins: FosterCheckin[] = (row.foster_checkins ?? [])
    .map(toCheckin)
    .sort((a: FosterCheckin, b: FosterCheckin) =>
      a.occurredOn === b.occurredOn ? (a.createdAt < b.createdAt ? 1 : -1) : a.occurredOn < b.occurredOn ? 1 : -1,
    );
  const lastCheckinOn = checkins[0]?.occurredOn ?? null;
  return {
    id: row.id,
    animalId: row.animal_id,
    animalName: row.animals?.name ?? "",
    animalSpecies: row.animals?.species ?? "other",
    familyId: row.foster_family_id,
    familyName: row.foster_families?.name ?? "",
    startedOn: row.started_on,
    endedOn: row.ended_on,
    endReason: row.end_reason,
    notes: row.notes,
    checkinIntervalDays: row.checkin_interval_days,
    checkins,
    lastCheckinOn,
    nextCheckinDue: row.ended_on
      ? null
      : computeNextCheckinDue(row.started_on, lastCheckinOn, row.checkin_interval_days),
  };
}

const PLACEMENT_SELECT =
  "*, animals(name, species), foster_families(name), foster_checkins(id, placement_id, occurred_on, type, notes, created_at)";

// Families ------------------------------------------------------------------------

export async function listFosterFamilies(supabase: SupabaseClient): Promise<FosterFamilyWithLoad[]> {
  const { data, error } = await supabase
    .from("foster_families")
    .select("*, foster_placements(id, started_on, ended_on, checkin_interval_days, foster_checkins(occurred_on))")
    .order("name", { ascending: true });
  if (error) throw error;

  const today = todayDateString();
  return (data ?? []).map((row: Row) => {
    const placements: Row[] = row.foster_placements ?? [];
    const open = placements.filter((p) => p.ended_on === null);
    const overdue = open.filter((p) => {
      const last = (p.foster_checkins ?? [])
        .map((c: Row) => c.occurred_on as string)
        .sort()
        .pop();
      return computeNextCheckinDue(p.started_on, last ?? null, p.checkin_interval_days) < today;
    });
    return {
      ...toFamily(row),
      currentCount: open.length,
      totalPlacements: placements.length,
      overdueCheckinCount: overdue.length,
    };
  });
}

export async function getFosterFamily(supabase: SupabaseClient, id: string): Promise<FosterFamily | null> {
  const { data, error } = await supabase.from("foster_families").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toFamily(data) : null;
}

function familyToRow(values: Partial<FosterFamilyInsert>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (values.name !== undefined) row.name = values.name;
  if (values.contactName !== undefined) row.contact_name = values.contactName;
  if (values.phone !== undefined) row.phone = values.phone;
  if (values.email !== undefined) row.email = values.email;
  if (values.city !== undefined) row.city = values.city;
  if (values.capacity !== undefined) row.capacity = values.capacity;
  if (values.acceptedSpecies !== undefined) row.accepted_species = values.acceptedSpecies;
  if (values.status !== undefined) row.status = values.status;
  if (values.notes !== undefined) row.notes = values.notes;
  if (values.userId !== undefined) row.user_id = values.userId;
  return row;
}

export async function createFosterFamily(
  supabase: SupabaseClient,
  values: FosterFamilyInsert,
): Promise<FosterFamily> {
  const { data, error } = await supabase.from("foster_families").insert(familyToRow(values)).select("*").single();
  if (error) throw error;
  return toFamily(data);
}

export async function updateFosterFamily(
  supabase: SupabaseClient,
  id: string,
  values: Partial<FosterFamilyInsert>,
): Promise<FosterFamily> {
  const { data, error } = await supabase
    .from("foster_families")
    .update(familyToRow(values))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return toFamily(data);
}

export async function deleteFosterFamily(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("foster_families").delete().eq("id", id);
  if (error) throw error;
}

// Placements ----------------------------------------------------------------------

export async function listPlacementsForFamily(
  supabase: SupabaseClient,
  familyId: string,
): Promise<FosterPlacement[]> {
  const { data, error } = await supabase
    .from("foster_placements")
    .select(PLACEMENT_SELECT)
    .eq("foster_family_id", familyId)
    .order("started_on", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toPlacement);
}

export async function listPlacementsForAnimal(
  supabase: SupabaseClient,
  animalId: string,
): Promise<FosterPlacement[]> {
  const { data, error } = await supabase
    .from("foster_placements")
    .select(PLACEMENT_SELECT)
    .eq("animal_id", animalId)
    .order("started_on", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toPlacement);
}

/** Ids of animals that currently have an open placement (i.e. can't be placed again). */
export async function listPlacedAnimalIds(supabase: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await supabase.from("foster_placements").select("animal_id").is("ended_on", null);
  if (error) throw error;
  return new Set((data ?? []).map((row: Row) => row.animal_id as string));
}

export async function createFosterPlacement(
  supabase: SupabaseClient,
  values: FosterPlacementInsert,
  recordedBy: string,
): Promise<void> {
  const { error } = await supabase.from("foster_placements").insert({
    animal_id: values.animalId,
    foster_family_id: values.familyId,
    started_on: values.startedOn,
    checkin_interval_days: values.checkinIntervalDays,
    notes: values.notes,
    recorded_by: recordedBy,
  });
  if (error) throw error;
}

export async function endFosterPlacement(
  supabase: SupabaseClient,
  placementId: string,
  values: FosterPlacementEnd,
): Promise<void> {
  const { error } = await supabase
    .from("foster_placements")
    .update({ ended_on: values.endedOn, end_reason: values.endReason })
    .eq("id", placementId)
    .is("ended_on", null);
  if (error) throw error;
}

export async function deleteFosterPlacement(supabase: SupabaseClient, placementId: string): Promise<void> {
  const { error } = await supabase.from("foster_placements").delete().eq("id", placementId);
  if (error) throw error;
}

/** Open placements with their check-ins, for the overview's "À traiter" panel. */
export async function listOpenPlacements(supabase: SupabaseClient): Promise<FosterPlacement[]> {
  const { data, error } = await supabase
    .from("foster_placements")
    .select(PLACEMENT_SELECT)
    .is("ended_on", null)
    .order("started_on", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toPlacement);
}

// Check-ins -----------------------------------------------------------------------

export async function createFosterCheckin(
  supabase: SupabaseClient,
  placementId: string,
  values: FosterCheckinInsert,
  recordedBy: string,
): Promise<void> {
  const { error } = await supabase.from("foster_checkins").insert({
    placement_id: placementId,
    occurred_on: values.occurredOn,
    type: values.type,
    notes: values.notes,
    recorded_by: recordedBy,
  });
  if (error) throw error;
}

export async function deleteFosterCheckin(supabase: SupabaseClient, checkinId: string): Promise<void> {
  const { error } = await supabase.from("foster_checkins").delete().eq("id", checkinId);
  if (error) throw error;
}

// Volunteer-facing ----------------------------------------------------------------

/** Ids of the animals the signed-in volunteer currently fosters (empty if they have no linked family). */
export async function getMyFosterAnimalIds(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.rpc("my_foster_animal_ids");
  if (error) throw error;
  return (data ?? []) as string[];
}
