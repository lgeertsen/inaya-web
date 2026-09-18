import { getTranslations } from "next-intl/server";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnimals } from "@/lib/animals";
import { listInternalDetailsSummaries, listAllVaccinesByAnimal } from "@/lib/animal-care";
import { AdminPage } from "@/components/admin/AdminPage";
import { AnimalsTableClient } from "@/components/admin/AnimalsTableClient";
import { VolunteerAnimalsCards } from "@/components/admin/VolunteerAnimalsCards";

export default async function AdminAnimalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations("admin.animals");
  const role = await getPageRole();
  const isAdmin = role === "admin";
  const { q } = await searchParams;
  const supabase = await createClient();
  const [animals, internalDetails, vaccinesByAnimal] = await Promise.all([
    getAnimals(supabase, { publishedOnly: false }),
    listInternalDetailsSummaries(supabase),
    listAllVaccinesByAnimal(supabase),
  ]);

  // This page only lists animals currently at the shelter — former animals
  // (adopted, deceased, ...) live on the separate /admin/animals/archive
  // page. Filtered server-side so a volunteer's browser never receives the rest.
  const visibleAnimals = animals.filter((animal) => internalDetails[animal.id]?.inShelter);

  return (
    <AdminPage title={t("title")} meta={t("meta", { count: visibleAnimals.length })}>
      {isAdmin ? (
        visibleAnimals.length === 0 ? (
          <p className="text-sm text-ink/60">{t("empty")}</p>
        ) : (
          <AnimalsTableClient
            animals={visibleAnimals}
            internalDetails={internalDetails}
            vaccinesByAnimal={vaccinesByAnimal}
            isAdmin={isAdmin}
            initialSearch={q ?? ""}
          />
        )
      ) : (
        <VolunteerAnimalsCards
          animals={visibleAnimals}
          internalDetails={internalDetails}
          vaccinesByAnimal={vaccinesByAnimal}
          initialSearch={q ?? ""}
        />
      )}
    </AdminPage>
  );
}
