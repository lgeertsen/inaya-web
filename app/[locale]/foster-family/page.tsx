import { getTranslations } from "next-intl/server";
import { House } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { IconList } from "@/components/ui/IconList";
import { SiteImage } from "@/components/site/SiteImage";
import { FosterFamilyForm } from "@/components/site/FosterFamilyForm";

export default async function FosterFamilyPage() {
  const t = await getTranslations("fosterFamily");
  const role = t.raw("role") as string[];
  const conditions = t.raw("conditions") as string[];

  return (
    <Container className="py-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 items-start">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-[clamp(34px,4.6vw,52px)] leading-[1.03]">{t("title")}</h1>
            <p className="text-[17px] leading-relaxed opacity-78">{t("intro")}</p>
          </div>

          <SiteImage slot="foster-family.hero" label={t("images.hero")} tone="pink" icon={House} />

          <Card className="p-6 sm:p-9 bg-accent-bg hover:shadow-card hover:translate-y-0">
            <h2 className="text-xl mb-5">{t("roleTitle")}</h2>
            <IconList items={role} onTint />
          </Card>

          <Card className="p-6 sm:p-9 hover:shadow-card hover:translate-y-0">
            <h2 className="text-xl mb-5">{t("conditionsTitle")}</h2>
            <IconList items={conditions} />
          </Card>
        </div>

        <FosterFamilyForm />
      </div>
    </Container>
  );
}
