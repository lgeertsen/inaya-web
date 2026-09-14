import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listAnimalTreatments, type AnimalTreatment } from "@/lib/animal-care";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { DeleteRowButton } from "@/components/admin/DeleteRowButton";
import { AnimalTreatmentForm } from "@/components/admin/AnimalTreatmentForm";

export default async function AnimalTreatmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const treatments = await listAnimalTreatments(supabase, id);
  const t = await getTranslations("admin.animals.treatments");

  const columns: AdminTableColumn<AnimalTreatment>[] = [
    { header: t("name"), render: (row) => row.name },
    { header: t("medicine"), render: (row) => row.medicine },
    {
      header: t("amount"),
      render: (row) => `${row.amount} ${t(`measurementUnits.${row.measurement}`)}`,
    },
    {
      header: t("dayStep"),
      render: (row) =>
        row.dayStep && row.dayTimes
          ? t("schedule", { days: row.dayStep, times: row.dayTimes })
          : "—",
    },
    { header: t("startDate"), render: (row) => row.startDate },
    { header: t("endDate"), render: (row) => row.endDate ?? "—" },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <DeleteRowButton
          endpoint={`/api/admin/animals/${id}/treatments/${row.id}`}
          label={t("delete")}
          confirmMessage={t("deleteConfirm")}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <AdminTable columns={columns} rows={treatments} emptyMessage={t("empty")} />
      <div className="flex flex-col gap-3 max-w-2xl">
        <h2 className="text-lg font-bold">{t("add")}</h2>
        <AnimalTreatmentForm animalId={id} />
      </div>
    </div>
  );
}
