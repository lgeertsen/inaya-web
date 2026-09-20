import { getTranslations } from "next-intl/server";
import {
  HandCoins,
  HandHeart,
  HeartHandshake,
  House,
  PawPrint,
  Repeat,
  ScrollText,
  Sprout,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SiteImage } from "@/components/site/SiteImage";
import { Link } from "@/i18n/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Card } from "@/components/ui/Card";
import { AnimalCard } from "@/components/animals/AnimalCard";
import { createClient } from "@/lib/supabase/server";
import { getAnimals, getPublishedAnimalCount } from "@/lib/animals";

export default async function HomePage() {
  const [home, helpCards, common] = await Promise.all([
    getTranslations("home"),
    getTranslations("helpCards"),
    getTranslations("common"),
  ]);

  const supabase = await createClient();
  const [featuredAnimals, residentCount] = await Promise.all([
    getAnimals(supabase, { publishedOnly: true, inShelterOnly: true, limit: 4 }),
    getPublishedAnimalCount(supabase),
  ]);

  const helpItems = [
    { key: "donation", icon: HandCoins },
    { key: "sponsorship", icon: HeartHandshake },
    { key: "adoption", icon: House },
    { key: "volunteer", icon: HandHeart },
    { key: "legacy", icon: ScrollText },
    { key: "teaming", icon: Repeat },
  ] as const;
  const stats = [
    { value: String(residentCount), labelKey: "statResidents" },
    { value: home("statSinceValue"), labelKey: "statSince" },
    { value: home("statLandValue"), labelKey: "statLand" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="pt-11">
        <Container>
          <div className="relative rounded-panel overflow-hidden min-h-[560px] flex items-end">
            <SiteImage
              slot="home.hero"
              label={home("images.hero")}
              icon={PawPrint}
              align="top"
              flat
              className="absolute inset-0"
            />
            <div className="relative w-full px-6 pb-11 pt-[150px] bg-gradient-to-t from-[rgba(12,11,12,0.9)] via-[rgba(12,11,12,0.7)] to-transparent">
              <div className="flex flex-wrap items-end gap-8">
                <div className="flex-1 min-w-[min(100%,280px)] basis-[460px] flex flex-col gap-5">
                  <Eyebrow className="text-accent-light">{home("eyebrow")}</Eyebrow>
                  <h1 className="text-white text-[clamp(40px,6.2vw,76px)] leading-[0.98]">
                    {home("title")}
                  </h1>
                  <p className="text-white/88 text-[17.5px] leading-relaxed max-w-[52ch]">
                    {home("body")}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    <ButtonLink href="/animals">{home("ctaAnimals")}</ButtonLink>
                    <ButtonLink href="/help" variant="outlineLight">
                      {home("ctaHelp")}
                    </ButtonLink>
                  </div>
                </div>
                <div className="flex-none basis-[360px] max-w-full grid grid-cols-3 gap-2.5">
                  {stats.map(({ value, labelKey }) => (
                    <div
                      key={labelKey}
                      className="bg-white/10 border border-white/22 rounded-2xl px-1.5 sm:px-2 py-3.5"
                    >
                      <div className="font-display font-extrabold text-xl sm:text-2xl text-white">
                        {value}
                      </div>
                      <div className="text-[10px] uppercase tracking-normal text-white/70 break-words hyphens-auto">
                        {home(labelKey)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Featured animals */}
      <section className="pt-21">
        <Container>
          <div className="flex flex-wrap items-end gap-6 mb-7">
            <div className="flex-1 min-w-[min(100%,280px)] basis-[420px]">
              <Eyebrow>{home("animalsEyebrow")}</Eyebrow>
              <h2 className="text-[clamp(30px,4vw,46px)] leading-[1.05] mt-3">
                {home("animalsTitle")}
              </h2>
            </div>
            <p className="flex-1 min-w-[min(100%,260px)] basis-[320px] text-base leading-relaxed opacity-72">
              {home("animalsIntro")}
            </p>
            <ButtonLink href="/animals" variant="outline" className="whitespace-nowrap">
              {home("animalsCta")}
            </ButtonLink>
          </div>
          <div className="grid gap-4.5 grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
            {featuredAnimals.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        </Container>
      </section>

      {/* About teaser */}
      <section className="pt-24">
        <Container>
          <Card className="p-6 sm:p-10 flex flex-wrap gap-10 items-center hover:shadow-card hover:translate-y-0">
            <div className="flex-1 min-w-[min(100%,280px)] basis-[380px] flex flex-col gap-5">
              <Eyebrow>{home("aboutEyebrow")}</Eyebrow>
              <h2 className="text-[clamp(28px,3.6vw,44px)] leading-[1.06]">
                {home("aboutTitle")}
              </h2>
              <p className="text-[17px] leading-relaxed opacity-78">{home("aboutBody")}</p>
              <p className="text-[17px] leading-relaxed font-bold">{home("aboutNeed")}</p>
              <div className="mt-1">
                <ButtonLink href="/help" variant="dark">
                  {home("aboutCta")}
                </ButtonLink>
              </div>
            </div>
            <SiteImage
              slot="home.about"
              label={home("images.about")}
              icon={Sprout}
              className="flex-1 min-w-[min(100%,260px)] basis-[360px]"
            />
          </Card>
        </Container>
      </section>

      {/* Ways to help */}
      <section className="pt-24">
        <Container>
          <div className="max-w-[620px] mb-8 flex flex-col gap-3">
            <Eyebrow>{home("helpEyebrow")}</Eyebrow>
            <h2 className="text-[clamp(30px,4vw,46px)] leading-[1.05]">{home("helpTitle")}</h2>
            <p className="text-[16.5px] leading-relaxed opacity-72">{home("helpIntro")}</p>
          </div>
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
            {helpItems.map(({ key, icon }) => {
              const cardContent = (
                <>
                  <SiteImage
                    slot={`home.${key}`}
                    label={helpCards(`${key}.image`)}
                    icon={icon}
                    flat
                  />
                  <div className="p-5 flex flex-col gap-2">
                    <h3 className="text-[19px]">{helpCards(`${key}.title`)}</h3>
                    <p className="text-[14.5px] leading-relaxed opacity-70">
                      {helpCards(`${key}.text`)}
                    </p>
                  </div>
                </>
              );
              return key === "teaming" ? (
                <Card key={key} className="overflow-hidden">
                  <Link href="/teaming" className="flex flex-col">
                    {cardContent}
                  </Link>
                </Card>
              ) : (
                <Card key={key} className="overflow-hidden flex flex-col">
                  {cardContent}
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Donate CTA */}
      <section className="pt-21">
        <Container>
          <div className="bg-accent rounded-panel p-6 sm:p-12 text-white flex flex-wrap items-center gap-8">
            <div className="flex-1 min-w-[min(100%,280px)] basis-[420px] flex flex-col gap-3.5">
              <h2 className="text-[clamp(28px,3.6vw,42px)] leading-[1.08] text-white">
                {home("donateTitle")}
              </h2>
              <p className="text-[16.5px] leading-relaxed text-white/90 max-w-[54ch]">
                {home("donateBody")}
              </p>
            </div>
            <div className="flex-none basis-[280px] max-w-full flex flex-col gap-2.5 w-full sm:w-auto">
              <ButtonLink href="/donate" variant="light" className="justify-center">
                {home("donateCta")}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* Contact teaser */}
      <section className="py-24">
        <Container>
          <Card className="p-6 sm:p-10 flex flex-wrap items-center gap-6 justify-between hover:shadow-card hover:translate-y-0">
            <div className="flex flex-col gap-2 max-w-[46ch]">
              <h2 className="text-[clamp(26px,3vw,36px)] leading-[1.08]">
                {home("contactTitle")}
              </h2>
              <p className="text-[15.5px] leading-relaxed opacity-72">{home("contactIntro")}</p>
            </div>
            <ButtonLink href="/contact" className="whitespace-nowrap">
              {common("email")}
            </ButtonLink>
          </Card>
        </Container>
      </section>
    </>
  );
}
