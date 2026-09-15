import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listAnimalVaccines, type AnimalVaccine } from "@/lib/animal-care";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { DeleteRowButton } from "@/components/admin/DeleteRowButton";
import { ToggleCheckbox } from "@/components/admin/ToggleCheckbox";
import { RetrySyncButton } from "@/components/admin/RetrySyncButton";
import { AnimalVaccineForm } from "@/components/admin/AnimalVaccineForm";

export default async function AnimalVaccinesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const { id } = await params;
  const supabase = await createClient();
  const vaccines = await listAnimalVaccines(supabase, id);
  const t = await getTranslations("admin.animals.vaccines");

  const columns: AdminTableColumn<AnimalVaccine>[] = [
    { header: t("name"), render: (row) => row.name },
    { header: t("administeredOn"), render: (row) => row.administeredOn },
    { header: t("followUpDate"), render: (row) => row.followUpDate ?? "—" },
    {
      header: t("followUpCompleted"),
      render: (row) => (
        <ToggleCheckbox
          endpoint={`/api/admin/animals/${id}/vaccines/${row.id}`}
          field="followUpCompleted"
          checked={row.followUpCompleted}
        />
      ),
    },
    {
      header: t("sync"),
      render: (row) =>
        row.followUpDate && !row.followUpCompleted ? (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-pill ${
                row.googleSyncError || row.googleEventId
                  ? "bg-accent/10 text-accent"
                  : "bg-ink/10 text-ink/60"
              }`}
              title={row.googleSyncError ?? undefined}
            >
              {row.googleSyncError ? t("syncFailed") : row.googleEventId ? t("syncSynced") : t("syncPending")}
            </span>
            <RetrySyncButton
              endpoint={`/api/admin/animals/${id}/vaccines/${row.id}/retry-sync`}
              label={t("retrySync")}
            />
          </div>
        ) : (
          "—"
        ),
    },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <DeleteRowButton
          endpoint={`/api/admin/animals/${id}/vaccines/${row.id}`}
          label={t("delete")}
          confirmMessage={t("deleteConfirm")}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <AdminTable columns={columns} rows={vaccines} emptyMessage={t("empty")} />
      <div className="flex flex-col gap-3 max-w-2xl">
        <h2 className="text-lg font-bold">{t("add")}</h2>
        <AnimalVaccineForm animalId={id} />
      </div>
    </div>
  );
}
