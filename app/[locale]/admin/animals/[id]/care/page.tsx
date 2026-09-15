import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnimalInternalDetails } from "@/lib/animal-care";
import { AnimalInternalDetailsForm } from "@/components/admin/AnimalInternalDetailsForm";

export default async function AnimalCarePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const { id } = await params;
  const supabase = await createClient();
  const details = await getAnimalInternalDetails(supabase, id);

  return <AnimalInternalDetailsForm animalId={id} details={details} />;
}
