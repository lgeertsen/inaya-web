import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Globe, HeartHandshake, Repeat, UserPlus } from "lucide-react";
import { ButtonAnchor } from "@/components/ui/Button";
import { SiteImage } from "@/components/site/SiteImage";
import { StepCard } from "@/components/ui/StepCard";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CtaBanner } from "@/components/site/CtaBanner";

const TEAMING_URL =
  "https://www.teaming.net/sanctuairerefugeinayapourlesanimauxendetresse";

const steps = [
  { key: "step1", icon: Globe },
  { key: "step2", icon: UserPlus },
  { key: "step3", icon: HeartHandshake },
  { key: "step4", icon: Repeat },
] as const;

export default async function TeamingPage() {
  const t = await getTranslations("teaming");

  return (
    <div className="pb-24">
      <PageHero
        title={t("title")}
        intro={t("intro")}
        image={
          <div className="relative w-full max-w-[300px] aspect-[884/1250] rounded-panel overflow-hidden shadow-card justify-self-center md:justify-self-end">
            <Image
              src="/images/teaming-flyer.png"
              alt={t("flyerAlt")}
              fill
              className="object-cover"
            />
          </div>
        }
      />

      <Section title={t("howTitle")}>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          {steps.map(({ key, icon }) => (
            <StepCard key={key} icon={icon} title={t(`${key}.title`)}>
              {t(`${key}.text`)}
            </StepCard>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-14 items-center">
          <div className="flex flex-col gap-5">
            <h2 className="text-[clamp(26px,3.2vw,38px)] leading-[1.08]">{t("impactTitle")}</h2>
            <div className="flex flex-col gap-4 text-[16px] leading-relaxed opacity-80">
              <p>{t("impactBody1")}</p>
              <p>{t("impactBody2")}</p>
            </div>
          </div>
          <SiteImage slot="teaming.impact" label={t("images.impact")} tone="pink" />
        </div>
      </Section>

      <Section>
        <CtaBanner title={t("ctaTitle")} text={t("ctaText")}>
          <ButtonAnchor href={TEAMING_URL} target="_blank" rel="noreferrer" variant="light">
            {t("cta")}
          </ButtonAnchor>
        </CtaBanner>
      </Section>
    </div>
  );
}
