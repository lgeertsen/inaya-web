"use client";

import { ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { LocaleSwitcher } from "./LocaleSwitcher";

interface NavChild {
  href: string;
  key: string;
}

interface NavGroup {
  href: string;
  key: string;
  children?: NavChild[];
}

const NAV_GROUPS: NavGroup[] = [
  { href: "/", key: "home" },
  { href: "/about", key: "about", children: [{ href: "/team", key: "team" }] },
  { href: "/animals", key: "animals" },
  {
    href: "/adopt",
    key: "adopt",
    children: [
      { href: "/adopt/calicivirus", key: "calicivirus" },
      { href: "/surrender", key: "surrender" },
    ],
  },
  {
    href: "/help",
    key: "help",
    children: [
      { href: "/volunteer", key: "volunteer" },
      { href: "/foster-family", key: "fosterFamily" },
      { href: "/teaming", key: "teaming" },
    ],
  },
  { href: "/contact", key: "contact" },
];

export function HeaderNav({ logo }: { logo: ReactNode }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex items-center gap-6 flex-1">
        {logo}
        <nav className="flex items-center gap-x-6 ml-8 text-[14.5px] font-medium">
          {NAV_GROUPS.map((group) => (
            <div key={group.href} className="group relative">
              {group.children ? (
                <button
                  type="button"
                  aria-haspopup="true"
                  className="inline-flex items-center gap-1 py-2 text-ink hover:text-accent cursor-pointer"
                >
                  {t(group.key)}
                  <ChevronDown size={14} aria-hidden="true" className="opacity-60" />
                </button>
              ) : (
                <Link
                  href={group.href}
                  className="inline-flex items-center gap-1 py-2 text-ink hover:text-accent"
                >
                  {t(group.key)}
                </Link>
              )}
              {group.children ? (
                <div
                  className="absolute left-1/2 top-full -translate-x-1/2 pt-2 opacity-0 invisible
                             translate-y-1 pointer-events-none transition
                             group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
                             group-hover:pointer-events-auto
                             group-focus-within:opacity-100 group-focus-within:visible
                             group-focus-within:translate-y-0 group-focus-within:pointer-events-auto"
                >
                  <div className="min-w-[220px] rounded-card border border-ink/10 bg-surface p-2 shadow-card-hover">
                    <Link
                      href={group.href}
                      className="block whitespace-nowrap rounded-lg px-3 py-2 text-[14px] font-bold text-accent hover:bg-accent-bg"
                    >
                      {t(group.key)}
                    </Link>
                    <div className="my-1 border-t border-ink/10" />
                    {group.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block whitespace-nowrap rounded-lg px-3 py-2 text-[14px] text-ink hover:bg-accent-bg hover:text-accent"
                      >
                        {t(child.key)}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-6">
          <LocaleSwitcher />
          <ButtonLink href="/donate" className="whitespace-nowrap">
            {t("donate")}
          </ButtonLink>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex lg:hidden items-center justify-between w-full">
        {logo}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <button
            type="button"
            aria-label={t("openMenu")}
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 hover:bg-ink/5"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {mobileOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                aria-label={t("closeMenu")}
                className="absolute inset-0 bg-ink/50"
                onClick={() => setMobileOpen(false)}
              />
              <aside className="absolute inset-y-0 right-0 flex w-72 max-w-[80%] flex-col gap-1 bg-surface p-5 shadow-card-hover overflow-y-auto">
                <button
                  type="button"
                  aria-label={t("closeMenu")}
                  onClick={() => setMobileOpen(false)}
                  className="self-end rounded-xl p-2 text-ink/70 hover:bg-ink/5"
                >
                  <X size={20} />
                </button>
                <nav className="flex flex-col gap-1 mt-2">
                  {NAV_GROUPS.map((group) => (
                    <div key={group.href} className="flex flex-col gap-0.5 py-1.5">
                      <Link
                        href={group.href}
                        className="rounded-lg px-2 py-2 text-[15px] font-bold text-ink hover:bg-accent-bg hover:text-accent"
                      >
                        {t(group.key)}
                      </Link>
                      {group.children?.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="rounded-lg px-2 py-2 pl-5 text-[14px] text-ink/80 hover:bg-accent-bg hover:text-accent"
                        >
                          {t(child.key)}
                        </Link>
                      ))}
                    </div>
                  ))}
                </nav>
                <ButtonLink href="/donate" className="mt-3 w-full justify-center">
                  {t("donate")}
                </ButtonLink>
              </aside>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
