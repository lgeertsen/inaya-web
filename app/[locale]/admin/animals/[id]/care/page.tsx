import { createClient } from "@/lib/supabase/server";
import { getAnimalInternalDetails } from "@/lib/animal-care";
import { AnimalInternalDetailsForm } from "@/components/admin/AnimalInternalDetailsForm";

export default async function AnimalCarePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const details = await getAnimalInternalDetails(supabase, id);

  return <AnimalInternalDetailsForm animalId={id} details={details} />;
}
