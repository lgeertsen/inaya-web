import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

const TEAMING_URL =
  "https://www.teaming.net/sanctuairerefugeinayapourlesanimauxendetresse";

export default async function TeamingPage() {
  const t = await getTranslations("teaming");

  const steps = ["join", "amount", "impact"] as const;

  return (
    <Container className="py-16 flex flex-col gap-12">
      <div className="max-w-[860px] flex flex-col gap-3">
        <h1 className="text-[clamp(32px,4.5vw,52px)] leading-[1.05]">{t("title")}</h1>
        <p className="text-[17px] leading-relaxed opacity-78">{t("intro")}</p>
      </div>

      <div>
        <h2 className="text-2xl mb-5">{t("howTitle")}</h2>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          {steps.map((key) => (
            <Card key={key} className="p-6 flex flex-col gap-2">
              <h3 className="text-lg">{t(`${key}.title`)}</h3>
              <p className="text-[14.5px] leading-relaxed opacity-70">{t(`${key}.text`)}</p>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-6 sm:p-10 flex flex-wrap items-center gap-8 justify-between hover:shadow-card hover:translate-y-0">
        <div className="flex flex-col gap-2 max-w-[46ch]">
          <h2 className="text-2xl">{t("ctaTitle")}</h2>
          <p className="text-[15px] leading-relaxed opacity-72">{t("ctaText")}</p>
        </div>
        <a
          href={TEAMING_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-pill font-bold text-[14.5px] px-6 py-3.5 transition-colors bg-accent text-white shadow-[0_6px_18px_rgba(223,23,203,0.28)] hover:bg-accent-hover whitespace-nowrap"
        >
          {t("cta")}
        </a>
      </Card>
    </Container>
  );
}
