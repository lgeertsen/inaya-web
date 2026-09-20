import { getTranslations } from "next-intl/server";
import { HandHeart, Phone, Sprout } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ButtonAnchor } from "@/components/ui/Button";
import { IconList } from "@/components/ui/IconList";
import { SiteImage } from "@/components/site/SiteImage";
import { VolunteerForm } from "@/components/site/VolunteerForm";

const PHONE_URL = "tel:+33611501317";

export default async function VolunteerPage() {
  const t = await getTranslations("volunteer");
  const conditions = t.raw("conditions") as string[];

  return (
    <Container className="py-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 items-start">
        <div className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-[clamp(34px,4.6vw,52px)] leading-[1.03]">{t("title")}</h1>
            <p className="text-[17px] leading-relaxed opacity-78">{t("intro")}</p>
          </div>

          <SiteImage slot="volunteer.hero" label={t("images.hero")} tone="pink" icon={HandHeart} />

          <Card className="p-6 sm:p-9 hover:shadow-card hover:translate-y-0">
            <h2 className="text-xl mb-5">{t("conditionsTitle")}</h2>
            <IconList items={conditions} />
          </Card>

          <p className="text-[16px] leading-relaxed opacity-85">{t("dailyLifeBody")}</p>

          <SiteImage slot="volunteer.daily" label={t("images.daily")} icon={Sprout} />

          <p className="text-[16px] leading-relaxed opacity-85">{t("closingBody")}</p>

          <Card className="p-6 sm:p-9 bg-accent text-white flex flex-col gap-5 items-start hover:shadow-card hover:translate-y-0">
            <p className="font-display font-extrabold text-[clamp(26px,3.2vw,36px)] leading-[1.08]">
              {t("closingHighlight")}
            </p>
            <ButtonAnchor href={PHONE_URL} variant="light" className="text-center">
              <Phone aria-hidden size={16} strokeWidth={2.25} />
              {t("phoneCta")}
            </ButtonAnchor>
          </Card>
        </div>

        <VolunteerForm />
      </div>
    </Container>
  );
}
