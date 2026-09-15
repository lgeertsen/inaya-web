import { notFound } from "next/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnimalById } from "@/lib/animals";
import { getAnimalInternalDetails } from "@/lib/animal-care";
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
    return (
      <div className="flex flex-col gap-6">
        <VolunteerPhotoPanel animal={animal} />
      </div>
    );
  }

  const internalDetails = await getAnimalInternalDetails(supabase, id);

  return (
    <div className="flex flex-col gap-6">
      <AnimalForm animal={animal} internalDetails={internalDetails} />
    </div>
  );
}
