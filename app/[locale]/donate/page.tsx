import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { DonateForm } from "@/components/site/DonateForm";
import { createClient } from "@/lib/supabase/server";
import { getAnimalById } from "@/lib/animals";

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ animalId?: string }>;
}) {
  const { animalId } = await searchParams;
  const t = await getTranslations("donate");

  let animalName: string | null = null;
  if (animalId) {
    const supabase = await createClient();
    const animal = await getAnimalById(supabase, animalId);
    animalName = animal?.isPublished ? animal.name : null;
  }

  return (
    <Container className="py-16 max-w-[560px]!">
      <div className="mb-8 flex flex-col gap-3">
        <h1 className="text-[clamp(30px,4vw,44px)] leading-[1.05]">
          {animalName ? t("sponsorTitle", { name: animalName }) : t("title")}
        </h1>
        <p className="text-[16px] leading-relaxed opacity-72">
          {animalName ? t("sponsorIntro", { name: animalName }) : t("intro")}
        </p>
      </div>
      <Card className="p-6 sm:p-9 hover:shadow-card hover:translate-y-0">
        <DonateForm animalId={animalName ? animalId : undefined} animalName={animalName} />
      </Card>
    </Container>
  );
}
