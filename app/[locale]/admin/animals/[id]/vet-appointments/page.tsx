import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listVetVisitsForAnimal, type VetVisitForAnimal } from "@/lib/vet-visits";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";

export default async function AnimalVetAppointmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const { id } = await params;
  const supabase = await createClient();
  const visits = await listVetVisitsForAnimal(supabase, id);
  const t = await getTranslations("admin.animals.vetAppointments");
  const statusT = await getTranslations("admin.calendar.statuses");

  const columns: AdminTableColumn<VetVisitForAnimal>[] = [
    {
      header: t("scheduledAt"),
      className: "font-mono text-[11.5px] text-ink/66",
      render: (row) => new Date(row.scheduledAt).toLocaleString(locale),
    },
    { header: t("reason"), className: "font-bold", render: (row) => row.reason },
    { header: t("status"), className: "text-ink/66", render: (row) => statusT(row.status) },
    {
      header: t("followUpDate"),
      className: "font-mono text-[11.5px] text-ink/66",
      render: (row) => (row.followUpDate ? new Date(row.followUpDate).toLocaleDateString(locale) : "—"),
    },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <Link
          href={{ pathname: "/admin/calendar/[visitId]", params: { visitId: row.id } }}
          className="inline-flex items-center rounded-[7px] border border-ink/14 bg-surface px-2.5 py-[5px] text-[12px] font-bold hover:border-ink"
        >
          {t("view")}
        </Link>
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
      <AdminTable columns={columns} rows={visits} emptyMessage={t("empty")} minWidth={620} />
    </div>
  );
}
