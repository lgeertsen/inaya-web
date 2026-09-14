import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export default async function HelpPage() {
  const t = await getTranslations("help");

  const sections = ["gift", "sponsorship", "adoption"] as const;

  return (
    <Container className="py-16 flex flex-col gap-12">
      <div className="max-w-[860px] flex flex-col gap-3">
        <h1 className="text-[clamp(32px,4.5vw,52px)] leading-[1.05]">{t("title")}</h1>
        <p className="text-[17px] leading-relaxed opacity-78">{t("intro")}</p>
      </div>

      <div>
        <h2 className="text-2xl mb-5">{t("howTitle")}</h2>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          {sections.map((key) => (
            <Card key={key} className="p-6 flex flex-col gap-2">
              <h3 className="text-lg">{t(`${key}.title`)}</h3>
              <p className="text-[14.5px] leading-relaxed opacity-70">{t(`${key}.text`)}</p>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-6 sm:p-10 flex flex-wrap items-center gap-8 justify-between hover:shadow-card hover:translate-y-0">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl">{t("bankTransferTitle")}</h2>
          <p className="text-[15px] opacity-80">
            IBAN: <strong>{t("iban")}</strong>
            <br />
            BIC: <strong>{t("bic")}</strong>
          </p>
        </div>
        <ButtonLink href="/donate" className="whitespace-nowrap">
          {t("donateCta")}
        </ButtonLink>
      </Card>
    </Container>
  );
}
