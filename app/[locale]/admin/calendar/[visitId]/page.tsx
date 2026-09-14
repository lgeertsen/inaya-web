import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getVetVisit, type VetVisitAnimal } from "@/lib/vet-visits";
import { listAnimalOptions } from "@/lib/animals";
import { VetVisitForm } from "@/components/admin/VetVisitForm";
import { RetrySyncButton } from "@/components/admin/RetrySyncButton";
import { DeleteRowButton } from "@/components/admin/DeleteRowButton";
import { ToggleCheckbox } from "@/components/admin/ToggleCheckbox";
import { AddAnimalToVisitForm } from "@/components/admin/AddAnimalToVisitForm";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";

export default async function VetVisitDetailPage({
  params,
}: {
  params: Promise<{ visitId: string }>;
}) {
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
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl">{visit.reason}</h1>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-pill ${
              visit.googleSyncError || visit.googleEventId
                ? "bg-accent/10 text-accent"
                : "bg-ink/10 text-ink/60"
            }`}
            title={visit.googleSyncError ?? undefined}
          >
            {visit.googleSyncError
              ? t("syncFailed")
              : visit.googleEventId
                ? t("syncSynced")
                : t("syncPending")}
          </span>
          <RetrySyncButton visitId={visit.id} label={t("retrySync")} />
          <DeleteRowButton
            endpoint={`/api/admin/vet-visits/${visit.id}`}
            label={t("delete")}
            confirmMessage={t("deleteConfirm")}
          />
        </div>
      </div>

      <VetVisitForm visit={visit} animalOptions={animalOptions} />

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t("animals")}</h2>
        <AdminTable
          columns={animalColumns}
          rows={visit.animals.map((a) => ({ ...a, id: a.animalId }))}
          emptyMessage={t("empty")}
        />
        {availableToAdd.length > 0 ? (
          <AddAnimalToVisitForm visitId={visit.id} animalOptions={availableToAdd} label={t("addAnimal")} />
        ) : null}
      </div>
    </div>
  );
}
