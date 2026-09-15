import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listAnimalOptions } from "@/lib/animals";
import { VetVisitForm } from "@/components/admin/VetVisitForm";

export default async function NewVetVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

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
