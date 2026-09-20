import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnimalSex, AnimalSpecies } from "./animals";
import type { AnimalIntakeReason, AnimalOutcomeReason } from "./animal-care";

// Data behind the yearly entries/exits register (registre d'entrées-sorties):
// one row per intake / outcome event (an animal returned after an adoption
// legitimately appears in several rows), plus the per-species summary counts.
// Admin-only — reads tables with admin RLS, and rows carry personal contact data.

export type RegisterSpecies = AnimalSpecies;

/** Sections in the order the printed register lists them. "other" is only shown when non-empty. */
export const REGISTER_SPECIES: RegisterSpecies[] = ["cat", "dog", "goat", "horse", "other"];
const ALWAYS_SHOWN_SPECIES: RegisterSpecies[] = ["cat", "dog", "goat", "horse"];

/** The register's cause columns, which fold several of our finer-grained reasons together. */
export const INTAKE_CAUSES = [
  "stray",
  "born_in_care",
  "shelter_transfer",
  "surrendered",
  "cruelty_seizure",
  "police_surrender",
  "association_transfer",
] as const;
export type IntakeCause = (typeof INTAKE_CAUSES)[number];

export const OUTCOME_CAUSES = [
  "reunited_with_owner",
  "died",
  "released",
  "transferred_to_association",
  "adopted",
] as const;
export type OutcomeCause = (typeof OUTCOME_CAUSES)[number];

export function toIntakeCause(reason: AnimalIntakeReason): IntakeCause {
  return reason === "owner_surrender" || reason === "abandoned" ? "surrendered" : reason;
}

export function toOutcomeCause(reason: AnimalOutcomeReason): OutcomeCause {
  return reason === "deceased" || reason === "euthanized" ? "died" : reason;
}

export interface RegisterAge {
  unit: "weeks" | "months" | "years";
  count: number;
}

interface RegisterEventBase {
  id: string;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  species: RegisterSpecies;
  sex: AnimalSex;
  name: string;
  /** Microchip number. */
  identification: string | null;
  age: RegisterAge | null;
  detail: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  documentRef: string | null;
}

export interface RegisterEntry extends RegisterEventBase {
  cause: IntakeCause;
}

export interface RegisterExit extends RegisterEventBase {
  cause: OutcomeCause;
}

export interface SummaryRow<C extends string> {
  species: RegisterSpecies;
  counts: Record<C, number>;
  total: number;
}

export interface RegisterSummary {
  entries: SummaryRow<IntakeCause>[];
  exits: SummaryRow<OutcomeCause>[];
  present: { species: RegisterSpecies; start: number; end: number }[];
  /** Count date of the "start" column: 31/12 of the previous year. */
  startDate: string;
  /** Count date of the "end" column: 31/12 of the year, or today for the current year. */
  endDate: string;
  endIsToday: boolean;
}

export interface RegisterData {
  year: number;
  entries: RegisterEntry[];
  exits: RegisterExit[];
  summary: RegisterSummary;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const PAGE_SIZE = 1000;

/** PostgREST caps a response at 1000 rows; page through so a multi-year table can't be silently truncated. */
async function fetchAll(
  query: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: unknown }>,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await query(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

const one = <T>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

/** Age at the event date, from the birth date when known, else the birth year/month. */
export function ageAt(
  eventDate: string,
  birthDate: string | null,
  birthYear: number | null,
  birthMonth: number | null,
): RegisterAge | null {
  let birth: Date | null = null;
  if (birthDate) birth = new Date(`${birthDate}T00:00:00Z`);
  else if (birthYear) birth = new Date(Date.UTC(birthYear, (birthMonth ?? 1) - 1, 1));
  if (!birth || Number.isNaN(birth.getTime())) return null;

  const event = new Date(`${eventDate}T00:00:00Z`);
  const days = Math.floor((event.getTime() - birth.getTime()) / 86_400_000);
  if (days < 0) return null;

  const months =
    (event.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    (event.getUTCMonth() - birth.getUTCMonth()) -
    (event.getUTCDate() < birth.getUTCDate() ? 1 : 0);

  if (days < 56) return { unit: "weeks", count: Math.max(1, Math.floor(days / 7)) };
  if (months < 24) return { unit: "months", count: Math.max(1, months) };
  return { unit: "years", count: Math.floor(months / 12) };
}

const EVENT_SELECT =
  "*, animals(name, species, sex, birth_year, birth_month, animal_internal_details(microchip_number, birth_date))";

function toEventBase(row: Row): RegisterEventBase {
  const animal = one<Row>(row.animals);
  const details = one<Row>(animal?.animal_internal_details);
  return {
    id: row.id,
    date: row.occurred_on,
    species: animal?.species ?? "other",
    sex: animal?.sex ?? "unknown",
    name: animal?.name ?? "",
    identification: details?.microchip_number ?? null,
    age: ageAt(row.occurred_on, details?.birth_date ?? null, animal?.birth_year ?? null, animal?.birth_month ?? null),
    detail: row.description,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactAddress: row.contact_address,
    documentRef: row.document_ref,
  };
}

interface PresenceEvent {
  animalId: string;
  kind: "in" | "out";
  date: string;
  createdAt: string;
}

/**
 * Number of animals (per species) in our care at the end of `date`: those whose latest event on
 * or before that day is an intake. Animals with no intake row at all count as present from their
 * arrival date (or record creation) until their first outcome.
 */
function countPresent(
  animals: { id: string; species: RegisterSpecies; arrivalDate: string }[],
  events: PresenceEvent[],
  date: string,
): Record<RegisterSpecies, number> {
  const byAnimal = new Map<string, PresenceEvent[]>();
  const withIntake = new Set(events.filter((e) => e.kind === "in").map((e) => e.animalId));
  for (const event of events) {
    if (event.date > date) continue;
    const list = byAnimal.get(event.animalId) ?? [];
    list.push(event);
    byAnimal.set(event.animalId, list);
  }

  const counts: Record<RegisterSpecies, number> = { cat: 0, dog: 0, goat: 0, horse: 0, other: 0 };
  for (const animal of animals) {
    const own = byAnimal.get(animal.id) ?? [];
    const timeline = withIntake.has(animal.id)
      ? own
      : [{ animalId: animal.id, kind: "in" as const, date: animal.arrivalDate, createdAt: "" }, ...own].filter(
          (e) => e.date <= date,
        );
    if (timeline.length === 0) continue;

    timeline.sort((a, b) =>
      a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
    );
    if (timeline[timeline.length - 1].kind === "in") counts[animal.species] += 1;
  }
  return counts;
}

export function buildSummary(
  entries: RegisterEntry[],
  exits: RegisterExit[],
  presentStart: Record<RegisterSpecies, number>,
  presentEnd: Record<RegisterSpecies, number>,
  dates: { startDate: string; endDate: string; endIsToday: boolean },
): RegisterSummary {
  const used = new Set<RegisterSpecies>(ALWAYS_SHOWN_SPECIES);
  for (const e of [...entries, ...exits]) used.add(e.species);
  if (presentStart.other > 0 || presentEnd.other > 0) used.add("other");
  const species = REGISTER_SPECIES.filter((s) => used.has(s));

  const empty = <C extends string>(causes: readonly C[]) =>
    Object.fromEntries(causes.map((c) => [c, 0])) as Record<C, number>;

  return {
    entries: species.map((s) => {
      const counts = empty(INTAKE_CAUSES);
      const own = entries.filter((e) => e.species === s);
      for (const e of own) counts[e.cause] += 1;
      return { species: s, counts, total: own.length };
    }),
    exits: species.map((s) => {
      const counts = empty(OUTCOME_CAUSES);
      const own = exits.filter((e) => e.species === s);
      for (const e of own) counts[e.cause] += 1;
      return { species: s, counts, total: own.length };
    }),
    present: species.map((s) => ({ species: s, start: presentStart[s], end: presentEnd[s] })),
    ...dates,
  };
}

export async function getRegisterData(supabase: SupabaseClient, year: number): Promise<RegisterData> {
  const from = `${year}-01-01`;
  const to = `${year + 1}-01-01`;
  const today = new Date().toISOString().slice(0, 10);
  const endIsToday = today < `${year}-12-31`;
  const endDate = endIsToday ? today : `${year}-12-31`;
  const startDate = `${year - 1}-12-31`;

  const [intakeRows, outcomeRows, animalRows, allIntakes, allOutcomes] = await Promise.all([
    fetchAll((a, b) =>
      supabase
        .from("animal_intakes")
        .select(EVENT_SELECT)
        .gte("occurred_on", from)
        .lt("occurred_on", to)
        .order("occurred_on")
        .order("created_at")
        .range(a, b),
    ),
    fetchAll((a, b) =>
      supabase
        .from("animal_outcomes")
        .select(EVENT_SELECT)
        .gte("occurred_on", from)
        .lt("occurred_on", to)
        .order("occurred_on")
        .order("created_at")
        .range(a, b),
    ),
    fetchAll((a, b) =>
      supabase.from("animals").select("id, species, arrival_date, created_at").order("id").range(a, b),
    ),
    fetchAll((a, b) =>
      supabase.from("animal_intakes").select("id, animal_id, occurred_on, created_at").order("id").range(a, b),
    ),
    fetchAll((a, b) =>
      supabase.from("animal_outcomes").select("id, animal_id, occurred_on, created_at").order("id").range(a, b),
    ),
  ]);

  const entries: RegisterEntry[] = intakeRows.map((row) => ({
    ...toEventBase(row),
    cause: toIntakeCause(row.reason),
  }));
  const exits: RegisterExit[] = outcomeRows.map((row) => ({
    ...toEventBase(row),
    cause: toOutcomeCause(row.reason),
  }));

  const animals = animalRows.map((row) => ({
    id: row.id as string,
    species: row.species as RegisterSpecies,
    arrivalDate: (row.arrival_date ?? String(row.created_at).slice(0, 10)) as string,
  }));
  const presenceEvents: PresenceEvent[] = [
    ...allIntakes.map((r) => ({ animalId: r.animal_id, kind: "in" as const, date: r.occurred_on, createdAt: r.created_at })),
    ...allOutcomes.map((r) => ({ animalId: r.animal_id, kind: "out" as const, date: r.occurred_on, createdAt: r.created_at })),
  ];

  return {
    year,
    entries,
    exits,
    summary: buildSummary(
      entries,
      exits,
      countPresent(animals, presenceEvents, startDate),
      countPresent(animals, presenceEvents, endDate),
      { startDate, endDate, endIsToday },
    ),
  };
}

/** Years selectable in the register: from the first recorded event up to the current year, newest first. */
export async function getRegisterYears(supabase: SupabaseClient): Promise<number[]> {
  const currentYear = new Date().getFullYear();
  const [intake, outcome] = await Promise.all([
    supabase.from("animal_intakes").select("occurred_on").order("occurred_on").limit(1),
    supabase.from("animal_outcomes").select("occurred_on").order("occurred_on").limit(1),
  ]);
  const firstYears = [intake.data?.[0]?.occurred_on, outcome.data?.[0]?.occurred_on]
    .filter((d): d is string => Boolean(d))
    .map((d) => Number(d.slice(0, 4)));
  const first = Math.min(currentYear, ...firstYears);
  return Array.from({ length: currentYear - first + 1 }, (_, i) => currentYear - i);
}
