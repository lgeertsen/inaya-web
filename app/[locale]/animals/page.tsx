import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AnimalCard } from "@/components/animals/AnimalCard";
import { AnimalFilterBar } from "@/components/animals/AnimalFilterBar";
import { createClient } from "@/lib/supabase/server";
import { getAnimals, type AnimalSpecies } from "@/lib/animals";

const SPECIES = ["cat", "dog", "horse", "goat", "other"];

export default async function AnimalsPage({
  searchParams,
}: {
  searchParams: Promise<{ species?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("animals");

  const species = SPECIES.includes(params.species ?? "")
    ? (params.species as AnimalSpecies)
    : undefined;

  const supabase = await createClient();
  const animals = await getAnimals(supabase, {
    publishedOnly: true,
    inShelterOnly: true,
    species,
  });

  return (
    <Container className="py-16">
      <div className="max-w-[720px] mb-8 flex flex-col gap-3">
        <Eyebrow>{t("title")}</Eyebrow>
        <h1 className="text-[clamp(32px,4.5vw,52px)] leading-[1.05]">{t("title")}</h1>
        <p className="text-[17px] leading-relaxed opacity-75">{t("intro")}</p>
      </div>

      <div className="mb-8">
        <AnimalFilterBar />
      </div>

      {animals.length === 0 ? (
        <p className="opacity-60 text-[15px]">{t("empty")}</p>
      ) : (
        <div className="grid gap-4.5 grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
          {animals.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      )}
    </Container>
  );
}
