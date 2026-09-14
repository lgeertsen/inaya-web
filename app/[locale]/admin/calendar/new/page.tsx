import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listAnimalOptions } from "@/lib/animals";
import { VetVisitForm } from "@/components/admin/VetVisitForm";

export default async function NewVetVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const supabase = await createClient();
  const animalOptions = await listAnimalOptions(supabase);
  const t = await getTranslations("admin.calendar");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">{t("addVisit")}</h1>
      <VetVisitForm animalOptions={animalOptions} initialScheduledAt={date ? `${date}T09:00` : undefined} />
    </div>
  );
}
