import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { listVetVisitsForAnimal, type VetVisitForAnimal } from "@/lib/vet-visits";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";

export default async function AnimalVetAppointmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const visits = await listVetVisitsForAnimal(supabase, id);
  const t = await getTranslations("admin.animals.vetAppointments");
  const statusT = await getTranslations("admin.calendar.statuses");

  const columns: AdminTableColumn<VetVisitForAnimal>[] = [
    { header: t("scheduledAt"), render: (row) => new Date(row.scheduledAt).toLocaleString() },
    { header: t("reason"), render: (row) => row.reason },
    { header: t("status"), render: (row) => statusT(row.status) },
    { header: t("followUpDate"), render: (row) => row.followUpDate ?? "—" },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <Link href={`/admin/calendar/${row.id}`} className="font-bold text-accent">
          {t("view")}
        </Link>
      ),
    },
  ];

  return <AdminTable columns={columns} rows={visits} emptyMessage={t("empty")} />;
}
