import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

export default async function SurrenderPage() {
  const t = await getTranslations("surrender");
  const conditions = t.raw("conditions") as string[];

  return (
    <Container className="py-16 flex flex-col gap-8 max-w-[860px]!">
      <div className="flex flex-col gap-3">
        <h1 className="text-[clamp(32px,4.5vw,52px)] leading-[1.05]">{t("title")}</h1>
        <p className="text-[17px] opacity-75">{t("intro")}</p>
      </div>

      <Card className="p-6 sm:p-9 hover:shadow-card hover:translate-y-0">
        <p className="text-[15.5px] leading-relaxed opacity-80 mb-6">{t("waitlistNote")}</p>
        <h2 className="text-xl mb-4">{t("conditionsTitle")}</h2>
        <ol className="flex flex-col gap-4 list-decimal pl-5 text-[15.5px] leading-relaxed opacity-85">
          {conditions.map((condition, i) => (
            <li key={i}>{condition}</li>
          ))}
        </ol>
      </Card>
    </Container>
  );
}
