"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { StatusPill } from "@/components/admin/ui/StatusPill";

export interface SearchableText {
  key: string;
  pageId: string;
  pageName: string;
  fr: string;
  en: string;
}

const MAX_RESULTS = 12;

function snippet(text: string, needle: string): string {
  const index = text.toLowerCase().indexOf(needle);
  if (index < 0) return text.length > 140 ? `${text.slice(0, 140)}…` : text;
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + needle.length + 90);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

/** Search across every editable text of the site; each result opens the editor on that text. */
export function TextSearch({ items }: { items: SearchableText[] }) {
  const t = useTranslations("admin.texts.search");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (needle.length < 2) return [];
    return items
      .map((item) => {
        const inFr = item.fr.toLowerCase().includes(needle);
        const inEn = item.en.toLowerCase().includes(needle);
        const inKey = item.key.toLowerCase().includes(needle);
        return inFr || inEn || inKey ? { item, lang: inFr || !inEn ? ("fr" as const) : ("en" as const) } : null;
      })
      .filter((result): result is NonNullable<typeof result> => result !== null);
  }, [items, needle]);

  return (
    <div className="flex flex-col gap-2.5 rounded-admin border border-ink/10 bg-surface p-3.5">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="w-full rounded-[10px] border border-ink/14 bg-surface py-2.5 pl-9 pr-3 text-[13.5px] outline-none focus:border-accent"
        />
      </div>

      {needle.length >= 2 ? (
        results.length === 0 ? (
          <p className="px-1 py-2 text-[13px] text-ink/55">{t("noResults")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-ink/8">
            {results.slice(0, MAX_RESULTS).map(({ item, lang }) => (
              <li key={item.key}>
                <Link
                  href={{ pathname: "/admin/texts/[page]", params: { page: item.pageId }, query: { key: item.key, lang } }}
                  className="group flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-ink/[0.04]"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[13px] leading-snug">{snippet(lang === "fr" ? item.fr : item.en, needle)}</span>
                    <span className="flex items-center gap-2 font-mono text-[10.5px] text-ink/45">
                      {item.pageName}
                      <span aria-hidden>·</span>
                      {item.key}
                    </span>
                  </div>
                  <StatusPill className="mt-0.5 flex-none">{lang.toUpperCase()}</StatusPill>
                  <ArrowUpRight size={15} className="mt-0.5 flex-none text-ink/30 group-hover:text-accent" />
                </Link>
              </li>
            ))}
            {results.length > MAX_RESULTS ? (
              <li className="px-2 pt-2.5 text-[12px] text-ink/50">
                {t("more", { count: results.length - MAX_RESULTS })}
              </li>
            ) : null}
          </ul>
        )
      ) : null}
    </div>
  );
}
