"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LayoutDashboard, PawPrint, CalendarDays, HeartHandshake, Users, Menu, X } from "lucide-react";
import { SignOutButton } from "./SignOutButton";
import type { Role } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, key: "overview", adminOnly: true, exact: true },
  { href: "/admin/animals", icon: PawPrint, key: "animals", adminOnly: false, exact: false },
  { href: "/admin/calendar", icon: CalendarDays, key: "calendar", adminOnly: true, exact: false },
  { href: "/admin/donations", icon: HeartHandshake, key: "donations", adminOnly: true, exact: false },
  { href: "/admin/accounts", icon: Users, key: "accounts", adminOnly: true, exact: false },
] as const;

export function AdminSidebar({ role }: { role: Role | null }) {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");
  const isAdmin = role === "admin";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  const items = NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly);

  const navContent = (
    <>
      <div className="px-5 pt-6 pb-4">
        <span className="font-display font-extrabold text-lg text-white">Inaya</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                isActive
                  ? "bg-sidebar-active text-accent-light"
                  : "text-white/70 hover:bg-sidebar-hover hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-3 pb-6 pt-4">
        <SignOutButton label={t("signOut")} />
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-surface px-4 py-3 lg:hidden">
        <span className="font-display font-extrabold text-lg">Inaya Admin</span>
        <button
          type="button"
          aria-label={t("toggleMenu")}
          onClick={() => setMobileOpen(true)}
          className="rounded-xl p-2 hover:bg-ink/5"
        >
          <Menu size={22} />
        </button>
      </div>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar lg:flex">
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
