import { getLocale, getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listFosterFamilies, type FosterFamilyWithLoad } from "@/lib/foster";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { DeleteRowButton } from "@/components/admin/DeleteRowButton";
import { AdminButton, AdminButtonLink } from "@/components/admin/ui/AdminButton";
import { AdminSelect } from "@/components/admin/ui/AdminField";
import { StatusPill } from "@/components/admin/ui/StatusPill";

const SPECIES = ["cat", "dog", "horse", "goat", "other"] as const;
const STATUS_TONE = { active: "success", paused: "warning", inactive: "neutral" } as const;

export default async function AdminFosterPage({
  searchParams,
}: {
  searchParams: Promise<{ species?: string; free?: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.foster");
  const { species: rawSpecies, free } = await searchParams;
  const species = SPECIES.find((s) => s === rawSpecies);
  const onlyFree = free === "1";

  const supabase = await createClient();
  const families = await listFosterFamilies(supabase);

  // "Who can take this cat right now?": only active households with a free
  // spot for the chosen species. Without filters every family is listed.
  const filtered = families.filter(
    (family) =>
      (!species || family.acceptedSpecies.includes(species)) &&
      (!onlyFree || (family.status === "active" && family.currentCount < family.capacity)),
  );
  const totalAnimals = families.reduce((sum, family) => sum + family.currentCount, 0);

  const columns: AdminTableColumn<FosterFamilyWithLoad>[] = [
    {
      header: t("columns.family"),
      render: (row) => (
        <Link
          href={{ pathname: "/admin/foster/[familyId]", params: { familyId: row.id } }}
          className="flex flex-col gap-0.5"
        >
          <span className="text-[13px] font-bold hover:underline">{row.name}</span>
          {row.contactName ? <span className="text-xs text-ink/55">{row.contactName}</span> : null}
        </Link>
      ),
    },
    { header: t("columns.city"), className: "text-ink/66", render: (row) => row.city ?? "—" },
    {
      header: t("columns.species"),
      className: "text-[12.5px] text-ink/66",
      render: (row) => row.acceptedSpecies.map((s) => t(`speciesPlural.${s}`)).join(", ") || "—",
    },
    {
      header: t("columns.capacity"),
      render: (row) => {
        const full = row.currentCount >= row.capacity;
        const percent = row.capacity > 0 ? Math.min(100, Math.round((row.currentCount / row.capacity) * 100)) : 100;
        return (
          <span className="flex items-center gap-2.5">
            <span className="block h-[6px] w-[54px] overflow-hidden rounded-pill bg-ink/7">
              <span
                className={`block h-full rounded-pill ${full ? "bg-warning" : "bg-success"}`}
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className="font-mono text-[11.5px] text-ink/70">
              {t("capacityValue", { used: row.currentCount, capacity: row.capacity })}
            </span>
          </span>
        );
      },
    },
    {
      header: t("columns.status"),
      render: (row) => <StatusPill tone={STATUS_TONE[row.status]}>{t(`statuses.${row.status}`)}</StatusPill>,
    },
    {
      header: t("columns.checkins"),
      render: (row) =>
        row.overdueCheckinCount > 0 ? (
          <StatusPill tone="danger">{t("checkinOverdue", { count: row.overdueCheckinCount })}</StatusPill>
        ) : row.currentCount > 0 ? (
          <span className="text-xs text-ink/55">{t("checkinOk")}</span>
        ) : (
          <span className="text-xs text-ink/35">—</span>
        ),
    },
    {
      header: "",
      className: "text-right",
      render: (row) =>
        row.totalPlacements === 0 ? (
          <DeleteRowButton
            endpoint={`/api/admin/foster/${row.id}`}
            label={t("delete")}
            confirmMessage={t("deleteConfirm")}
            iconOnly
          />
        ) : null,
    },
  ];

  return (
    <AdminPage title={t("title")} meta={t("meta", { count: families.length, animals: totalAnimals })}>
      <div className="flex flex-wrap items-end gap-3">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-[5px]">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink/55">
              {t("filters.species")}
            </span>
            <AdminSelect name="species" defaultValue={species ?? ""} className="w-auto">
              <option value="">{t("filters.allSpecies")}</option>
              {SPECIES.map((s) => (
                <option key={s} value={s}>
                  {t(`speciesPlural.${s}`)}
                </option>
              ))}
            </AdminSelect>
          </label>
          <label className="flex items-center gap-2 pb-2.5 text-[12.5px] font-semibold">
            <input type="checkbox" name="free" value="1" defaultChecked={onlyFree} />
            {t("filters.onlyFree")}
          </label>
          <AdminButton type="submit" size="sm">
            {t("filters.apply")}
          </AdminButton>
        </form>
        <AdminButtonLink href="/admin/foster/new" variant="dark" className="ml-auto">
          <Plus size={15} strokeWidth={2.2} />
          {t("add")}
        </AdminButtonLink>
      </div>

      <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
        <AdminTable
          columns={columns}
          rows={filtered}
          emptyMessage={families.length === 0 ? t("empty") : t("emptyFiltered")}
          minWidth={780}
        />
      </div>
    </AdminPage>
  );
}
