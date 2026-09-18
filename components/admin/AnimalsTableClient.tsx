"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AdminTable, type AdminTableColumn, type AdminTableSortState } from "./AdminTable";
import { AdminListToolbar } from "./AdminListToolbar";
import { AdminSelect } from "./ui/AdminField";
import { AnimalThumb } from "./ui/AnimalThumb";
import { StatusPill } from "./ui/StatusPill";
import type { Animal } from "@/lib/animals";
import { getCareStatus, type AnimalVaccine, type AnimalInternalDetailsSummary } from "@/lib/animal-care";

interface AnimalRow extends Animal {
  microchipNumber: string | null;
  careStatus: ReturnType<typeof getCareStatus>;
}

type PublicationFilter = "all" | "published" | "draft";

const CARE_TONE: Record<AnimalRow["careStatus"], "success" | "warning" | "danger"> = {
  upToDate: "success",
  overdue: "danger",
  inProgress: "warning",
  missingChip: "warning",
};

export function AnimalsTableClient({
  animals,
  internalDetails,
  vaccinesByAnimal,
  isAdmin,
  initialSearch = "",
}: {
  animals: Animal[];
  internalDetails: Record<string, AnimalInternalDetailsSummary>;
  vaccinesByAnimal: Record<string, AnimalVaccine[]>;
  isAdmin: boolean;
  initialSearch?: string;
}) {
  const t = useTranslations("admin.animals");
  const [search, setSearch] = useState(initialSearch);
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [publicationFilter, setPublicationFilter] = useState<PublicationFilter>("all");
  const [sort, setSort] = useState<AdminTableSortState>({
    column: t("columns.name"),
    direction: "asc",
  });

  const rows: AnimalRow[] = animals.map((animal) => ({
    ...animal,
    microchipNumber: internalDetails[animal.id]?.microchipNumber ?? null,
    careStatus: getCareStatus(
      vaccinesByAnimal[animal.id] ?? [],
      Boolean(internalDetails[animal.id]?.microchipNumber),
      Boolean(internalDetails[animal.id]?.inShelter),
    ),
  }));

  const speciesOptions = [...new Set(rows.map((row) => row.species))].sort();

  const columns: AdminTableColumn<AnimalRow>[] = [
    {
      header: t("columns.name"),
      sortable: true,
      sortAccessor: (row) => row.name.toLowerCase(),
      render: (row) => (
        <Link href={`/admin/animals/${row.id}/edit`} className="flex items-center gap-2.5 hover:text-accent">
          <AnimalThumb animal={row} />
          <span className="flex flex-col gap-px">
            <span className="text-[13px] font-bold">{row.name}</span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink/50">
              {t(`tracks.${row.track}`)}
            </span>
          </span>
        </Link>
      ),
    },
    {
      header: t("columns.species"),
      sortable: true,
      sortAccessor: (row) => row.species,
      className: "text-ink/66",
      render: (row) => row.species,
    },
    {
      header: t("columns.microchip"),
      sortable: true,
      sortAccessor: (row) => row.microchipNumber ?? "",
      className: "font-mono text-[11.5px] text-ink/60",
      render: (row) => row.microchipNumber ?? "—",
    },
    {
      header: t("columns.care"),
      render: (row) => <StatusPill tone={CARE_TONE[row.careStatus]}>{t(`care.${row.careStatus}`)}</StatusPill>,
    },
    {
      header: t("columns.published"),
      render: (row) => (
        <StatusPill tone={row.isPublished ? "accent" : "neutral"}>
          {row.isPublished ? t("publishedYes") : t("publishedNo")}
        </StatusPill>
      ),
    },
  ];

  const query = search.trim().toLowerCase();
  const filtered = rows
    .filter((row) => speciesFilter === "all" || row.species === speciesFilter)
    .filter((row) => {
      if (publicationFilter === "all") return true;
      return publicationFilter === "published" ? row.isPublished : !row.isPublished;
    })
    .filter(
      (row) =>
        !query ||
        row.name.toLowerCase().includes(query) ||
        row.species.toLowerCase().includes(query) ||
        (row.microchipNumber?.toLowerCase().includes(query) ?? false),
    );

  const activeColumn = columns.find((column) => column.header === sort.column);
  const sorted = activeColumn?.sortAccessor
    ? [...filtered].sort((a, b) => {
        const av = activeColumn.sortAccessor!(a);
        const bv = activeColumn.sortAccessor!(b);
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sort.direction === "asc" ? cmp : -cmp;
      })
    : filtered;

  function handleSortChange(column: string) {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" },
    );
  }

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
        {isAdmin ? (
          <AdminSelect
            value={publicationFilter}
            onChange={(event) => setPublicationFilter(event.target.value as PublicationFilter)}
            className="w-auto"
          >
            <option value="all">{t("publicationFilter.all")}</option>
            <option value="published">{t("publicationFilter.published")}</option>
            <option value="draft">{t("publicationFilter.draft")}</option>
          </AdminSelect>
        ) : null}
        <AdminListToolbar value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
        <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/50">
          {t("resultsCount", { count: sorted.length })}
        </span>
      </div>
      <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
        <AdminTable
          columns={columns}
          rows={sorted}
          emptyMessage={t("empty")}
          sortState={sort}
          onSortChange={handleSortChange}
          minWidth={860}
        />
      </div>
    </div>
  );
}
