import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { AnimalForm } from "@/components/admin/AnimalForm";

export default async function NewAnimalPage() {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.animals");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">{t("add")}</h1>
      <AnimalForm />
    </div>
  );
}
