import { getTranslations } from "next-intl/server";
import { HeartHandshake, Hourglass } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { SiteImage } from "@/components/site/SiteImage";
import { StepCard } from "@/components/ui/StepCard";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";

export default async function SurrenderPage() {
  const [t, nav] = await Promise.all([getTranslations("surrender"), getTranslations("nav")]);
  const conditions = t.raw("conditions") as string[];

  return (
    <div className="pb-24">
      <PageHero
        title={t("title")}
        intro={t("intro")}
        image={
          <SiteImage
            slot="surrender.hero"
            label={t("images.hero")}
            tone="pink"
            icon={HeartHandshake}
          />
        }
      />

      <Section>
        <Card className="p-6 sm:p-9 flex gap-5 items-start bg-accent-bg hover:shadow-card hover:translate-y-0">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-accent"
          >
            <Hourglass size={20} strokeWidth={1.75} />
          </span>
          <p className="text-[16px] leading-relaxed opacity-85 max-w-[72ch]">{t("waitlistNote")}</p>
        </Card>
      </Section>

      <Section title={t("conditionsTitle")}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {conditions.map((condition, i) => (
            <StepCard key={i} number={i + 1}>
              {condition}
            </StepCard>
          ))}
        </div>
        <div>
          <ButtonLink href="/contact" variant="dark">
            {nav("contact")}
          </ButtonLink>
        </div>
      </Section>
    </div>
  );
}
