"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Cat,
  Archive,
  CalendarDays,
  HeartHandshake,
  Users,
  PenLine,
  KeyRound,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { SignOutButton } from "./SignOutButton";
import { getInitialsFromEmail } from "@/lib/format";
import type { Role } from "@/lib/auth";

type AdminNavHref =
  | "/admin"
  | "/admin/animals"
  | "/admin/animals/archive"
  | "/admin/calendar"
  | "/admin/donations"
  | "/admin/accounts"
  | "/admin/texts"
  | "/admin/profile";

interface NavItem {
  href: AdminNavHref;
  icon: LucideIcon;
  key: string;
  adminOnly: boolean;
  exact: boolean;
  badge?: string;
}

const NAV_GROUPS: { key: string; items: NavItem[] }[] = [
  {
    key: "pilotage",
    items: [{ href: "/admin", icon: LayoutDashboard, key: "overview", adminOnly: true, exact: true }],
  },
  {
    key: "refuge",
    items: [
      { href: "/admin/animals", icon: Cat, key: "animals", adminOnly: false, exact: false, badge: "animals" },
      {
        href: "/admin/animals/archive",
        icon: Archive,
        key: "animalsArchive",
        adminOnly: true,
        exact: false,
      },
      {
        href: "/admin/calendar",
        icon: CalendarDays,
        key: "calendar",
        adminOnly: true,
        exact: false,
        badge: "calendar",
      },
    ],
  },
  {
    key: "association",
    items: [
      { href: "/admin/donations", icon: HeartHandshake, key: "donations", adminOnly: true, exact: false },
      { href: "/admin/accounts", icon: Users, key: "accounts", adminOnly: true, exact: false },
      { href: "/admin/texts", icon: PenLine, key: "texts", adminOnly: true, exact: false },
    ],
  },
  {
    key: "compte",
    items: [{ href: "/admin/profile", icon: KeyRound, key: "profile", adminOnly: false, exact: false }],
  },
];

interface AdminSidebarProps {
  role: Role | null;
  email: string | null;
  animalCount: number;
  upcomingVisitCount: number;
}

export function AdminSidebar({ role, email, animalCount, upcomingVisitCount }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");
  const isAdmin = role === "admin";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  const badgeValues: Record<string, number> = {
    animals: animalCount,
    calendar: upcomingVisitCount,
  };

  // Non-exact hrefs match by prefix, so a nested route like /admin/animals/archive
  // would otherwise also light up its parent /admin/animals link — pick the
  // longest (most specific) prefix match instead.
  const prefixHrefs = NAV_GROUPS.flatMap((group) => group.items).filter((item) => !item.exact);
  const activePrefixHref = prefixHrefs
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  const navContent = (
    <>
      <div className="flex items-center gap-2.5 px-5 pb-[22px] pt-5">
        <div className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg bg-accent font-display text-sm font-extrabold text-white">
          I
        </div>
        <div className="flex flex-col leading-[1.1]">
          <span className="font-display text-[15px] font-extrabold tracking-tight text-white">Inaya</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-white/45">
            Administration
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => isAdmin || !item.adminOnly);
          if (items.length === 0) return null;
          return (
            <div key={group.key} className="flex flex-col gap-0.5">
              <span className="px-3 pb-1.5 pt-2.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-white/35">
                {t(`groups.${group.key}`)}
              </span>
              {items.map((item) => {
                const isActive = item.exact ? pathname === item.href : item.href === activePrefixHref;
                const Icon = item.icon;
                const badgeKey = "badge" in item ? item.badge : undefined;
                const badge = badgeKey ? badgeValues[badgeKey] : undefined;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13px] font-bold transition-colors ${
                      isActive
                        ? "bg-sidebar-active text-white shadow-[inset_2px_0_0_var(--color-accent)]"
                        : "text-white/62 hover:bg-sidebar-hover hover:text-white"
                    }`}
                  >
                    <Icon size={17} strokeWidth={2} className="flex-none" />
                    <span className="truncate">{t(item.key)}</span>
                    {badge !== undefined ? (
                      badgeKey === "calendar" ? (
                        <span className="ml-auto flex h-[18px] min-w-[18px] flex-none items-center justify-center rounded-pill bg-accent px-[5px] font-mono text-[10px] text-white">
                          {badge}
                        </span>
                      ) : (
                        <span className="ml-auto flex-none font-mono text-[10.5px] text-white/45">
                          {badge}
                        </span>
                      )
                    ) : null}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-sidebar-border px-3.5 pb-4 pt-3">
        <div className="flex h-7 w-7 flex-none items-center justify-center rounded-pill bg-white/12 font-mono text-[11px] text-white">
          {email ? getInitialsFromEmail(email) : "?"}
        </div>
        <div className="flex min-w-0 flex-col leading-[1.25]">
          <span className="truncate text-[12.5px] font-bold text-white">{email ?? ""}</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-white/45">
            {isAdmin ? t("roleAdmin") : t("roleVolunteer")}
          </span>
        </div>
        <div className="ml-auto flex-none">
          <SignOutButton label={t("signOut")} iconOnly />
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-surface px-4 py-3 lg:hidden">
        <span className="font-display text-lg font-extrabold">Inaya Admin</span>
        <button
          type="button"
          aria-label={t("toggleMenu")}
          onClick={() => setMobileOpen(true)}
          className="rounded-xl p-2 hover:bg-ink/5"
        >
          <Menu size={22} />
        </button>
      </div>

      <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col bg-sidebar lg:flex">
        {navContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={t("closeMenu")}
            className="absolute inset-0 bg-ink/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col bg-sidebar shadow-card-hover">
            <button
              type="button"
              aria-label={t("closeMenu")}
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-white/70 hover:bg-sidebar-hover hover:text-white"
            >
              <X size={20} />
            </button>
            {navContent}
          </aside>
        </div>
      ) : null}
    </>
  );
}
