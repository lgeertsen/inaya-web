import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listAnimalVetAppointments, type AnimalVetAppointment } from "@/lib/animal-care";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { DeleteRowButton } from "@/components/admin/DeleteRowButton";
import { VetAppointmentStatusSelect } from "@/components/admin/VetAppointmentStatusSelect";
import { AnimalVetAppointmentForm } from "@/components/admin/AnimalVetAppointmentForm";

export default async function AnimalVetAppointmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const appointments = await listAnimalVetAppointments(supabase, id);
  const t = await getTranslations("admin.animals.vetAppointments");

  const columns: AdminTableColumn<AnimalVetAppointment>[] = [
    { header: t("scheduledAt"), render: (row) => new Date(row.scheduledAt).toLocaleString() },
    { header: t("reason"), render: (row) => row.reason },
    {
      header: t("status"),
      render: (row) => (
        <VetAppointmentStatusSelect
          endpoint={`/api/admin/animals/${id}/vet-appointments/${row.id}`}
          status={row.status}
        />
      ),
    },
    { header: t("followUpDate"), render: (row) => row.followUpDate ?? "—" },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <DeleteRowButton
          endpoint={`/api/admin/animals/${id}/vet-appointments/${row.id}`}
          label={t("delete")}
          confirmMessage={t("deleteConfirm")}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <AdminTable columns={columns} rows={appointments} emptyMessage={t("empty")} />
      <div className="flex flex-col gap-3 max-w-2xl">
        <h2 className="text-lg font-bold">{t("add")}</h2>
        <AnimalVetAppointmentForm animalId={id} />
      </div>
    </div>
  );
}
