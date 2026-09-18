import type { SupabaseClient } from "@supabase/supabase-js";

export type AnimalSpecies = "cat" | "dog" | "horse" | "goat" | "other";
export type AnimalTrack = "adoption" | "sponsorship";
export type AnimalSex = "male" | "female" | "unknown";

export const PHOTO_BUCKET = "animal-photos";

const PLACEHOLDER_PHOTOS: Partial<Record<AnimalSpecies, string>> = {
  cat: "/images/animal-placeholder-cat.png",
  dog: "/images/animal-placeholder-dog.png",
};

export function getPlaceholderPhotoUrl(species: AnimalSpecies): string | null {
  return PLACEHOLDER_PHOTOS[species] ?? null;
}

/** The photo to show for an animal in a thumbnail/avatar context: featured photo, else its first photo, else a species placeholder image (may be null — caller falls back to a generic swatch). */
export function getDisplayPhoto(animal: Pick<Animal, "species" | "photos">): AnimalPhoto | null {
  return animal.photos.find((p) => p.isFeatured) ?? animal.photos[0] ?? null;
}

export function getDisplayPhotoUrl(animal: Pick<Animal, "species" | "photos">): string | null {
  return getDisplayPhoto(animal)?.url ?? getPlaceholderPhotoUrl(animal.species);
}

export interface AnimalPhoto {
  id: string;
  storagePath: string;
  position: number;
  isFeatured: boolean;
  url: string;
  focalX: number;
  focalY: number;
  uploadedBy: string | null;
  /** Resolved separately (auth.users isn't reachable via the RLS-backed client) — see getUserEmailsByIds in lib/accounts.ts. Null unless a caller enriches it. */
  uploadedByName: string | null;
}

export interface Animal {
  id: string;
  name: string;
  species: AnimalSpecies;
  track: AnimalTrack;
  inShelter: boolean;
  breed: string | null;
  sex: AnimalSex;
  birthYear: number | null;
  birthMonth: number | null;
  size: string | null;
  arrivalDate: string | null;
  bioFr: string | null;
  bioEn: string | null;
  specialNeeds: boolean;
  calicivirus: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  photos: AnimalPhoto[];
}

export interface AnimalInsert {
  name: string;
  species: AnimalSpecies;
  track: AnimalTrack;
  breed?: string | null;
  sex: AnimalSex;
  birthYear?: number | null;
  birthMonth?: number | null;
  size?: string | null;
  arrivalDate?: string | null;
  bioFr?: string | null;
  bioEn?: string | null;
  specialNeeds?: boolean;
  calicivirus?: boolean;
  isPublished?: boolean;
}

export interface AnimalFilters {
  species?: AnimalSpecies;
  track?: AnimalTrack;
  /** Only animals currently at the shelter (an intake with no later outcome). Public pages should pass true. */
  inShelterOnly?: boolean;
  calicivirus?: boolean;
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
    isFeatured: row.is_featured,
    url: data.publicUrl,
    focalX: row.focal_x,
    focalY: row.focal_y,
    uploadedBy: row.uploaded_by ?? null,
    uploadedByName: null,
  };
}

function toAnimal(supabase: SupabaseClient, row: Row): Animal {
  const photos: Row[] = row.animal_photos ?? [];
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    track: row.track,
    inShelter: row.in_shelter,
    breed: row.breed,
    sex: row.sex,
    birthYear: row.birth_year,
    birthMonth: row.birth_month,
    size: row.size,
    arrivalDate: row.arrival_date,
    bioFr: row.bio_fr,
    bioEn: row.bio_en,
    specialNeeds: row.special_needs,
    calicivirus: row.calicivirus,
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
  if (values.breed !== undefined) row.breed = values.breed;
  if (values.sex !== undefined) row.sex = values.sex;
  if (values.birthYear !== undefined) row.birth_year = values.birthYear;
  if (values.birthMonth !== undefined) row.birth_month = values.birthMonth;
  if (values.size !== undefined) row.size = values.size;
  if (values.arrivalDate !== undefined) row.arrival_date = values.arrivalDate;
  if (values.bioFr !== undefined) row.bio_fr = values.bioFr;
  if (values.bioEn !== undefined) row.bio_en = values.bioEn;
  if (values.specialNeeds !== undefined) row.special_needs = values.specialNeeds;
  if (values.calicivirus !== undefined) row.calicivirus = values.calicivirus;
  if (values.isPublished !== undefined) row.is_published = values.isPublished;
  return row;
}

export async function getPublishedAnimalCount(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("animals")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .eq("in_shelter", true);
  if (error) throw error;
  return count ?? 0;
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
  if (filters.inShelterOnly) query = query.eq("in_shelter", true);
  if (filters.calicivirus) query = query.eq("calicivirus", true);
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
// don't need the full Animal shape (bio, photos, ...). Only animals currently
// in shelter are offered, since a vet visit can't be scheduled for one that
// isn't present.
export async function listAnimalOptions(supabase: SupabaseClient): Promise<AnimalOption[]> {
  const { data, error } = await supabase
    .from("animals")
    .select("id, name, species, animal_internal_details!inner(in_shelter)")
    .eq("animal_internal_details.in_shelter", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(({ id, name, species }) => ({ id, name, species }));
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
  uploadedBy: string,
  isFeatured = false,
): Promise<void> {
  const { error } = await supabase.from("animal_photos").insert({
    animal_id: animalId,
    storage_path: storagePath,
    position,
    uploaded_by: uploadedBy,
    is_featured: isFeatured,
  });
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

export async function setFeaturedPhoto(
  supabase: SupabaseClient,
  animalId: string,
  photoId: string,
): Promise<void> {
  const { error } = await supabase
    .from("animal_photos")
    .update({ is_featured: true })
    .eq("id", photoId)
    .eq("animal_id", animalId);
  if (error) throw error;
}

export async function setPhotoFocalPoint(
  supabase: SupabaseClient,
  animalId: string,
  photoId: string,
  focalX: number,
  focalY: number,
): Promise<void> {
  const { error } = await supabase
    .from("animal_photos")
    .update({ focal_x: focalX, focal_y: focalY })
    .eq("id", photoId)
    .eq("animal_id", animalId);
  if (error) throw error;
}

export interface RecentPhotoUpload {
  id: string;
  animalId: string;
  animalName: string;
  animalSpecies: AnimalSpecies;
  url: string;
  focalX: number;
  focalY: number;
  createdAt: string;
}

// Powers the admin dashboard's "recent volunteer photos" card. Looks back
// over the most recent photo uploads (any uploader) and keeps only the ones
// whose uploader is a volunteer, so an admin's own edits never show up here.
export async function listRecentVolunteerPhotoUploads(
  supabase: SupabaseClient,
  limit: number,
): Promise<RecentPhotoUpload[]> {
  const { data: volunteerProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "volunteer");
  if (profilesError) throw profilesError;

  const volunteerIds = new Set((volunteerProfiles ?? []).map((p: Row) => p.id));
  if (volunteerIds.size === 0) return [];

  const { data, error } = await supabase
    .from("animal_photos")
    .select("id, animal_id, storage_path, focal_x, focal_y, created_at, uploaded_by, animals(name, species)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  return (data ?? [])
    .filter((row: Row) => row.uploaded_by && volunteerIds.has(row.uploaded_by))
    .slice(0, limit)
    .map((row: Row) => {
      const { data: urlData } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(row.storage_path);
      return {
        id: row.id,
        animalId: row.animal_id,
        animalName: row.animals?.name ?? "",
        animalSpecies: row.animals?.species,
        url: urlData.publicUrl,
        focalX: row.focal_x,
        focalY: row.focal_y,
        createdAt: row.created_at,
      };
    });
}
