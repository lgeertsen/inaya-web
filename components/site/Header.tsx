import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Logo } from "./Logo";

export async function Header() {
  const t = await getTranslations("nav");

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
          <Logo size={46} />
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
