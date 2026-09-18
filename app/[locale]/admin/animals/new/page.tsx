import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { AnimalForm } from "@/components/admin/AnimalForm";
import { AdminPage } from "@/components/admin/AdminPage";

export default async function NewAnimalPage() {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.animals");

  return (
    <AdminPage title={t("add")} meta={t("title")}>
      <div className="rounded-admin border border-ink/10 bg-surface p-[18px]">
        <AnimalForm />
      </div>
    </AdminPage>
  );
}
