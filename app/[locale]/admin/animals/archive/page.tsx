import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnimals } from "@/lib/animals";
import { listInternalDetailsSummaries, listAllVaccinesByAnimal } from "@/lib/animal-care";
import { AdminPage } from "@/components/admin/AdminPage";
import { AnimalsTableClient } from "@/components/admin/AnimalsTableClient";

export default async function AdminAnimalsArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.animals");
  const { q } = await searchParams;
  const supabase = await createClient();
  const [animals, internalDetails, vaccinesByAnimal] = await Promise.all([
    getAnimals(supabase, { publishedOnly: false }),
    listInternalDetailsSummaries(supabase),
    listAllVaccinesByAnimal(supabase),
  ]);

  // The mirror image of /admin/animals: animals no longer at the shelter
  // (adopted, deceased, transferred, ...) instead of the current ones.
  const archivedAnimals = animals.filter((animal) => !internalDetails[animal.id]?.inShelter);

  return (
    <AdminPage title={t("archiveTitle")} meta={t("archiveMeta", { count: archivedAnimals.length })}>
      {archivedAnimals.length === 0 ? (
        <p className="text-sm text-ink/60">{t("archiveEmpty")}</p>
      ) : (
        <AnimalsTableClient
          animals={archivedAnimals}
          internalDetails={internalDetails}
          vaccinesByAnimal={vaccinesByAnimal}
          isAdmin
          initialSearch={q ?? ""}
        />
      )}
    </AdminPage>
  );
}
