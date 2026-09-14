import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAnimalById } from "@/lib/animals";
import { AnimalForm } from "@/components/admin/AnimalForm";

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

  return (
    <div className="flex flex-col gap-6">
      <AnimalForm animal={animal} />
    </div>
  );
}
