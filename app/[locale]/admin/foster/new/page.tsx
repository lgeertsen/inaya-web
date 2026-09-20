import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listVolunteerAccounts } from "@/lib/accounts";
import { AdminPage } from "@/components/admin/AdminPage";
import { FosterFamilyForm } from "@/components/admin/FosterFamilyForm";

export default async function NewFosterFamilyPage() {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.foster");
  const supabase = await createClient();

  const [accounts, { data: linked }] = await Promise.all([
    listVolunteerAccounts(createAdminClient()),
    supabase.from("foster_families").select("user_id").not("user_id", "is", null),
  ]);
  const linkedIds = new Set((linked ?? []).map((row) => row.user_id as string));
  const accountOptions = accounts
    .filter((account) => !linkedIds.has(account.id))
    .map((account) => ({ id: account.id, email: account.email }));

  return (
    <AdminPage title={t("newTitle")} meta={t("newMeta")}>
      <div className="rounded-admin border border-ink/10 bg-surface p-[18px]">
        <FosterFamilyForm accountOptions={accountOptions} />
      </div>
    </AdminPage>
  );
}
