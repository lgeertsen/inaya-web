import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { computeAge } from "@/lib/format";
import { getPlaceholderPhotoUrl, type Animal } from "@/lib/animals";

export async function AnimalCard({ animal }: { animal: Animal }) {
  const t = await getTranslations("animals");
  const cover = animal.photos[0];
  const placeholder = getPlaceholderPhotoUrl(animal.species);
  const age = computeAge(animal.birthYear, animal.birthMonth);

  const metaParts = [
    t(`filters.${animal.species}`),
    age !== null ? t("yearsOld", { age }) : null,
    t(`filters.${animal.track}`),
  ].filter(Boolean);

  return (
    <Link href={`/animals/${animal.id}`} className="block h-full">
      <Card className="overflow-hidden flex flex-col h-full">
        <div className="relative aspect-4/5 bg-[radial-gradient(circle_at_50%_38%,#fdeefa_0%,#f3eef2_55%,#e9e6e8_100%)]">
          {cover ? (
            <Image
              src={cover.url}
              alt={animal.name}
              fill
              sizes="(min-width: 1024px) 280px, 45vw"
              className="object-cover"
            />
          ) : placeholder ? (
            <Image
              src={placeholder}
              alt={animal.name}
              fill
              sizes="(min-width: 1024px) 280px, 45vw"
              className="object-contain p-6 opacity-80"
            />
          ) : null}
          <span className="absolute top-3 left-3">
            <Badge>{t(`filters.${animal.track}`)}</Badge>
          </span>
        </div>
        <div className="p-4.5 pb-5 flex flex-col gap-1.5">
          <h3 className="text-[21px]">{animal.name}</h3>
          <span className="text-[13.5px] opacity-60">{metaParts.join(" · ")}</span>
          <span className="mt-2 text-sm font-bold text-accent">{t("viewProfile")} →</span>
        </div>
      </Card>
    </Link>
  );
}
