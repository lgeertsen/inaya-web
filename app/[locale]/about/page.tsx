import { getTranslations } from "next-intl/server";
import { PawPrint, Quote, Sprout } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { SiteImage } from "@/components/site/SiteImage";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CtaBanner } from "@/components/site/CtaBanner";

export default async function AboutPage() {
  const [t, home, nav] = await Promise.all([
    getTranslations("about"),
    getTranslations("home"),
    getTranslations("nav"),
  ]);

  return (
    <div className="pb-24">
      <PageHero
        title={t("title")}
        image={<SiteImage slot="about.hero" label={t("images.hero")} tone="pink" icon={PawPrint} />}
      />

      <Section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-14 items-center">
          <p className="text-[17px] leading-relaxed opacity-85">{t("body1")}</p>
          <SiteImage slot="about.story1" label={t("images.story1")} />
        </div>
      </Section>

      <Section className="pt-14">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-14 items-center">
          <p className="text-[17px] leading-relaxed opacity-85 md:order-2">{t("body2")}</p>
          <SiteImage slot="about.story2" label={t("images.story2")} icon={Sprout} tone="pink" />
        </div>
      </Section>

      <Section tone="accent">
        <div className="flex flex-col gap-5 max-w-[860px]">
          <Quote aria-hidden size={36} strokeWidth={1.75} className="text-accent" />
          <p className="font-display font-bold text-[clamp(20px,2.4vw,28px)] leading-snug">
            {t("body3")}
          </p>
        </div>
      </Section>

      <Section>
        <CtaBanner title={home("aboutNeed")}>
          <ButtonLink href="/help" variant="light">
            {home("aboutCta")}
          </ButtonLink>
          <ButtonLink href="/animals" variant="outlineLight">
            {nav("animals")}
          </ButtonLink>
        </CtaBanner>
      </Section>
    </div>
  );
}
