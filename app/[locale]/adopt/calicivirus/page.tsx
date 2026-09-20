import { getTranslations } from "next-intl/server";
import { Cat, HeartPulse, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { IconList } from "@/components/ui/IconList";
import { SiteImage } from "@/components/site/SiteImage";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CtaBanner } from "@/components/site/CtaBanner";

export default async function CalicivirusAdoptionPage() {
  const t = await getTranslations("adopt.calicivirus");
  const symptoms = t.raw("symptoms") as string[];

  return (
    <div className="pb-24">
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        intro={t("intro")}
        image={<SiteImage slot="calicivirus.hero" label={t("images.hero")} tone="pink" icon={Cat} />}
      />

      <Section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-14 items-center">
          <div className="flex flex-col gap-4">
            <h2 className="text-[clamp(26px,3.2vw,38px)] leading-[1.08]">{t("whatTitle")}</h2>
            <p className="text-[16.5px] leading-relaxed opacity-85">{t("whatText")}</p>
          </div>
          <SiteImage slot="calicivirus.what" label={t("images.what")} />
        </div>
      </Section>

      <Section tone="accent">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.2fr_1fr] md:gap-14 items-center">
          <div className="flex flex-col gap-5">
            <h2 className="text-[clamp(26px,3.2vw,38px)] leading-[1.08]">{t("symptomsTitle")}</h2>
            <p className="text-[16px] leading-relaxed opacity-80">{t("symptomsIntro")}</p>
            <IconList items={symptoms} onTint />
          </div>
          <SiteImage slot="calicivirus.symptoms" label={t("images.symptoms")} icon={HeartPulse} />
        </div>
      </Section>

      <Section>
        <Card className="p-6 sm:p-10 flex gap-5 items-start hover:shadow-card hover:translate-y-0">
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-bg text-accent"
          >
            <Stethoscope size={22} strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl">{t("treatmentTitle")}</h2>
            <p className="text-[16px] leading-relaxed opacity-85 max-w-[75ch]">{t("treatmentText")}</p>
          </div>
        </Card>
      </Section>

      <Section>
        <CtaBanner
          title={t("careTitle")}
          text={
            <div className="flex flex-col gap-3">
              <p>{t("careText")}</p>
              <p className="font-bold">{t("closing")}</p>
            </div>
          }
        >
          <ButtonLink
            href={{ pathname: "/animals", query: { species: "cat" } }}
            variant="light"
          >
            {t("viewCatsCta")}
          </ButtonLink>
          <ButtonLink href="/adopt" variant="outlineLight">
            {t("procedureCta")}
          </ButtonLink>
        </CtaBanner>
      </Section>
    </div>
  );
}
