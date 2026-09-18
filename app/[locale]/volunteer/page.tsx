import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { VolunteerForm } from "@/components/site/VolunteerForm";

export default async function VolunteerPage() {
  const t = await getTranslations("volunteer");
  const tasks = t.raw("tasks") as string[];
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
            <h2 className="text-xl mb-4">{t("tasksTitle")}</h2>
            <ul className="flex flex-col gap-3 list-disc pl-5 text-[15.5px] leading-relaxed opacity-85">
              {tasks.map((task, i) => (
                <li key={i}>{task}</li>
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

        <VolunteerForm />
      </div>
    </Container>
  );
}
