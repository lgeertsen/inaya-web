import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <Container className="py-16 flex flex-col gap-10 max-w-[860px]!">
      <h1 className="text-[clamp(32px,4.5vw,52px)] leading-[1.05]">{t("title")}</h1>
      <div className="flex flex-col gap-8 text-[17px] leading-relaxed opacity-85">
        <p>{t("body1")}</p>
        <p>{t("body2")}</p>
        <p>{t("body3")}</p>
      </div>
    </Container>
  );
}
