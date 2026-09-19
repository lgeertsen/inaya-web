import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { VolunteerForm } from "@/components/site/VolunteerForm";

const PHONE_URL = "tel:+33611501317";

export default async function VolunteerPage() {
  const t = await getTranslations("volunteer");
  const conditions = t.raw("conditions") as string[];

  return (
    <Container className="py-16">
      <div className="grid gap-4.5 md:grid-cols-2 items-start">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-[clamp(32px,4.5vw,48px)] leading-[1.05]">{t("title")}</h1>
            <p className="text-[17px] leading-relaxed opacity-78">{t("intro")}</p>
          </div>

          <Card className="p-6 sm:p-9 hover:shadow-card hover:translate-y-0">
            <h2 className="text-xl mb-4">{t("conditionsTitle")}</h2>
            <ul className="flex flex-col gap-3 list-disc pl-5 text-[15.5px] leading-relaxed opacity-85">
              {conditions.map((condition, i) => (
                <li key={i}>{condition}</li>
              ))}
            </ul>
          </Card>

          <div className="flex flex-col gap-4 text-[15.5px] leading-relaxed opacity-85">
            <p>{t("dailyLifeBody")}</p>
            <p>{t("closingBody")}</p>
          </div>

          <p className="text-xl font-semibold">{t("closingHighlight")}</p>

          <a
            href={PHONE_URL}
            className="self-start inline-flex items-center justify-center gap-2 rounded-pill font-bold text-[14.5px] px-6 py-3.5 transition-colors bg-accent text-white shadow-[0_6px_18px_rgba(223,23,203,0.28)] hover:bg-accent-hover whitespace-nowrap"
          >
            {t("phoneCta")}
          </a>
        </div>

        <VolunteerForm />
      </div>
    </Container>
  );
}
