import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ContactForm } from "@/components/site/ContactForm";

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const common = await getTranslations("common");

  return (
    <Container className="py-16">
      <div className="grid gap-4.5 md:grid-cols-2">
        <Card className="p-6 sm:p-10 flex flex-col gap-6 hover:shadow-card hover:translate-y-0">
          <div className="flex flex-col gap-3">
            <Eyebrow>{t("addressLabel")}</Eyebrow>
            <h1 className="text-[clamp(26px,3vw,36px)] leading-[1.08]">{t("title")}</h1>
            <p className="text-[15.5px] leading-relaxed opacity-72">{t("intro")}</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11.5px] uppercase tracking-[0.12em] opacity-50">
                {t("addressLabel")}
              </span>
              <span className="text-base font-bold">{common("appName")}</span>
              <span className="text-[15.5px] opacity-75">{common("location")}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11.5px] uppercase tracking-[0.12em] opacity-50">
                {t("emailLabel")}
              </span>
              <a href={`mailto:${common("email")}`} className="text-base font-bold">
                {common("email")}
              </a>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11.5px] uppercase tracking-[0.12em] opacity-50">
                {t("socialLabel")}
              </span>
              <div className="flex gap-2.5">
                <a
                  href="https://www.facebook.com/inaya.farm.fr"
                  target="_blank"
                  rel="noreferrer"
                  className="border-[1.5px] border-ink/20 text-ink px-4 py-2 rounded-pill text-sm font-bold hover:bg-accent hover:text-white hover:border-accent"
                >
                  Facebook
                </a>
                <a
                  href="https://www.youtube.com/channel/UCK13ZWHLsZdbdy4qfLFwGeQ"
                  target="_blank"
                  rel="noreferrer"
                  className="border-[1.5px] border-ink/20 text-ink px-4 py-2 rounded-pill text-sm font-bold hover:bg-accent hover:text-white hover:border-accent"
                >
                  YouTube
                </a>
              </div>
            </div>
          </div>
          <div className="aspect-video rounded-2xl bg-[repeating-linear-gradient(135deg,#dedcdd_0_12px,#d5d3d4_12px_24px)] grid place-items-center">
            <span className="font-mono text-[11.5px] opacity-50">{t("mapCaption")}</span>
          </div>
        </Card>

        <ContactForm recipientEmail={common("email")} />
      </div>
    </Container>
  );
}
