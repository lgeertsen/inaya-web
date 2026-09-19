import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadSiteTextCatalog } from "@/lib/site-text-catalog";
import { ALL_TEXT_PAGES, getTextPage, pageForKey } from "@/lib/site-text-pages";
import { getPreviewPaths } from "@/lib/site-text-preview";
import { TextEditor } from "@/components/admin/texts/TextEditor";

export default async function AdminTextEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ page: string }>;
  searchParams: Promise<{ key?: string; lang?: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const { page: pageId } = await params;
  const { key, lang } = await searchParams;
  const page = getTextPage(pageId);
  if (!page) notFound();

  const t = await getTranslations("admin.texts");
  const supabase = await createClient();
  const [entries, previewPaths] = await Promise.all([
    loadSiteTextCatalog(supabase),
    getPreviewPaths(page, supabase),
  ]);

  // Only offer pages that own at least one string (the catch-all appears only when needed).
  const owningPages = new Set(entries.map((entry) => pageForKey(entry.key).id));
  const pages = ALL_TEXT_PAGES.filter((option) => owningPages.has(option.id) || option.id === page.id).map(
    (option) => ({ id: option.id, name: t(`pages.${option.id}.name`) }),
  );

  return (
    <TextEditor
      page={{ id: page.id, prefixes: page.prefixes, name: t(`pages.${page.id}.name`) }}
      pages={pages}
      entries={entries}
      previewPaths={previewPaths}
      initialLocale={lang === "en" ? "en" : "fr"}
      initialKey={key}
    />
  );
}
