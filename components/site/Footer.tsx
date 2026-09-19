import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";

export async function Footer() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const common = await getTranslations("common");

  return (
    <footer className="bg-ink text-white/72">
      <Container className="py-14 grid gap-9 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        <div className="flex flex-col gap-3.5">
          <Logo size={42} showTagline={false} variant="light" />
          <p className="text-[14.5px] leading-relaxed whitespace-pre-line">{t("about")}</p>
          <a href={`mailto:${common("email")}`} className="text-[14.5px] text-accent-light">
            {common("email")}
          </a>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[11.5px] tracking-[0.14em] uppercase text-white font-bold">
            {t("linksTitle")}
          </span>
          <Link href="/" className="text-[14.5px] text-white/72 hover:text-accent-light">
            {nav("home")}
          </Link>
          <Link href="/about" className="text-[14.5px] text-white/72 hover:text-accent-light">
            {nav("about")}
          </Link>
          <Link href="/team" className="text-[14.5px] text-white/72 hover:text-accent-light">
            {nav("team")}
          </Link>
          <Link href="/contact" className="text-[14.5px] text-white/72 hover:text-accent-light">
            {nav("contact")}
          </Link>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[11.5px] tracking-[0.14em] uppercase text-white font-bold">
            {t("helpTitle")}
          </span>
          <Link href="/donate" className="text-[14.5px] text-white/72 hover:text-accent-light">
            {nav("donate")}
          </Link>
          <Link href="/help" className="text-[14.5px] text-white/72 hover:text-accent-light">
            {nav("help")}
          </Link>
          <Link href="/teaming" className="text-[14.5px] text-white/72 hover:text-accent-light">
            {nav("teaming")}
          </Link>
          <Link href="/surrender" className="text-[14.5px] text-white/72 hover:text-accent-light">
            {nav("surrender")}
          </Link>
          <Link href="/volunteer" className="text-[14.5px] text-white/72 hover:text-accent-light">
            {nav("volunteer")}
          </Link>
          <Link href="/foster-family" className="text-[14.5px] text-white/72 hover:text-accent-light">
            {nav("fosterFamily")}
          </Link>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[11.5px] tracking-[0.14em] uppercase text-white font-bold">
            {t("animalsTitle")}
          </span>
          <Link href="/animals" className="text-[14.5px] text-white/72 hover:text-accent-light">
            {nav("animals")}
          </Link>
          <Link href="/adopt" className="text-[14.5px] text-white/72 hover:text-accent-light">
            {nav("adopt")}
          </Link>
          <Link
            href="/adopt/calicivirus"
            className="text-[14.5px] text-white/72 hover:text-accent-light"
          >
            {t("linkCalicivirus")}
          </Link>
          <Link
            href={{ pathname: "/animals", query: { status: "adopted" } }}
            className="text-[14.5px] text-white/72 hover:text-accent-light"
          >
            {t("linkAdopted")}
          </Link>
        </div>
      </Container>

      <Container className="py-5 border-t border-white/12 flex flex-wrap gap-3 justify-between text-[13px]">
        <span>{common("rights")}</span>
        <span className="opacity-65">{common("photoCredits")}</span>
      </Container>
    </footer>
  );
}
