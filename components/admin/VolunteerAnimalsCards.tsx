"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AdminListToolbar } from "./AdminListToolbar";
import { AdminSelect } from "./ui/AdminField";
import { AnimalThumb } from "./ui/AnimalThumb";
import { StatusPill } from "./ui/StatusPill";
import type { Animal } from "@/lib/animals";
import { getCareStatus, type AnimalVaccine, type AnimalInternalDetailsSummary } from "@/lib/animal-care";

interface AnimalCardData extends Animal {
  careStatus: ReturnType<typeof getCareStatus>;
}

const CARE_TONE: Record<AnimalCardData["careStatus"], "success" | "warning" | "danger"> = {
  upToDate: "success",
  overdue: "danger",
  inProgress: "warning",
  missingChip: "warning",
};

/**
 * Volunteer-only animal list: card grid instead of the admin data table, and
 * deliberately excludes the microchip number (that's internal shelter-ops
 * data volunteers have no reason to see). Optimized for phones, since
 * volunteers mostly reach this to grab a quick photo of an animal.
 */
export function VolunteerAnimalsCards({
  animals,
  internalDetails,
  vaccinesByAnimal,
  fosterAnimalIds = [],
  initialSearch = "",
}: {
  animals: Animal[];
  internalDetails: Record<string, AnimalInternalDetailsSummary>;
  vaccinesByAnimal: Record<string, AnimalVaccine[]>;
  /** Animals this volunteer currently fosters — listed first and tagged. */
  fosterAnimalIds?: string[];
  initialSearch?: string;
}) {
  const t = useTranslations("admin.animals");
  const [search, setSearch] = useState(initialSearch);
  const [speciesFilter, setSpeciesFilter] = useState("all");

  const cards: AnimalCardData[] = animals.map((animal) => ({
    ...animal,
    careStatus: getCareStatus(
      vaccinesByAnimal[animal.id] ?? [],
      Boolean(internalDetails[animal.id]?.microchipNumber),
      Boolean(internalDetails[animal.id]?.inShelter),
    ),
  }));

  const speciesOptions = [...new Set(cards.map((card) => card.species))].sort();

  const query = search.trim().toLowerCase();
  const mine = new Set(fosterAnimalIds);
  const filtered = cards
    .filter((card) => speciesFilter === "all" || card.species === speciesFilter)
    .filter((card) => !query || card.name.toLowerCase().includes(query) || card.species.toLowerCase().includes(query))
    // Stable sort: the volunteer's own foster animals first, the rest keep their order.
    .sort((a, b) => Number(mine.has(b.id)) - Number(mine.has(a.id)));

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <AdminSelect
          value={speciesFilter}
          onChange={(event) => setSpeciesFilter(event.target.value)}
          className="w-auto"
        >
          <option value="all">{t("allSpecies")}</option>
          {speciesOptions.map((species) => (
            <option key={species} value={species}>
              {species}
            </option>
          ))}
        </AdminSelect>
        <AdminListToolbar value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
        <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/50">
          {t("resultsCount", { count: filtered.length })}
        </span>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-ink/60">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((animal) => (
            <Link
              key={animal.id}
              href={{ pathname: "/admin/animals/[id]/edit", params: { id: animal.id } }}
              className="flex items-center gap-3.5 rounded-admin border border-ink/10 bg-surface p-3.5 active:border-ink/25"
            >
              <AnimalThumb animal={animal} size={64} rounded={12} />
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="truncate text-[15px] font-bold">{animal.name}</span>
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/50">
                    {animal.species}
                  </span>
                  <span className="h-[3px] w-[3px] rounded-pill bg-ink/25" />
                  <span className="text-xs text-ink/62">{t(`tracks.${animal.track}`)}</span>
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {mine.has(animal.id) ? (
                    <StatusPill tone="accent" className="w-fit">
                      {t("fosterMine")}
                    </StatusPill>
                  ) : null}
                  <StatusPill tone={CARE_TONE[animal.careStatus]} className="w-fit">
                    {t(`care.${animal.careStatus}`)}
                  </StatusPill>
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
