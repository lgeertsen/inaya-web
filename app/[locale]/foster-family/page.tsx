import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { FosterFamilyForm } from "@/components/site/FosterFamilyForm";

export default async function FosterFamilyPage() {
  const t = await getTranslations("fosterFamily");
  const role = t.raw("role") as string[];
  const conditions = t.raw("conditions") as string[];

  return (
    <Container className="py-16">
      <div className="grid gap-4.5 md:grid-cols-2 items-start">
        <div className="flex flex-col gap-4.5">
          <div className="flex flex-col gap-3">
            <h1 className="text-[clamp(32px,4.5vw,48px)] leading-[1.05]">{t("title")}</h1>
            <p className="text-[17px] leading-relaxed opacity-78">{t("intro")}</p>
          </div>

          <Card className="p-6 sm:p-9 hover:shadow-card hover:translate-y-0">
            <h2 className="text-xl mb-4">{t("roleTitle")}</h2>
            <ul className="flex flex-col gap-3 list-disc pl-5 text-[15.5px] leading-relaxed opacity-85">
              {role.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 sm:p-9 hover:shadow-card hover:translate-y-0">
            <h2 className="text-xl mb-4">{t("conditionsTitle")}</h2>
            <ul className="flex flex-col gap-3 list-disc pl-5 text-[15.5px] leading-relaxed opacity-85">
              {conditions.map((condition, i) => (
                <li key={i}>{condition}</li>
              ))}
            </ul>
          </Card>
        </div>

        <FosterFamilyForm />
      </div>
    </Container>
  );
}
