"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { AdminTable, type AdminTableColumn, type AdminTableSortState } from "./AdminTable";
import { AdminListToolbar } from "./AdminListToolbar";
import { AdminSelect } from "./ui/AdminField";
import { AdminButton } from "./ui/AdminButton";
import { StatusPill } from "./ui/StatusPill";
import { formatCents } from "@/lib/format";
import type { DonationRow, DonationStatus } from "@/lib/donations";

const STATUS_TONE: Record<DonationStatus, "success" | "warning" | "danger"> = {
  completed: "success",
  pending: "warning",
  failed: "danger",
  refunded: "danger",
};

function toCsv(rows: DonationRow[], columns: { header: string; value: (row: DonationRow) => string }[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [
    columns.map((c) => escape(c.header)).join(","),
    ...rows.map((row) => columns.map((c) => escape(c.value(row))).join(",")),
  ];
  return lines.join("\n");
}

export function DonationsTableClient({ donations, locale }: { donations: DonationRow[]; locale: string }) {
  const t = useTranslations("admin.donations");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DonationStatus>("all");
  const [sort, setSort] = useState<AdminTableSortState>({
    column: t("columns.date"),
    direction: "desc",
  });

  const columns: AdminTableColumn<DonationRow>[] = [
    {
      header: t("columns.date"),
      className: "font-mono text-[11.5px] text-ink/66",
      sortable: true,
      sortAccessor: (row) => row.created_at,
      render: (row) => new Date(row.created_at).toLocaleDateString(locale),
    },
    {
      header: t("columns.donor"),
      render: (row) => (
        <span className="flex flex-col gap-px">
          <span className="text-[13px] font-bold">{row.donor_name || "—"}</span>
          <span className="text-[11.5px] text-ink/55">{row.donor_email || "—"}</span>
        </span>
      ),
    },
    {
      header: t("columns.amount"),
      className: "text-right font-mono text-[13px] font-medium",
      sortable: true,
      sortAccessor: (row) => row.amount_cents,
      render: (row) => formatCents(row.amount_cents, locale),
    },
    {
      header: t("columns.frequency"),
      className: "text-ink/66",
      render: (row) => t(`frequencies.${row.frequency}`),
    },
    {
      header: t("columns.status"),
      render: (row) => <StatusPill tone={STATUS_TONE[row.status]}>{t(`statusLabels.${row.status}`)}</StatusPill>,
    },
  ];

  const query = search.trim().toLowerCase();
  const filtered = donations.filter((row) => {
    if (statusFilter !== "all" && row.status !== statusFilter) return false;
    if (!query) return true;
    return (
      (row.donor_name ?? "").toLowerCase().includes(query) ||
      (row.donor_email ?? "").toLowerCase().includes(query)
    );
  });

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

  function handleExport() {
    const csv = toCsv(sorted, [
      { header: t("columns.date"), value: (row) => new Date(row.created_at).toLocaleDateString(locale) },
      { header: t("columns.donor"), value: (row) => row.donor_name || row.donor_email || "" },
      { header: t("columns.amount"), value: (row) => (row.amount_cents / 100).toFixed(2) },
      { header: t("columns.frequency"), value: (row) => t(`frequencies.${row.frequency}`) },
      { header: t("columns.status"), value: (row) => t(`statusLabels.${row.status}`) },
    ]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dons-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-admin border border-ink/10 bg-surface">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-ink/10 p-[14px_18px]">
        <h2 className="text-[14.5px]">{t("title")}</h2>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <AdminListToolbar value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
          <AdminSelect
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="w-auto"
          >
            <option value="all">{t("statusFilter.all")}</option>
            <option value="completed">{t("statusFilter.completed")}</option>
            <option value="pending">{t("statusFilter.pending")}</option>
            <option value="failed">{t("statusFilter.failed")}</option>
            <option value="refunded">{t("statusFilter.refunded")}</option>
          </AdminSelect>
          <AdminButton size="sm" onClick={handleExport}>
            <Download size={13} />
            {t("exportCsv")}
          </AdminButton>
        </div>
      </div>
      <AdminTable
        columns={columns}
        rows={sorted}
        emptyMessage={t("empty")}
        sortState={sort}
        onSortChange={handleSortChange}
        minWidth={720}
      />
    </div>
  );
}
