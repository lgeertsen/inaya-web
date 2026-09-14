import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export default async function DonateCancelPage() {
  const t = await getTranslations("donate.cancel");

  return (
    <Container className="py-24 max-w-[560px]!">
      <Card className="p-6 sm:p-10 text-center flex flex-col items-center gap-5 hover:shadow-card hover:translate-y-0">
        <h1 className="text-[clamp(28px,3.6vw,40px)]">{t("title")}</h1>
        <p className="text-[16px] leading-relaxed opacity-75">{t("body")}</p>
        <ButtonLink href="/donate">{t("retry")}</ButtonLink>
      </Card>
    </Container>
  );
}
