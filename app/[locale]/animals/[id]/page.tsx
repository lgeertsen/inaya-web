import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAnimalById, getPlaceholderPhotoUrl } from "@/lib/animals";
import { computeAge } from "@/lib/format";

export default async function AnimalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const animal = await getAnimalById(supabase, id);

  if (!animal || !animal.isPublished || !animal.inShelter) {
    notFound();
  }

  const t = await getTranslations("animals");
  const locale = await getLocale();
  const age = computeAge(animal.birthYear, animal.birthMonth);
  const bio = (locale === "fr" ? animal.bioFr : animal.bioEn) || animal.bioFr || animal.bioEn;
  const cover = animal.photos.find((p) => p.isFeatured) ?? animal.photos[0];
  const gallery = animal.photos.filter((p) => p.id !== cover?.id);
  const placeholder = getPlaceholderPhotoUrl(animal.species);

  return (
    <Container className="py-16">
      <Link href="/animals" className="text-sm font-bold text-accent">
        ← {t("backToList")}
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-4/5 rounded-panel overflow-hidden bg-[radial-gradient(circle_at_50%_38%,#fdeefa_0%,#f3eef2_55%,#e9e6e8_100%)]">
            {cover ? (
              <Image
                src={cover.url}
                alt={animal.name}
                fill
                className="object-cover"
                style={{ objectPosition: `${cover.focalX * 100}% ${cover.focalY * 100}%` }}
              />
            ) : placeholder ? (
              <Image
                src={placeholder}
                alt={animal.name}
                fill
                className="object-contain p-10 opacity-80"
              />
            ) : null}
          </div>
          {gallery.length > 0 ? (
            <div className="grid grid-cols-4 gap-2.5">
              {gallery.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-xl overflow-hidden"
                >
                  <Image
                    src={photo.url}
                    alt={animal.name}
                    fill
                    className="object-cover"
                    style={{ objectPosition: `${photo.focalX * 100}% ${photo.focalY * 100}%` }}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge>{t(`filters.${animal.track}`)}</Badge>
          </div>
          <h1 className="text-[clamp(32px,4.5vw,48px)] leading-[1.05]">{animal.name}</h1>
          {bio ? <p className="text-[17px] leading-relaxed opacity-80">{bio}</p> : null}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14.5px] mt-2">
            <div>
              <dt className="uppercase tracking-[0.1em] text-[11px] opacity-50 font-bold">
                {t("filters.species")}
              </dt>
              <dd>{t(`filters.${animal.species}`)}</dd>
            </div>
            {age !== null ? (
              <div>
                <dt className="uppercase tracking-[0.1em] text-[11px] opacity-50 font-bold">
                  {t("age")}
                </dt>
                <dd>{t("yearsOld", { age })}</dd>
              </div>
            ) : null}
            {animal.breed ? (
              <div>
                <dt className="uppercase tracking-[0.1em] text-[11px] opacity-50 font-bold">
                  {t("breed")}
                </dt>
                <dd>{animal.breed}</dd>
              </div>
            ) : null}
            {animal.sex !== "unknown" ? (
              <div>
                <dt className="uppercase tracking-[0.1em] text-[11px] opacity-50 font-bold">
                  {t("sexLabel")}
                </dt>
                <dd>{t(`sex.${animal.sex}`)}</dd>
              </div>
            ) : null}
            {animal.specialNeeds ? (
              <div>
                <dt className="uppercase tracking-[0.1em] text-[11px] opacity-50 font-bold">
                  {t("specialNeeds")}
                </dt>
                <dd>✓</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-3">
            {animal.track === "adoption" ? (
              <ButtonLink href="/adopt">{t("adoptionCta")}</ButtonLink>
            ) : (
              <ButtonLink href={`/donate?animalId=${animal.id}`}>
                {t("sponsorshipCta", { name: animal.name })}
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
