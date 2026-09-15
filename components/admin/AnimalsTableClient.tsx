"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AdminTable, type AdminTableColumn, type AdminTableSortState } from "./AdminTable";
import { AdminListToolbar } from "./AdminListToolbar";
import { DeleteAnimalButton } from "./DeleteAnimalButton";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import type { Animal } from "@/lib/animals";

interface AnimalRow extends Animal {
  inShelter: boolean;
}

export function AnimalsTableClient({
  animals,
  inShelterStatuses,
  isAdmin,
}: {
  animals: Animal[];
  inShelterStatuses: Record<string, boolean>;
  isAdmin: boolean;
}) {
  const t = useTranslations("admin.animals");
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [sort, setSort] = useState<AdminTableSortState>({
    column: t("columns.name"),
    direction: "asc",
  });

  const rows: AnimalRow[] = animals.map((animal) => ({
    ...animal,
    inShelter: inShelterStatuses[animal.id] ?? false,
  }));

  const speciesOptions = [...new Set(rows.map((row) => row.species))].sort();

  const columns: AdminTableColumn<AnimalRow>[] = [
    {
      header: t("columns.name"),
      sortable: true,
      sortAccessor: (row) => row.name.toLowerCase(),
      render: (row) => <span className="font-bold">{row.name}</span>,
    },
    {
      header: t("columns.species"),
      sortable: true,
      sortAccessor: (row) => row.species,
      render: (row) => <span className="text-ink/60">{row.species}</span>,
    },
    {
      header: t("columns.trackStatus"),
      render: (row) => (
        <span className="text-ink/60">
          {row.track} / {row.status}
        </span>
      ),
    },
    {
      header: t("columns.published"),
      render: (row) => (
        <Badge tone={row.isPublished ? "success" : "neutral"}>
          {row.isPublished ? t("publishedYes") : t("publishedNo")}
        </Badge>
      ),
    },
    {
      header: t("columns.inShelter"),
      render: (row) => (
        <Badge tone={row.inShelter ? "success" : "neutral"}>
          {row.inShelter ? t("internalDetails.inShelterYes") : t("internalDetails.inShelterNo")}
        </Badge>
      ),
    },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-4">
          <Link href={`/admin/animals/${row.id}/edit`} className="font-bold text-accent">
            {isAdmin ? t("edit") : t("photos")}
          </Link>
          {isAdmin ? (
            <DeleteAnimalButton
              animalId={row.id}
              label={t("delete")}
              confirmMessage={t("deleteConfirm")}
            />
          ) : null}
        </div>
      ),
    },
  ];

  const query = search.trim().toLowerCase();
  const filtered = rows
    .filter((row) => speciesFilter === "all" || row.species === speciesFilter)
    .filter(
      (row) =>
        !query ||
        row.name.toLowerCase().includes(query) ||
        row.species.toLowerCase().includes(query),
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <AdminListToolbar value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
        <Select
          value={speciesFilter}
          onChange={(event) => setSpeciesFilter(event.target.value)}
          className="max-w-[180px]"
        >
          <option value="all">{t("allSpecies")}</option>
          {speciesOptions.map((species) => (
            <option key={species} value={species}>
              {species}
            </option>
          ))}
        </Select>
      </div>
      <AdminTable
        columns={columns}
        rows={sorted}
        emptyMessage={t("empty")}
        sortState={sort}
        onSortChange={handleSortChange}
      />
    </div>
  );
}
