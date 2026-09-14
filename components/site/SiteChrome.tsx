"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Hides the public marketing header/footer/announcement bar on /admin
 * routes, which render their own chrome via AdminShell instead.
 */
export function SiteChrome({
  header,
  footer,
  announcement,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  announcement: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = /^\/(fr|en)\/admin(\/|$)/.test(pathname);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {announcement}
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
