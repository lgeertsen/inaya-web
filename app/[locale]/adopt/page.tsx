import { getTranslations } from "next-intl/server";
import { Cat, Dog, Info, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SiteImage } from "@/components/site/SiteImage";
import { StepCard } from "@/components/ui/StepCard";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";

interface PriceRow {
  label: string;
  note: string;
  price: string;
}

function PriceTable({ rows }: { rows: PriceRow[] }) {
  return (
    <table className="w-full text-[15px]">
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-ink/10 last:border-0">
            <td className="py-3 pr-3 font-bold">{row.label}</td>
            <td className="py-3 pr-3 opacity-60 italic text-[13.5px]">{row.note}</td>
            <td className="py-3 text-right font-bold text-accent whitespace-nowrap">{row.price}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function AdoptPage() {
  const [t, nav, animals] = await Promise.all([
    getTranslations("adopt"),
    getTranslations("nav"),
    getTranslations("animals"),
  ]);
  const steps = t.raw("steps") as string[];
  const dogRows = t.raw("dogRows") as PriceRow[];
  const catRows = t.raw("catRows") as PriceRow[];

  const pricing = [
    {
      key: "dog",
      slot: "adopt.dogs" as const,
      icon: Dog,
      species: animals("filters.dog"),
      image: t("images.dogs"),
      rows: dogRows,
      note: t("dogPricingNote"),
    },
    {
      key: "cat",
      slot: "adopt.cats" as const,
      icon: Cat,
      species: animals("filters.cat"),
      image: t("images.cats"),
      rows: catRows,
      note: t("catPricingNote"),
    },
  ];

  return (
    <div className="pb-24">
      <PageHero
        title={t("title")}
        intro={t("intro")}
        actions={<ButtonLink href="/animals">{nav("animals")}</ButtonLink>}
        image={<SiteImage slot="adopt.hero" label={t("images.hero")} tone="pink" icon={Dog} />}
      />

      <Section title={t("procedureTitle")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {steps.map((step, i) => (
            <StepCard key={i} number={i + 1}>
              {step}
            </StepCard>
          ))}
        </div>
      </Section>

      <Section title={t("pricingTitle")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pricing.map(({ key, slot, icon: Icon, species, image, rows, note }) => (
            <Card key={key} className="overflow-hidden hover:shadow-card hover:translate-y-0">
              <SiteImage slot={slot} label={image} icon={Icon} flat />
              <div className="p-6 sm:p-8 flex flex-col gap-4">
                <h3 className="text-xl flex items-center gap-2.5">
                  <Icon aria-hidden size={22} strokeWidth={1.75} className="text-accent" />
                  {species}
                </h3>
                <PriceTable rows={rows} />
                <p className="text-[13.5px] opacity-60 italic">{note}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 sm:p-8 flex gap-5 items-start hover:shadow-card hover:translate-y-0">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-bg text-accent"
          >
            <Info size={20} strokeWidth={1.75} />
          </span>
          <p className="text-[15.5px] leading-relaxed opacity-85 max-w-[80ch]">
            {t("unsterilizedNote")}
          </p>
        </Card>
      </Section>

      <Section>
        <Card className="bg-accent-bg overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_1.1fr] hover:shadow-card hover:translate-y-0">
          <SiteImage
            slot="adopt.calicivirus"
            label={t("images.calicivirus")}
            icon={Stethoscope}
            tone="pink"
            flat
            className="min-h-[240px]"
          />
          <div className="p-6 sm:p-10 flex flex-col gap-4 items-start">
            <Eyebrow>{t("calicivirus.eyebrow")}</Eyebrow>
            <h2 className="text-[clamp(24px,3vw,34px)] leading-[1.1]">{t("calicivirus.title")}</h2>
            <p className="text-[15.5px] leading-relaxed opacity-80">{t("calicivirus.intro")}</p>
            <ButtonLink href="/adopt/calicivirus" variant="dark">
              {nav("calicivirus")}
            </ButtonLink>
          </div>
        </Card>
      </Section>
    </div>
  );
}
