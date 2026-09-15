"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminTable, type AdminTableColumn, type AdminTableSortState } from "./AdminTable";
import { AdminListToolbar } from "./AdminListToolbar";
import { Badge } from "@/components/ui/Badge";

export interface DonationRow {
  id: string;
  created_at: string;
  donor_name: string | null;
  donor_email: string | null;
  amount_cents: number;
  frequency: string;
  status: string;
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  completed: "success",
  pending: "warning",
  failed: "danger",
  refunded: "danger",
};

export function DonationsTableClient({ donations }: { donations: DonationRow[] }) {
  const t = useTranslations("admin.donations");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<AdminTableSortState>({
    column: t("columns.date"),
    direction: "desc",
  });

  const columns: AdminTableColumn<DonationRow>[] = [
    {
      header: t("columns.date"),
      sortable: true,
      sortAccessor: (row) => row.created_at,
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      header: t("columns.donor"),
      render: (row) => row.donor_name || row.donor_email || "—",
    },
    {
      header: t("columns.amount"),
      sortable: true,
      sortAccessor: (row) => row.amount_cents,
      render: (row) => `${(row.amount_cents / 100).toFixed(2)} €`,
    },
    {
      header: t("columns.frequency"),
      render: (row) => row.frequency,
    },
    {
      header: t("columns.status"),
      render: (row) => <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status}</Badge>,
    },
  ];

  const query = search.trim().toLowerCase();
  const filtered = query
    ? donations.filter(
        (row) =>
          (row.donor_name ?? "").toLowerCase().includes(query) ||
          (row.donor_email ?? "").toLowerCase().includes(query),
      )
    : donations;

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
      <AdminListToolbar value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
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
