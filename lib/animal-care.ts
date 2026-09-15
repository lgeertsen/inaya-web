import type { SupabaseClient } from "@supabase/supabase-js";

// Internal shelter-operations data for an animal: identity/status fields plus
// intake/outcome history, vaccines, and treatments. Vet visits live in
// lib/vet-visits.ts (they can span multiple animals). All of this lives in
// tables with admin-only RLS (see supabase/migrations/0002_*, 0003_*) and
// must never be surfaced on public pages.

export type AnimalIntakeReason =
  | "stray"
  | "police_surrender"
  | "born_in_care"
  | "shelter_transfer"
  | "association_transfer"
  | "owner_surrender"
  | "abandoned"
  | "cruelty_seizure";

export type AnimalOutcomeReason =
  | "reunited_with_owner"
  | "deceased"
  | "euthanized"
  | "released"
  | "transferred_to_association"
  | "adopted";

export type TreatmentMeasurementUnit = "pill" | "spoon" | "ml" | "cl";

export interface AnimalInternalDetails {
  animalId: string;
  microchipNumber: string | null;
  coat: string | null;
  birthDate: string | null;
  inShelter: boolean;
  updatedAt: string;
}

export interface AnimalInternalDetailsInput {
  microchipNumber?: string | null;
  coat?: string | null;
  birthDate?: string | null;
}

export interface AnimalIntake {
  id: string;
  animalId: string;
  occurredOn: string;
  reason: AnimalIntakeReason;
  description: string | null;
  recordedBy: string | null;
  createdAt: string;
}

export interface AnimalIntakeInsert {
  occurredOn: string;
  reason: AnimalIntakeReason;
  description?: string | null;
}

export interface AnimalOutcome {
  id: string;
  animalId: string;
  occurredOn: string;
  reason: AnimalOutcomeReason;
  description: string | null;
  recordedBy: string | null;
  createdAt: string;
}

export interface AnimalOutcomeInsert {
  occurredOn: string;
  reason: AnimalOutcomeReason;
  description?: string | null;
}

export interface AnimalVaccine {
  id: string;
  animalId: string;
  name: string;
  administeredOn: string;
  followUpDate: string | null;
  followUpCompleted: boolean;
  googleEventId: string | null;
  googleSyncError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnimalVaccineInsert {
  name: string;
  administeredOn: string;
  followUpDate?: string | null;
  followUpCompleted?: boolean;
}

export interface AnimalVaccineUpdate extends Partial<AnimalVaccineInsert> {
  googleEventId?: string | null;
  googleSyncError?: string | null;
}

export interface AnimalTreatment {
  id: string;
  animalId: string;
  name: string;
  medicine: string;
  startDate: string;
  endDate: string | null;
  step: number;
  amount: number;
  measurement: TreatmentMeasurementUnit;
  dayStep: number | null;
  dayTimes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnimalTreatmentInsert {
  name: string;
  medicine: string;
  startDate: string;
  endDate?: string | null;
  step?: number;
  amount: number;
  measurement: TreatmentMeasurementUnit;
  dayStep?: number | null;
  dayTimes?: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

// Internal details --------------------------------------------------------

function toInternalDetails(row: Row): AnimalInternalDetails {
  return {
    animalId: row.animal_id,
    microchipNumber: row.microchip_number,
    coat: row.coat,
    birthDate: row.birth_date,
    inShelter: row.in_shelter,
    updatedAt: row.updated_at,
  };
}

export async function getAnimalInternalDetails(
  supabase: SupabaseClient,
  animalId: string,
): Promise<AnimalInternalDetails | null> {
  const { data, error } = await supabase
    .from("animal_internal_details")
    .select("*")
    .eq("animal_id", animalId)
    .maybeSingle();
  if (error) throw error;
  return data ? toInternalDetails(data) : null;
}

export async function listInShelterStatuses(
  supabase: SupabaseClient,
): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.from("animal_internal_details").select("animal_id, in_shelter");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row: Row) => [row.animal_id, row.in_shelter]));
}

export async function updateAnimalInternalDetails(
  supabase: SupabaseClient,
  animalId: string,
  values: AnimalInternalDetailsInput,
): Promise<AnimalInternalDetails> {
  const row: Record<string, unknown> = {};
  if (values.microchipNumber !== undefined) row.microchip_number = values.microchipNumber;
  if (values.coat !== undefined) row.coat = values.coat;
  if (values.birthDate !== undefined) row.birth_date = values.birthDate;

  const { data, error } = await supabase
    .from("animal_internal_details")
    .update(row)
    .eq("animal_id", animalId)
    .select("*")
    .single();
  if (error) throw error;
  return toInternalDetails(data);
}

// Intakes / outcomes -------------------------------------------------------

function toIntake(row: Row): AnimalIntake {
  return {
    id: row.id,
    animalId: row.animal_id,
    occurredOn: row.occurred_on,
    reason: row.reason,
    description: row.description,
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
  };
}

function toOutcome(row: Row): AnimalOutcome {
  return {
    id: row.id,
    animalId: row.animal_id,
    occurredOn: row.occurred_on,
    reason: row.reason,
    description: row.description,
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
  };
}

export async function listAnimalIntakes(
  supabase: SupabaseClient,
  animalId: string,
): Promise<AnimalIntake[]> {
  const { data, error } = await supabase
    .from("animal_intakes")
    .select("*")
    .eq("animal_id", animalId)
    .order("occurred_on", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toIntake);
}

export async function createAnimalIntake(
  supabase: SupabaseClient,
  animalId: string,
  values: AnimalIntakeInsert,
  recordedBy: string,
): Promise<AnimalIntake> {
  const { data, error } = await supabase
    .from("animal_intakes")
    .insert({
      animal_id: animalId,
      occurred_on: values.occurredOn,
      reason: values.reason,
      description: values.description,
      recorded_by: recordedBy,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toIntake(data);
}

export async function deleteAnimalIntake(supabase: SupabaseClient, intakeId: string): Promise<void> {
  const { error } = await supabase.from("animal_intakes").delete().eq("id", intakeId);
  if (error) throw error;
}

export async function listAnimalOutcomes(
  supabase: SupabaseClient,
  animalId: string,
): Promise<AnimalOutcome[]> {
  const { data, error } = await supabase
    .from("animal_outcomes")
    .select("*")
    .eq("animal_id", animalId)
    .order("occurred_on", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toOutcome);
}

export async function createAnimalOutcome(
  supabase: SupabaseClient,
  animalId: string,
  values: AnimalOutcomeInsert,
  recordedBy: string,
): Promise<AnimalOutcome> {
  const { data, error } = await supabase
    .from("animal_outcomes")
    .insert({
      animal_id: animalId,
      occurred_on: values.occurredOn,
      reason: values.reason,
      description: values.description,
      recorded_by: recordedBy,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toOutcome(data);
}

export async function deleteAnimalOutcome(supabase: SupabaseClient, outcomeId: string): Promise<void> {
  const { error } = await supabase.from("animal_outcomes").delete().eq("id", outcomeId);
  if (error) throw error;
}

// Vaccines ------------------------------------------------------------------

function toVaccine(row: Row): AnimalVaccine {
  return {
    id: row.id,
    animalId: row.animal_id,
    name: row.name,
    administeredOn: row.administered_on,
    followUpDate: row.follow_up_date,
    followUpCompleted: row.follow_up_completed,
    googleEventId: row.google_event_id,
    googleSyncError: row.google_sync_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAnimalVaccines(
  supabase: SupabaseClient,
  animalId: string,
): Promise<AnimalVaccine[]> {
  const { data, error } = await supabase
    .from("animal_vaccines")
    .select("*")
    .eq("animal_id", animalId)
    .order("administered_on", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toVaccine);
}

export async function getAnimalVaccine(
  supabase: SupabaseClient,
  vaccineId: string,
): Promise<AnimalVaccine | null> {
  const { data, error } = await supabase
    .from("animal_vaccines")
    .select("*")
    .eq("id", vaccineId)
    .maybeSingle();
  if (error) throw error;
  return data ? toVaccine(data) : null;
}

export async function createAnimalVaccine(
  supabase: SupabaseClient,
  animalId: string,
  values: AnimalVaccineInsert,
): Promise<AnimalVaccine> {
  const { data, error } = await supabase
    .from("animal_vaccines")
    .insert({
      animal_id: animalId,
      name: values.name,
      administered_on: values.administeredOn,
      follow_up_date: values.followUpDate,
      follow_up_completed: values.followUpCompleted ?? false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toVaccine(data);
}

export async function updateAnimalVaccine(
  supabase: SupabaseClient,
  vaccineId: string,
  values: AnimalVaccineUpdate,
): Promise<AnimalVaccine> {
  const row: Record<string, unknown> = {};
  if (values.name !== undefined) row.name = values.name;
  if (values.administeredOn !== undefined) row.administered_on = values.administeredOn;
  if (values.followUpDate !== undefined) row.follow_up_date = values.followUpDate;
  if (values.followUpCompleted !== undefined) row.follow_up_completed = values.followUpCompleted;
  if (values.googleEventId !== undefined) row.google_event_id = values.googleEventId;
  if (values.googleSyncError !== undefined) row.google_sync_error = values.googleSyncError;

  const { data, error } = await supabase
    .from("animal_vaccines")
    .update(row)
    .eq("id", vaccineId)
    .select("*")
    .single();
  if (error) throw error;
  return toVaccine(data);
}

export async function deleteAnimalVaccine(supabase: SupabaseClient, vaccineId: string): Promise<void> {
  const { error } = await supabase.from("animal_vaccines").delete().eq("id", vaccineId);
  if (error) throw error;
}

// Treatments ------------------------------------------------------------------

function toTreatment(row: Row): AnimalTreatment {
  return {
    id: row.id,
    animalId: row.animal_id,
    name: row.name,
    medicine: row.medicine,
    startDate: row.start_date,
    endDate: row.end_date,
    step: row.step,
    amount: Number(row.amount),
    measurement: row.measurement,
    dayStep: row.day_step,
    dayTimes: row.day_times,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAnimalTreatments(
  supabase: SupabaseClient,
  animalId: string,
): Promise<AnimalTreatment[]> {
  const { data, error } = await supabase
    .from("animal_treatments")
    .select("*")
    .eq("animal_id", animalId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toTreatment);
}

export async function createAnimalTreatment(
  supabase: SupabaseClient,
  animalId: string,
  values: AnimalTreatmentInsert,
): Promise<AnimalTreatment> {
  const { data, error } = await supabase
    .from("animal_treatments")
    .insert({
      animal_id: animalId,
      name: values.name,
      medicine: values.medicine,
      start_date: values.startDate,
      end_date: values.endDate,
      step: values.step ?? 1,
      amount: values.amount,
      measurement: values.measurement,
      day_step: values.dayStep,
      day_times: values.dayTimes,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toTreatment(data);
}

export async function updateAnimalTreatment(
  supabase: SupabaseClient,
  treatmentId: string,
  values: Partial<AnimalTreatmentInsert>,
): Promise<AnimalTreatment> {
  const row: Record<string, unknown> = {};
  if (values.name !== undefined) row.name = values.name;
  if (values.medicine !== undefined) row.medicine = values.medicine;
  if (values.startDate !== undefined) row.start_date = values.startDate;
  if (values.endDate !== undefined) row.end_date = values.endDate;
  if (values.step !== undefined) row.step = values.step;
  if (values.amount !== undefined) row.amount = values.amount;
  if (values.measurement !== undefined) row.measurement = values.measurement;
  if (values.dayStep !== undefined) row.day_step = values.dayStep;
  if (values.dayTimes !== undefined) row.day_times = values.dayTimes;

  const { data, error } = await supabase
    .from("animal_treatments")
    .update(row)
    .eq("id", treatmentId)
    .select("*")
    .single();
  if (error) throw error;
  return toTreatment(data);
}

export async function deleteAnimalTreatment(supabase: SupabaseClient, treatmentId: string): Promise<void> {
  const { error } = await supabase.from("animal_treatments").delete().eq("id", treatmentId);
  if (error) throw error;
}
