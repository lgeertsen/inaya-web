import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listVolunteerAccounts, type VolunteerAccount } from "@/lib/accounts";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { DeleteRowButton } from "@/components/admin/DeleteRowButton";
import { CreateVolunteerAccountForm } from "@/components/admin/CreateVolunteerAccountForm";
import { StatusPill } from "@/components/admin/ui/StatusPill";
import { getInitialsFromEmail, formatRelativeDate } from "@/lib/format";

export default async function AdminAccountsPage() {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.accounts");
  const tNav = await getTranslations("admin.nav");
  const accounts = await listVolunteerAccounts(createAdminClient());

  const columns: AdminTableColumn<VolunteerAccount>[] = [
    {
      header: t("email"),
      render: (row) => (
        <span className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-pill bg-ink/6 font-mono text-[10.5px] text-ink/60">
            {getInitialsFromEmail(row.email)}
          </span>
          <span className="text-[12.5px]">{row.email}</span>
        </span>
      ),
    },
    {
      header: t("createdAt"),
      className: "font-mono text-[11.5px] text-ink/60",
      render: (row) => new Date(row.createdAt).toLocaleDateString(locale),
    },
    {
      header: t("lastActivity"),
      className: "text-[12px] text-ink/60",
      render: (row) => (row.lastActiveAt ? formatRelativeDate(row.lastActiveAt, locale) : t("neverActive")),
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
    <AdminPage title={tNav("accounts")} meta={t("activeCount", { count: accounts.length })}>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-admin border border-ink/10 bg-surface overflow-hidden min-w-0">
          <div className="flex items-center gap-2.5 border-b border-ink/10 p-[14px_18px]">
            <h2 className="text-[14.5px]">{t("title")}</h2>
            <StatusPill>{t("activeCount", { count: accounts.length })}</StatusPill>
          </div>
          <AdminTable columns={columns} rows={accounts} emptyMessage={t("empty")} minWidth={620} />
        </div>

        <CreateVolunteerAccountForm />
      </div>
    </AdminPage>
  );
}
