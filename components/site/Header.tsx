import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";
import { HeaderNav } from "./HeaderNav";

export async function Header() {
  const logo = (
    <Link href="/" className="flex min-w-0 items-center gap-3">
      <Logo size={46} showTagline={false} />
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 bg-background/92 backdrop-blur-md border-b border-ink/10">
      <Container className="py-3.5">
        <HeaderNav logo={logo} />
      </Container>
    </header>
  );
}
