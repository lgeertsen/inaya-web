import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listVolunteerAccounts, type VolunteerAccount } from "@/lib/accounts";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { DeleteRowButton } from "@/components/admin/DeleteRowButton";
import { CreateVolunteerAccountForm } from "@/components/admin/CreateVolunteerAccountForm";

export default async function AdminAccountsPage() {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.accounts");
  const accounts = await listVolunteerAccounts(createAdminClient());

  const columns: AdminTableColumn<VolunteerAccount>[] = [
    { header: t("email"), render: (row) => row.email },
    {
      header: t("createdAt"),
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <DeleteRowButton
          endpoint={`/api/admin/accounts/${row.id}`}
          label={t("delete")}
          confirmMessage={t("deleteConfirm")}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl">{t("title")}</h1>
      <AdminTable columns={columns} rows={accounts} emptyMessage={t("empty")} />
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("add")}</h2>
        <CreateVolunteerAccountForm />
      </div>
    </div>
  );
}
