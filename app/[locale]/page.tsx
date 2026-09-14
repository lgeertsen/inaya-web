import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Card } from "@/components/ui/Card";
import { AnimalCard } from "@/components/animals/AnimalCard";
import { createClient } from "@/lib/supabase/server";
import { getAnimals } from "@/lib/animals";

export default async function HomePage() {
  const [home, helpCards, common] = await Promise.all([
    getTranslations("home"),
    getTranslations("helpCards"),
    getTranslations("common"),
  ]);

  const supabase = await createClient();
  const featuredAnimals = await getAnimals(supabase, { publishedOnly: true, limit: 4 });

  const helpItems = ["donation", "sponsorship", "adoption", "volunteer", "legacy"] as const;

  return (
    <>
      {/* Hero */}
      <section className="pt-11 px-6">
        <Container className="px-0">
          <div className="relative rounded-panel overflow-hidden min-h-[560px] flex items-end bg-[repeating-linear-gradient(135deg,#d2d0d1_0_14px,#c9c7c8_14px_28px)]">
            <div className="relative w-full px-6 pb-11 pt-[150px] bg-gradient-to-t from-[rgba(12,11,12,0.9)] via-[rgba(12,11,12,0.7)] to-transparent">
              <div className="flex flex-wrap items-end gap-8">
                <div className="flex-1 min-w-[280px] basis-[460px] flex flex-col gap-5">
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
                <div className="flex-none basis-[320px] grid grid-cols-3 gap-2.5">
                  {[
                    ["statResidentsValue", "statResidents"],
                    ["statSinceValue", "statSince"],
                    ["statLandValue", "statLand"],
                  ].map(([valueKey, labelKey]) => (
                    <div
                      key={labelKey}
                      className="bg-white/10 border border-white/22 rounded-2xl px-3 py-3.5"
                    >
                      <div className="font-display font-extrabold text-2xl text-white">
                        {home(valueKey)}
                      </div>
                      <div className="text-[11.5px] uppercase tracking-[0.08em] text-white/70">
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
      <section className="pt-21 px-6">
        <Container className="px-0">
          <div className="flex flex-wrap items-end gap-6 mb-7">
            <div className="flex-1 min-w-[280px] basis-[420px]">
              <Eyebrow>{home("animalsEyebrow")}</Eyebrow>
              <h2 className="text-[clamp(30px,4vw,46px)] leading-[1.05] mt-3">
                {home("animalsTitle")}
              </h2>
            </div>
            <p className="flex-1 min-w-[260px] basis-[320px] text-base leading-relaxed opacity-72">
              {home("animalsIntro")}
            </p>
            <ButtonLink href="/animals" variant="outline" className="whitespace-nowrap">
              {home("animalsCta")}
            </ButtonLink>
          </div>
          <div className="grid gap-4.5 grid-cols-[repeat(auto-fit,minmax(230px,1fr))]">
            {featuredAnimals.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        </Container>
      </section>

      {/* About teaser */}
      <section className="pt-24 px-6">
        <Container className="px-0">
          <Card className="p-6 sm:p-10 flex flex-wrap gap-10 items-center hover:shadow-card hover:translate-y-0">
            <div className="flex-1 min-w-[280px] basis-[380px] flex flex-col gap-5">
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
            <div className="flex-1 min-w-[260px] basis-[360px] aspect-5/4 rounded-2xl bg-[repeating-linear-gradient(135deg,#dedcdd_0_12px,#d5d3d4_12px_24px)]" />
          </Card>
        </Container>
      </section>

      {/* Ways to help */}
      <section className="pt-24 px-6">
        <Container className="px-0">
          <div className="max-w-[620px] mb-8 flex flex-col gap-3">
            <Eyebrow>{home("helpEyebrow")}</Eyebrow>
            <h2 className="text-[clamp(30px,4vw,46px)] leading-[1.05]">{home("helpTitle")}</h2>
            <p className="text-[16.5px] leading-relaxed opacity-72">{home("helpIntro")}</p>
          </div>
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
            {helpItems.map((key) => (
              <Card key={key} className="p-5 flex flex-col gap-2">
                <h3 className="text-[19px]">{helpCards(`${key}.title`)}</h3>
                <p className="text-[14.5px] leading-relaxed opacity-70">
                  {helpCards(`${key}.text`)}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Donate CTA */}
      <section className="pt-21 px-6">
        <Container className="px-0">
          <div className="bg-accent rounded-panel p-6 sm:p-12 text-white flex flex-wrap items-center gap-8">
            <div className="flex-1 min-w-[280px] basis-[420px] flex flex-col gap-3.5">
              <h2 className="text-[clamp(28px,3.6vw,42px)] leading-[1.08] text-white">
                {home("donateTitle")}
              </h2>
              <p className="text-[16.5px] leading-relaxed text-white/90 max-w-[54ch]">
                {home("donateBody")}
              </p>
            </div>
            <div className="flex-none basis-[280px] flex flex-col gap-2.5 w-full sm:w-auto">
              <ButtonLink
                href="/donate"
                className="bg-white text-accent hover:bg-ink hover:text-white justify-center"
              >
                {home("donateCta")}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* Contact teaser */}
      <section className="py-24 px-6">
        <Container className="px-0">
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
