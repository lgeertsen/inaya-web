import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listAnimalVaccines, type AnimalVaccine } from "@/lib/animal-care";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { DeleteRowButton } from "@/components/admin/DeleteRowButton";
import { ToggleCheckbox } from "@/components/admin/ToggleCheckbox";
import { AnimalVaccineForm } from "@/components/admin/AnimalVaccineForm";

export default async function AnimalVaccinesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
