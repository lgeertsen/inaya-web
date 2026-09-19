"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { AdminButtonLink } from "./ui/AdminButton";

interface AdminPageProps {
  title: string;
  meta: string;
  children: ReactNode;
}

/**
 * Standard admin page frame: sticky title/meta/search/CTA header, plus the
 * shared content padding + max-width the redesign uses on every screen.
 */
export function AdminPage({ title, meta, children }: AdminPageProps) {
  const t = useTranslations("admin.header");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? { pathname: "/admin/animals", query: { q: trimmed } } : "/admin/animals");
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-4 border-b border-ink/10 bg-white/92 px-7 py-3.5 backdrop-blur-sm">
        <div className="flex min-w-0 flex-col gap-[3px]">
          <h1 className="text-[19px]">{title}</h1>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink/50">{meta}</span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <form onSubmit={handleSearch} className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-ink/40"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-[270px] max-w-full rounded-[9px] border border-ink/14 bg-surface py-2 pl-8 pr-3 text-[13px] outline-none focus:border-accent"
            />
          </form>
          <AdminButtonLink href="/admin/animals/new" variant="dark">
            <Plus size={15} strokeWidth={2.2} />
            {t("addAnimal")}
          </AdminButtonLink>
        </div>
      </header>
      <div className="flex-1 px-7 pb-10 pt-6">
        <div className="flex max-w-[1440px] flex-col gap-4">{children}</div>
      </div>
    </>
  );
}
