import { notFound } from "next/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnimalById } from "@/lib/animals";
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

  return (
    <div className="flex flex-col gap-6">
      {role === "admin" ? <AnimalForm animal={animal} /> : <VolunteerPhotoPanel animal={animal} />}
    </div>
  );
}
