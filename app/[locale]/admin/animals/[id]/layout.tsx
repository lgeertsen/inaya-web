import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getAnimalById } from "@/lib/animals";
import { getAnimalInternalDetails } from "@/lib/animal-care";
import { AnimalDetailTabs } from "@/components/admin/AnimalDetailTabs";

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

  const details = await getAnimalInternalDetails(supabase, id);
  const t = await getTranslations("admin.animals.internalDetails");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl">{animal.name}</h1>
        <span className="text-sm opacity-60">{animal.species}</span>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-pill ${
            details?.inShelter ? "bg-accent/10 text-accent" : "bg-ink/10 text-ink/60"
          }`}
        >
          {details?.inShelter ? t("inShelterYes") : t("inShelterNo")}
        </span>
      </div>
      <AnimalDetailTabs animalId={id} />
      {children}
    </div>
  );
}
