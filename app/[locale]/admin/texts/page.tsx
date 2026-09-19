import { ArrowRight, PenLine } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, getPathname, redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadSiteTextCatalog } from "@/lib/site-text-catalog";
import { ALL_TEXT_PAGES, pageForKey } from "@/lib/site-text-pages";
import { formatRelativeDate } from "@/lib/format";
import { AdminPage } from "@/components/admin/AdminPage";
import { StatusPill } from "@/components/admin/ui/StatusPill";
import { TextSearch, type SearchableText } from "@/components/admin/texts/TextSearch";

export default async function AdminTextsPage() {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.texts");
  const tNav = await getTranslations("admin.nav");
  const entries = await loadSiteTextCatalog(await createClient());

  const stats = new Map<string, { total: number; edited: number; lastEditedAt: string | null }>();
  for (const entry of entries) {
    const pageId = pageForKey(entry.key).id;
    const stat = stats.get(pageId) ?? { total: 0, edited: 0, lastEditedAt: null };
    stat.total += 1;
    for (const editedAt of [entry.fr.editedAt, entry.en.editedAt]) {
      if (!editedAt) continue;
      stat.edited += 1;
      if (!stat.lastEditedAt || editedAt > stat.lastEditedAt) stat.lastEditedAt = editedAt;
    }
    stats.set(pageId, stat);
  }

  const pages = ALL_TEXT_PAGES.filter((page) => stats.has(page.id));
  const searchable: SearchableText[] = entries.map((entry) => {
    const pageId = pageForKey(entry.key).id;
    return { key: entry.key, pageId, pageName: t(`pages.${pageId}.name`), fr: entry.fr.value, en: entry.en.value };
  });

  return (
    <AdminPage title={tNav("texts")} meta={t("meta", { count: entries.length })}>
      <p className="max-w-[760px] text-[13.5px] leading-relaxed text-ink/65">{t("intro")}</p>

      <TextSearch items={searchable} />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {pages.map((page) => {
          const stat = stats.get(page.id)!;
          const path = getPathname({ href: page.route, locale });
          return (
            <Link
              key={page.id}
              href={{ pathname: "/admin/texts/[page]", params: { page: page.id } }}
              className="group flex flex-col gap-3 rounded-admin border border-ink/10 bg-surface p-[18px] transition-all hover:-translate-y-px hover:border-accent/55 hover:shadow-card"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-accent-bg text-accent-hover">
                  <PenLine size={17} />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 className="text-[15px]">{t(`pages.${page.id}.name`)}</h2>
                  <span className="truncate font-mono text-[10.5px] text-ink/45">{page.id === "other" || page.sample ? "—" : path}</span>
                </div>
                <ArrowRight
                  size={16}
                  className="ml-auto mt-1 flex-none text-ink/25 transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                />
              </div>
              <p className="text-[12.5px] leading-relaxed text-ink/60">{t(`pages.${page.id}.description`)}</p>
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                <StatusPill>{t("card.strings", { count: stat.total })}</StatusPill>
                {stat.edited > 0 ? (
                  <StatusPill tone="accent">{t("card.edited", { count: stat.edited })}</StatusPill>
                ) : null}
                {stat.lastEditedAt ? (
                  <span className="ml-auto text-[11.5px] text-ink/45">
                    {t("card.lastEdit", { when: formatRelativeDate(stat.lastEditedAt, locale) })}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </AdminPage>
  );
}
