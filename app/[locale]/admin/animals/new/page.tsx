import { getTranslations } from "next-intl/server";
import { AnimalForm } from "@/components/admin/AnimalForm";

export default async function NewAnimalPage() {
  const t = await getTranslations("admin.animals");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">{t("add")}</h1>
      <AnimalForm />
    </div>
  );
}
