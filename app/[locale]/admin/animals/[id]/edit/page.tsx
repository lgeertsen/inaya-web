import { notFound } from "next/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnimalById } from "@/lib/animals";
import { getAnimalInternalDetails } from "@/lib/animal-care";
import { listPlacementsForAnimal } from "@/lib/foster";
import { AnimalForm } from "@/components/admin/AnimalForm";
import { VolunteerPhotoPanel } from "@/components/admin/VolunteerPhotoPanel";

export default async function EditAnimalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const animal = await getAnimalById(supabase, id);

  if (!animal) {
    notFound();
  }

  const role = await getPageRole();

  if (role !== "admin") {
    return <VolunteerPhotoPanel animal={animal} />;
  }

  const [internalDetails, placements] = await Promise.all([
    getAnimalInternalDetails(supabase, id),
    listPlacementsForAnimal(supabase, id),
  ]);
  const hasOpenPlacement = placements.some((placement) => placement.endedOn === null);

  return (
    <div className="rounded-admin border border-ink/10 bg-surface p-[18px]">
      <AnimalForm animal={animal} internalDetails={internalDetails} locationLocked={hasOpenPlacement} />
    </div>
  );
}
