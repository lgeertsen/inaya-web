import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnimals } from "@/lib/animals";
import { listInShelterStatuses } from "@/lib/animal-care";
import { AnimalsTableClient } from "@/components/admin/AnimalsTableClient";

export default async function AdminAnimalsPage() {
  const t = await getTranslations("admin.animals");
  const role = await getPageRole();
  const isAdmin = role === "admin";
  const supabase = await createClient();
  const [animals, inShelterStatuses] = await Promise.all([
    getAnimals(supabase, { publishedOnly: false }),
    listInShelterStatuses(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">{t("title")}</h1>
        {isAdmin ? <ButtonLink href="/admin/animals/new">{t("add")}</ButtonLink> : null}
      </div>

      {animals.length === 0 ? (
        <p className="opacity-60 text-sm">{t("empty")}</p>
      ) : (
        <AnimalsTableClient animals={animals} inShelterStatuses={inShelterStatuses} isAdmin={isAdmin} />
      )}
    </div>
  );
}
