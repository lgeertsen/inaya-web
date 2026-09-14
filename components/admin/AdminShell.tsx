"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { SignOutButton } from "./SignOutButton";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");
  const isLogin = pathname.endsWith("/admin/login");

  if (isLogin) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-ink/10 bg-surface">
        <Container className="py-4 flex items-center gap-6">
          <span className="font-display font-extrabold text-lg mr-auto">Admin</span>
          <Link href="/admin/animals" className="text-sm font-bold hover:text-accent">
            {t("animals")}
          </Link>
          <Link href="/admin/donations" className="text-sm font-bold hover:text-accent">
            {t("donations")}
          </Link>
          <SignOutButton label={t("signOut")} />
        </Container>
      </header>
      <Container className="py-10">{children}</Container>
    </div>
  );
}
