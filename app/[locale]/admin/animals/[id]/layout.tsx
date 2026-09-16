import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnimalById } from "@/lib/animals";
import { getAnimalInternalDetails } from "@/lib/animal-care";
import { AnimalDetailTabs } from "@/components/admin/AnimalDetailTabs";
import { Badge } from "@/components/ui/Badge";

export default async function AnimalDetailLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const animal = await getAnimalById(supabase, id);
  if (!animal) notFound();

  const role = await getPageRole();
  if (role !== "admin") {
    // Volunteers only ever reach the (cut-down) edit route under this
    // segment — no internal-ops data to fetch, no tabs into admin-only pages.
    // They may only reach animals currently at the shelter: the list page
    // already filters to those, but this closes the direct-URL bypass for
    // anyone who navigates straight to an id that isn't (anymore).
    const details = await getAnimalInternalDetails(supabase, id);
    if (!details?.inShelter) notFound();

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl">{animal.name}</h1>
          <span className="text-sm opacity-60">{animal.species}</span>
        </div>
        {children}
      </div>
    );
  }

  const details = await getAnimalInternalDetails(supabase, id);
  const t = await getTranslations("admin.animals.internalDetails");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl">{animal.name}</h1>
        <span className="text-sm opacity-60">{animal.species}</span>
        <Badge tone={details?.inShelter ? "success" : "neutral"}>
          {details?.inShelter ? t("inShelterYes") : t("inShelterNo")}
        </Badge>
      </div>
      <AnimalDetailTabs animalId={id} />
      {children}
    </div>
  );
}
