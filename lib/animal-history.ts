import type { AnimalIntake, AnimalOutcome } from "./animal-care";
import type { Animal } from "./animals";

export interface AnimalHistoryEntry {
  key: string;
  kind: "intake" | "outcome" | "published";
  date: string;
  reason: AnimalIntake["reason"] | AnimalOutcome["reason"] | null;
  description: string | null;
}

/**
 * Merges intake/outcome events (plus a synthetic "published" event, when
 * applicable) into a single chronological timeline for the animal detail
 * page's "Historique" card. Oldest first, matching the redesign.
 */
export function getAnimalHistory(
  intakes: AnimalIntake[],
  outcomes: AnimalOutcome[],
  animal: Pick<Animal, "isPublished" | "updatedAt">,
): AnimalHistoryEntry[] {
  const entries: AnimalHistoryEntry[] = [
    ...intakes.map((intake) => ({
      key: `intake-${intake.id}`,
      kind: "intake" as const,
      date: intake.occurredOn,
      reason: intake.reason,
      description: intake.description,
    })),
    ...outcomes.map((outcome) => ({
      key: `outcome-${outcome.id}`,
      kind: "outcome" as const,
      date: outcome.occurredOn,
      reason: outcome.reason,
      description: outcome.description,
    })),
  ];

  if (animal.isPublished) {
    entries.push({
      key: "published",
      kind: "published",
      date: animal.updatedAt,
      reason: null,
      description: null,
    });
  }

  return entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
