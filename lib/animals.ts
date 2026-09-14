import type { SupabaseClient } from "@supabase/supabase-js";

export type AnimalSpecies = "cat" | "dog" | "horse" | "goat" | "other";
export type AnimalTrack = "adoption" | "sponsorship";
export type AnimalStatus = "available" | "pending" | "adopted";
export type AnimalSex = "male" | "female" | "unknown";

export const PHOTO_BUCKET = "animal-photos";

const PLACEHOLDER_PHOTOS: Partial<Record<AnimalSpecies, string>> = {
  cat: "/images/animal-placeholder-cat.png",
  dog: "/images/animal-placeholder-dog.png",
};

export function getPlaceholderPhotoUrl(species: AnimalSpecies): string | null {
  return PLACEHOLDER_PHOTOS[species] ?? null;
}

export interface AnimalPhoto {
  id: string;
  storagePath: string;
  position: number;
  url: string;
}

export interface Animal {
  id: string;
  name: string;
  species: AnimalSpecies;
  track: AnimalTrack;
  status: AnimalStatus;
  breed: string | null;
  sex: AnimalSex;
  birthYear: number | null;
  birthMonth: number | null;
  size: string | null;
  arrivalDate: string | null;
  bioFr: string | null;
  bioEn: string | null;
  specialNeeds: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  photos: AnimalPhoto[];
}

export interface AnimalInsert {
  name: string;
  species: AnimalSpecies;
  track: AnimalTrack;
  status: AnimalStatus;
  breed?: string | null;
  sex: AnimalSex;
  birthYear?: number | null;
  birthMonth?: number | null;
  size?: string | null;
  arrivalDate?: string | null;
  bioFr?: string | null;
  bioEn?: string | null;
  specialNeeds?: boolean;
  isPublished?: boolean;
}

export interface AnimalFilters {
  species?: AnimalSpecies;
  track?: AnimalTrack;
  status?: AnimalStatus;
  /** Defaults to true — pass false only from admin contexts that need drafts too. */
  publishedOnly?: boolean;
  limit?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function toPhoto(supabase: SupabaseClient, row: Row): AnimalPhoto {
  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(row.storage_path);
  return {
    id: row.id,
    storagePath: row.storage_path,
    position: row.position,
    url: data.publicUrl,
  };
}

function toAnimal(supabase: SupabaseClient, row: Row): Animal {
  const photos: Row[] = row.animal_photos ?? [];
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    track: row.track,
    status: row.status,
    breed: row.breed,
    sex: row.sex,
    birthYear: row.birth_year,
    birthMonth: row.birth_month,
    size: row.size,
    arrivalDate: row.arrival_date,
    bioFr: row.bio_fr,
    bioEn: row.bio_en,
    specialNeeds: row.special_needs,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    photos: photos
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((p) => toPhoto(supabase, p)),
  };
}

function toRow(values: Partial<AnimalInsert>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (values.name !== undefined) row.name = values.name;
  if (values.species !== undefined) row.species = values.species;
  if (values.track !== undefined) row.track = values.track;
  if (values.status !== undefined) row.status = values.status;
  if (values.breed !== undefined) row.breed = values.breed;
  if (values.sex !== undefined) row.sex = values.sex;
  if (values.birthYear !== undefined) row.birth_year = values.birthYear;
  if (values.birthMonth !== undefined) row.birth_month = values.birthMonth;
  if (values.size !== undefined) row.size = values.size;
  if (values.arrivalDate !== undefined) row.arrival_date = values.arrivalDate;
  if (values.bioFr !== undefined) row.bio_fr = values.bioFr;
  if (values.bioEn !== undefined) row.bio_en = values.bioEn;
  if (values.specialNeeds !== undefined) row.special_needs = values.specialNeeds;
  if (values.isPublished !== undefined) row.is_published = values.isPublished;
  return row;
}

export async function getAnimals(
  supabase: SupabaseClient,
  filters: AnimalFilters = {},
): Promise<Animal[]> {
  let query = supabase
    .from("animals")
    .select("*, animal_photos(*)")
    .order("created_at", { ascending: false });

  if (filters.publishedOnly !== false) query = query.eq("is_published", true);
  if (filters.species) query = query.eq("species", filters.species);
  if (filters.track) query = query.eq("track", filters.track);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: Row) => toAnimal(supabase, row));
}

export interface AnimalOption {
  id: string;
  name: string;
  species: AnimalSpecies;
}

// Lightweight listing for pickers (e.g. the vet-visit multi-select) that
// don't need the full Animal shape (bio, photos, ...).
export async function listAnimalOptions(supabase: SupabaseClient): Promise<AnimalOption[]> {
  const { data, error } = await supabase
    .from("animals")
    .select("id, name, species")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAnimalById(
  supabase: SupabaseClient,
  id: string,
): Promise<Animal | null> {
  const { data, error } = await supabase
    .from("animals")
    .select("*, animal_photos(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toAnimal(supabase, data) : null;
}

export async function createAnimal(
  supabase: SupabaseClient,
  values: AnimalInsert,
  createdBy: string,
): Promise<Animal> {
  const { data, error } = await supabase
    .from("animals")
    .insert({ ...toRow(values), created_by: createdBy })
    .select("*, animal_photos(*)")
    .single();
  if (error) throw error;
  return toAnimal(supabase, data);
}

export async function updateAnimal(
  supabase: SupabaseClient,
  id: string,
  values: Partial<AnimalInsert>,
): Promise<Animal> {
  const { data, error } = await supabase
    .from("animals")
    .update(toRow(values))
    .eq("id", id)
    .select("*, animal_photos(*)")
    .single();
  if (error) throw error;
  return toAnimal(supabase, data);
}

export async function deleteAnimal(supabase: SupabaseClient, id: string): Promise<void> {
  const { data: photos } = await supabase
    .from("animal_photos")
    .select("storage_path")
    .eq("animal_id", id);

  if (photos && photos.length > 0) {
    await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((p: Row) => p.storage_path));
  }

  const { error } = await supabase.from("animals").delete().eq("id", id);
  if (error) throw error;
}

export async function addAnimalPhoto(
  supabase: SupabaseClient,
  animalId: string,
  storagePath: string,
  position: number,
): Promise<void> {
  const { error } = await supabase
    .from("animal_photos")
    .insert({ animal_id: animalId, storage_path: storagePath, position });
  if (error) throw error;
}

export async function deleteAnimalPhoto(
  supabase: SupabaseClient,
  photoId: string,
  storagePath: string,
): Promise<void> {
  await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
  const { error } = await supabase.from("animal_photos").delete().eq("id", photoId);
  if (error) throw error;
}
