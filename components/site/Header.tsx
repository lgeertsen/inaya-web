import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function Header() {
  const t = await getTranslations("nav");
  const common = await getTranslations("common");

  const links = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("about") },
    { href: "/animals", label: t("animals") },
    { href: "/adopt", label: t("adopt") },
    { href: "/help", label: t("help") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-40 bg-background/92 backdrop-blur-md border-b border-ink/10">
      <Container className="py-3.5 flex items-center gap-6 flex-wrap">
        <Link href="/" className="flex items-center gap-3 mr-auto">
          <span className="w-[46px] h-[46px] rounded-full bg-accent grid place-items-center text-white font-display font-extrabold text-xl">
            I
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display font-extrabold text-[19px]">{common("appName")}</span>
            <span className="text-[11.5px] uppercase tracking-[0.14em] opacity-55">
              {common("tagline")}
            </span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-3.5 text-[14.5px] font-medium whitespace-nowrap">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-ink hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>

        <LocaleSwitcher />

        <ButtonLink href="/donate" className="whitespace-nowrap">
          {t("donate")}
        </ButtonLink>
      </Container>
    </header>
  );
}
