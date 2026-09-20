import { getTranslations } from "next-intl/server";
import { Gift, HeartHandshake, House, Landmark } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { SiteImage } from "@/components/site/SiteImage";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CtaBanner } from "@/components/site/CtaBanner";

const sections = [
  { key: "gift", icon: Gift },
  { key: "sponsorship", icon: HeartHandshake },
  { key: "adoption", icon: House },
] as const;

export default async function HelpPage() {
  const t = await getTranslations("help");

  return (
    <div className="pb-24">
      <PageHero
        title={t("title")}
        intro={t("intro")}
        image={<SiteImage slot="help.hero" label={t("images.hero")} tone="pink" icon={Landmark} />}
      />

      <Section title={t("howTitle")}>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          {sections.map(({ key, icon }) => (
            <Card key={key} className="overflow-hidden flex flex-col">
              <SiteImage slot={`help.${key}`} label={t(`images.${key}`)} icon={icon} flat />
              <div className="p-6 flex flex-col gap-2">
                <h3 className="text-xl">{t(`${key}.title`)}</h3>
                <p className="text-[14.5px] leading-relaxed opacity-70">{t(`${key}.text`)}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <CtaBanner
          tone="dark"
          title={t("bankTransferTitle")}
          text={
            <dl className="font-mono text-[14px] grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-white/60">{t("ibanLabel")}</dt>
              <dd className="font-bold text-white break-all">{t("iban")}</dd>
              <dt className="text-white/60">{t("bicLabel")}</dt>
              <dd className="font-bold text-white">{t("bic")}</dd>
            </dl>
          }
        >
          <ButtonLink href="/donate">{t("donateCta")}</ButtonLink>
        </CtaBanner>
      </Section>
    </div>
  );
}
