import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";

export default async function CalicivirusAdoptionPage() {
  const t = await getTranslations("adopt.calicivirus");
  const symptoms = t.raw("symptoms") as string[];

  return (
    <Container className="py-16 flex flex-col gap-12 max-w-[860px]!">
      <div className="flex flex-col gap-3">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="text-[clamp(32px,4.5vw,52px)] leading-[1.05]">{t("title")}</h1>
        <p className="text-[17px] leading-relaxed opacity-75">{t("intro")}</p>
      </div>

      <Card className="p-6 sm:p-9 hover:shadow-card hover:translate-y-0">
        <h2 className="text-2xl mb-4">{t("whatTitle")}</h2>
        <p className="text-[15.5px] leading-relaxed opacity-85">{t("whatText")}</p>
      </Card>

      <Card className="p-6 sm:p-9 hover:shadow-card hover:translate-y-0">
        <h2 className="text-2xl mb-4">{t("symptomsTitle")}</h2>
        <p className="text-[15.5px] leading-relaxed opacity-85 mb-4">{t("symptomsIntro")}</p>
        <ul className="flex flex-col gap-3 list-disc pl-5 text-[15.5px] leading-relaxed opacity-85">
          {symptoms.map((symptom, i) => (
            <li key={i}>{symptom}</li>
          ))}
        </ul>
      </Card>

      <Card className="p-6 sm:p-9 hover:shadow-card hover:translate-y-0">
        <h2 className="text-2xl mb-4">{t("treatmentTitle")}</h2>
        <p className="text-[15.5px] leading-relaxed opacity-85">{t("treatmentText")}</p>
      </Card>

      <Card className="p-6 sm:p-10 bg-accent-bg flex flex-col gap-5 hover:shadow-card hover:translate-y-0">
        <h2 className="text-2xl">{t("careTitle")}</h2>
        <p className="text-[15.5px] leading-relaxed opacity-85">{t("careText")}</p>
        <p className="text-[16px] font-bold">{t("closing")}</p>
        <div className="flex flex-wrap gap-4">
          <ButtonLink href="/animals?species=cat">{t("viewCatsCta")}</ButtonLink>
          <ButtonLink href="/adopt" variant="outline">
            {t("procedureCta")}
          </ButtonLink>
        </div>
      </Card>
    </Container>
  );
}
