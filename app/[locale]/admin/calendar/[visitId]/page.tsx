import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getVetVisit, type VetVisitAnimal } from "@/lib/vet-visits";
import { listAnimalOptions } from "@/lib/animals";
import { AdminPage } from "@/components/admin/AdminPage";
import { VetVisitForm } from "@/components/admin/VetVisitForm";
import { RetrySyncButton } from "@/components/admin/RetrySyncButton";
import { DeleteRowButton } from "@/components/admin/DeleteRowButton";
import { ToggleCheckbox } from "@/components/admin/ToggleCheckbox";
import { AddAnimalToVisitForm } from "@/components/admin/AddAnimalToVisitForm";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { StatusPill } from "@/components/admin/ui/StatusPill";

export default async function VetVisitDetailPage({
  params,
}: {
  params: Promise<{ visitId: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const { visitId } = await params;
  const supabase = await createClient();
  const [visit, animalOptions] = await Promise.all([
    getVetVisit(supabase, visitId),
    listAnimalOptions(supabase),
  ]);

  if (!visit) notFound();

  const t = await getTranslations("admin.calendar");
  const availableToAdd = animalOptions.filter(
    (option) => !visit.animals.some((a) => a.animalId === option.id),
  );

  const animalColumns: AdminTableColumn<VetVisitAnimal & { id: string }>[] = [
    { header: t("animals"), render: (row) => row.animalName },
    { header: t("notes"), render: (row) => row.notes ?? "—" },
    { header: t("followUpDate"), render: (row) => row.followUpDate ?? "—" },
    {
      header: t("followUpCompleted"),
      render: (row) => (
        <ToggleCheckbox
          endpoint={`/api/admin/vet-visits/${visitId}/animals/${row.animalId}`}
          field="followUpCompleted"
          checked={row.followUpCompleted}
        />
      ),
    },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <DeleteRowButton
          endpoint={`/api/admin/vet-visits/${visitId}/animals/${row.animalId}`}
          label={t("removeAnimal")}
          confirmMessage={t("removeAnimalConfirm")}
          iconOnly
        />
      ),
    },
  ];

  const scheduledLabel = new Date(visit.scheduledAt).toLocaleString(locale, {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <AdminPage title={visit.reason} meta={scheduledLabel}>
      <div className="flex flex-wrap items-center gap-2.5">
        <StatusPill tone={visit.googleSyncError ? "danger" : visit.googleEventId ? "success" : "warning"}>
          {visit.googleSyncError ? t("syncFailed") : visit.googleEventId ? t("syncSynced") : t("syncPending")}
        </StatusPill>
        <RetrySyncButton endpoint={`/api/admin/vet-visits/${visit.id}/retry-sync`} label={t("retrySync")} />
        <DeleteRowButton
          endpoint={`/api/admin/vet-visits/${visit.id}`}
          label={t("delete")}
          confirmMessage={t("deleteConfirm")}
        />
      </div>

      <div className="rounded-admin border border-ink/10 bg-surface p-[18px]">
        <VetVisitForm visit={visit} animalOptions={animalOptions} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-[14.5px]">{t("animals")}</h2>
        <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
          <AdminTable
            columns={animalColumns}
            rows={visit.animals.map((a) => ({ ...a, id: a.animalId }))}
            emptyMessage={t("empty")}
            minWidth={560}
          />
        </div>
        {availableToAdd.length > 0 ? (
          <AddAnimalToVisitForm visitId={visit.id} animalOptions={availableToAdd} label={t("addAnimal")} />
        ) : null}
      </div>
    </AdminPage>
  );
}
