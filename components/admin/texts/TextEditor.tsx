"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  MousePointerClick,
  Monitor,
  ScanSearch,
  Search,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminSelect } from "@/components/admin/ui/AdminField";
import { checkAgainstDefault } from "@/lib/icu";
import type { CatalogEntry } from "@/lib/site-text-catalog";
import { pageForKey } from "@/lib/site-text-pages";
import type { SiteTextLocale } from "@/lib/site-texts";
import { PreviewFrame } from "./PreviewFrame";
import { TextField, type FieldProblem } from "./TextField";
import type { KeyLocation, ScanInput } from "./preview-controller";

type Tab = "content" | "chrome" | "hidden";
type LocaleDrafts = Record<string, string>;

interface TextEditorProps {
  page: { id: string; prefixes: string[]; name: string };
  pages: { id: string; name: string }[];
  entries: CatalogEntry[];
  /** Public preview path per locale, e.g. { fr: "/fr/a-propos", en: "/en/about" }. */
  previewPaths: Record<SiteTextLocale, string>;
  initialLocale: SiteTextLocale;
  /** Key to select once the page has been scanned (deep link from the picker's search). */
  initialKey?: string;
}

const LOCALES: SiteTextLocale[] = ["fr", "en"];
const MAX_VERIFY_ATTEMPTS = 4;

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-[9px] border border-ink/14 bg-surface p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[12.5px] font-bold transition-colors ${
            option.value === value ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

function problemFor(value: string, entry: CatalogEntry, locale: SiteTextLocale): FieldProblem | null {
  const trimmed = value.trim();
  if (!trimmed) return "empty";
  return checkAgainstDefault(trimmed, entry[locale].default);
}

export function TextEditor({
  page,
  pages,
  entries: initialEntries,
  previewPaths,
  initialLocale,
  initialKey,
}: TextEditorProps) {
  const t = useTranslations("admin.texts");
  const router = useRouter();

  const [entries, setEntries] = useState(initialEntries);
  const [locale, setLocale] = useState<SiteTextLocale>(initialLocale);
  const [drafts, setDrafts] = useState<Record<SiteTextLocale, LocaleDrafts>>({ fr: {}, en: {} });
  const [locations, setLocations] = useState<Record<string, KeyLocation>>({});
  // "panel": the admin focused a field · "preview": they clicked text in the page · "link": deep link.
  const [selection, setSelection] = useState<{ key: string | null; source: "panel" | "preview" | "link" }>({
    key: null,
    source: "link",
  });
  const [hovered, setHovered] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [showAll, setShowAll] = useState(false);
  const [tab, setTab] = useState<Tab>(page.id === "site" ? "chrome" : "content");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [serverProblems, setServerProblems] = useState<Record<string, FieldProblem>>({});
  const [reloadToken, setReloadToken] = useState(0);

  const verifyRef = useRef<{ keys: string[]; attempts: number } | null>(null);

  const entryByKey = useMemo(() => new Map(entries.map((entry) => [entry.key, entry])), [entries]);

  /* ------------------------------------------------------------ drafts */

  const setDraft = useCallback(
    (target: SiteTextLocale, key: string, text: string) => {
      const saved = entryByKey.get(key)?.[target].value;
      setDrafts((prev) => {
        const next = { ...prev[target] };
        if (text === saved) delete next[key];
        else next[key] = text;
        return { ...prev, [target]: next };
      });
      setServerProblems((prev) => {
        if (!(`${target}:${key}` in prev)) return prev;
        const rest = { ...prev };
        delete rest[`${target}:${key}`];
        return rest;
      });
      setStatus("idle");
    },
    [entryByKey],
  );

  const dirtyCount = Object.keys(drafts.fr).length + Object.keys(drafts.en).length;

  const localProblems = useMemo(() => {
    const found: Record<string, FieldProblem> = {};
    for (const target of LOCALES) {
      for (const [key, value] of Object.entries(drafts[target])) {
        const entry = entryByKey.get(key);
        const problem = entry ? problemFor(value, entry, target) : "unknown_key";
        if (problem) found[`${target}:${key}`] = problem;
      }
    }
    return found;
  }, [drafts, entryByKey]);

  const problemCount = Object.keys(localProblems).length + Object.keys(serverProblems).length;

  useEffect(() => {
    if (dirtyCount === 0) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyCount]);

  useEffect(() => {
    if (status !== "saved") return;
    const timer = window.setTimeout(() => setStatus("idle"), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  /* ----------------------------------------------------------- preview */

  const scanInput = useMemo<ScanInput>(
    () => ({
      entries: entries.map((entry) => {
        const draft = drafts[locale][entry.key];
        return { key: entry.key, values: draft === undefined ? [entry[locale].value] : [entry[locale].value, draft] };
      }),
      preferPrefixes: page.prefixes,
    }),
    [entries, drafts, locale, page.prefixes],
  );
  const scanInputRef = useRef(scanInput);
  useEffect(() => {
    scanInputRef.current = scanInput;
  });
  const getScanInput = useCallback(() => scanInputRef.current, []);

  const locationsRef = useRef<Record<string, KeyLocation>>({});
  const initialKeyApplied = useRef(false);

  const tabForKey = (key: string, located: Record<string, KeyLocation>): Tab | null => {
    const location = located[key];
    if (!location?.visible) return null;
    return location.region === "page" ? "content" : "chrome";
  };

  const handleLocated = useCallback(
    (located: Record<string, KeyLocation>) => {
      locationsRef.current = located;
      setLocations(located);

      // Deep link from the picker's search: select that text once the page is scanned.
      if (initialKey && !initialKeyApplied.current && located[initialKey]?.visible) {
        initialKeyApplied.current = true;
        setSelection({ key: initialKey, source: "link" });
        setTab(located[initialKey].region === "page" ? "content" : "chrome");
      }

    // After a save the public page is regenerated in the background, so the first
    // reload may still show the old text. Retry until the new text is on the page.
    const verify = verifyRef.current;
    if (!verify) return;
    const stale = verify.keys.some((key) => !located[key]?.visible);
    if (stale && verify.attempts < MAX_VERIFY_ATTEMPTS) {
      verify.attempts += 1;
      window.setTimeout(() => setReloadToken((token) => token + 1), 1200);
    } else {
      verifyRef.current = null;
    }
    },
    [initialKey],
  );

  // Clicking a text in the preview opens whichever tab holds its field.
  const handlePreviewSelect = useCallback((key: string) => {
    setSelection({ key, source: "preview" });
    setQuery("");
    const tabToOpen = tabForKey(key, locationsRef.current);
    if (tabToOpen) setTab(tabToOpen);
  }, []);

  // Picking a text from the list in the side panel.
  const handlePickText = useCallback((key: string) => {
    setSelection({ key, source: "panel" });
  }, []);

  const handleFieldFocus = useCallback((key: string) => {
    setSelection((prev) => (prev.key === key ? prev : { key, source: "panel" }));
  }, []);

  const handleBackToList = useCallback(() => {
    setSelection({ key: null, source: "link" });
    setHovered(null);
  }, []);

  const handleLocaleChange = useCallback((next: SiteTextLocale) => {
    setLocale(next);
    setLocations({});
    setSelection({ key: null, source: "link" });
  }, []);

  /* ------------------------------------------------------- field lists */

  const { contentEntries, chromeEntries, hiddenEntries } = useMemo(() => {
    const byOrder = (a: CatalogEntry, b: CatalogEntry) => locations[a.key].order - locations[b.key].order;
    const located = entries.filter((entry) => locations[entry.key]?.visible);
    return {
      contentEntries: located.filter((entry) => locations[entry.key].region === "page").sort(byOrder),
      chromeEntries: located.filter((entry) => locations[entry.key].region !== "page").sort(byOrder),
      hiddenEntries: entries.filter(
        (entry) => pageForKey(entry.key).id === page.id && !locations[entry.key]?.visible,
      ),
    };
  }, [entries, locations, page.id]);

  const tabEntries: Record<Tab, CatalogEntry[]> = {
    content: contentEntries,
    chrome: chromeEntries,
    hidden: hiddenEntries,
  };

  const needle = query.trim().toLowerCase();
  const visibleEntries = tabEntries[tab].filter((entry) => {
    if (!needle) return true;
    const value = (drafts[locale][entry.key] ?? entry[locale].value).toLowerCase();
    return entry.key.toLowerCase().includes(needle) || value.includes(needle);
  });

  // Put the cursor in the selected text's field. Never scrolls the page, so the preview stays where it is.
  useEffect(() => {
    const key = selection.key;
    if (!key) return;
    const frame = window.requestAnimationFrame(() => {
      const field = document.getElementById(`field-${key}`);
      // The click happened inside the preview iframe, which still holds keyboard focus.
      window.focus();
      field?.querySelector("textarea")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selection]);

  /* -------------------------------------------------------------- save */

  async function save() {
    setSaving(true);
    setStatus("idle");
    setServerProblems({});

    try {
      for (const target of LOCALES) {
        const changes = Object.entries(drafts[target]).map(([key, value]) => ({ key, value: value.trim() }));
        if (changes.length === 0) continue;

        const response = await fetch("/api/admin/site-texts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: target, changes }),
        });
        const body = await response.json().catch(() => null);

        if (!response.ok) {
          const errors = (body?.errors ?? {}) as Record<string, FieldProblem>;
          setServerProblems(
            Object.fromEntries(Object.entries(errors).map(([key, problem]) => [`${target}:${key}`, problem])),
          );
          setStatus("error");
          return;
        }

        const now = new Date().toISOString();
        const saved = new Map(changes.map((change) => [change.key, change.value]));
        setEntries((prev) =>
          prev.map((entry) => {
            const value = saved.get(entry.key);
            if (value === undefined) return entry;
            return { ...entry, [target]: { ...entry[target], value, editedAt: value === entry[target].default ? null : now } };
          }),
        );
        setDrafts((prev) => ({ ...prev, [target]: {} }));

        if (target === locale) {
          const keys = changes.map((change) => change.key).filter((key) => locations[key]?.visible);
          verifyRef.current = keys.length > 0 ? { keys, attempts: 0 } : null;
        }
      }
      setStatus("saved");
      setReloadToken((token) => token + 1);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  function discardAll() {
    setDrafts({ fr: {}, en: {} });
    setServerProblems({});
    setStatus("idle");
  }

  function switchPage(id: string) {
    if (dirtyCount > 0 && !window.confirm(t("leaveConfirm"))) return;
    router.push({ pathname: "/admin/texts/[page]", params: { page: id } });
  }

  /* ------------------------------------------------------------ render */

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "content", label: t("tabs.content"), count: contentEntries.length },
    { id: "chrome", label: t("tabs.chrome"), count: chromeEntries.length },
    { id: "hidden", label: t("tabs.hidden"), count: hiddenEntries.length },
  ];
  const scanning = Object.keys(locations).length === 0;
  const otherLocale: SiteTextLocale = locale === "fr" ? "en" : "fr";
  const otherLocaleDraftCount = Object.keys(drafts[otherLocale]).length;
  const src = previewPaths[locale];
  const selectedEntry = selection.key ? entryByKey.get(selection.key) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:h-screen">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-ink/10 bg-white/92 px-5 py-3">
        <Link
          href="/admin/texts"
          className="inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[12.5px] font-bold text-ink/65 hover:bg-ink/5 hover:text-ink"
        >
          <ArrowLeft size={15} />
          {t("back")}
        </Link>
        <div className="flex min-w-0 flex-col gap-[3px]">
          <h1 className="truncate text-[17px]">{page.name}</h1>
          <span className="truncate font-mono text-[10.5px] tracking-[0.06em] text-ink/50">{src}</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <AdminSelect
            aria-label={t("switchPage")}
            value={page.id}
            onChange={(event) => switchPage(event.target.value)}
            className="!w-auto !py-[7px] font-bold"
          >
            {pages.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </AdminSelect>
          <Segmented
            label={t("language")}
            value={locale}
            onChange={handleLocaleChange}
            options={LOCALES.map((value) => ({ value, label: value.toUpperCase() }))}
          />
          <Segmented
            label={t("viewport.label")}
            value={viewport}
            onChange={setViewport}
            options={[
              { value: "desktop", label: t("viewport.desktop"), icon: <Monitor size={14} /> },
              { value: "mobile", label: t("viewport.mobile"), icon: <Smartphone size={14} /> },
            ]}
          />
          <AdminButton
            size="sm"
            variant="outline"
            aria-pressed={showAll}
            onClick={() => setShowAll((value) => !value)}
            className={showAll ? "!border-accent !text-accent" : ""}
          >
            <ScanSearch size={14} />
            {t("showAll")}
          </AdminButton>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[12.5px] font-bold text-ink/65 hover:bg-ink/5 hover:text-ink"
          >
            <ExternalLink size={14} />
            {t("openLive")}
          </a>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* flex-none below lg so the 70vh height is honoured (flex-1 would size it to its content). */}
        <div className="flex h-[70vh] min-h-0 min-w-0 flex-none flex-col lg:h-auto lg:flex-1">
          <div className="flex items-center gap-2 border-b border-ink/8 bg-surface px-4 py-2 text-[12px] text-ink/60">
            <MousePointerClick size={14} className="flex-none text-accent" />
            {t("previewHint")}
          </div>
          <div className="relative min-h-0 min-w-0 flex-1">
            <PreviewFrame
              src={src}
              viewport={viewport}
              getScanInput={getScanInput}
              drafts={drafts[locale]}
              selectedKey={selection.key}
              scrollToSelected={selection.source !== "preview"}
              hoveredKey={hovered}
              showAll={showAll}
              reloadToken={reloadToken}
              badgeLabel={t("badge")}
              loadingLabel={t("loadingPreview")}
              onLocated={handleLocated}
              onSelect={handlePreviewSelect}
              onHover={setHovered}
            />
          </div>
        </div>

        <aside className="flex min-h-[60vh] w-full flex-none flex-col border-t border-ink/10 bg-background lg:min-h-0 lg:w-[440px] lg:border-l lg:border-t-0">
          {selectedEntry ? (
            <div className="border-b border-ink/10 bg-surface px-3.5 py-2.5">
              <button
                type="button"
                onClick={handleBackToList}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[12.5px] font-bold text-ink/65 hover:bg-ink/5 hover:text-ink"
              >
                <ArrowLeft size={15} />
                {t("allTexts")}
              </button>
            </div>
          ) : (
          <div className="flex flex-col gap-2.5 border-b border-ink/10 bg-surface px-3.5 pb-0 pt-3">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-[9px] border border-ink/14 bg-surface py-2 pl-8 pr-3 text-[13px] outline-none focus:border-accent"
              />
            </div>
            <div role="tablist" className="flex gap-1 overflow-x-auto">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex-none cursor-pointer whitespace-nowrap border-b-2 px-2.5 pb-2.5 pt-1 text-[12.5px] font-bold transition-colors ${
                    tab === item.id ? "border-accent text-ink" : "border-transparent text-ink/50 hover:text-ink"
                  }`}
                >
                  {item.label}
                  <span className="ml-1.5 rounded-pill bg-ink/6 px-1.5 py-0.5 font-mono text-[10px] text-ink/60">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3.5">
            {selectedEntry ? (
              <TextField
                key={selectedEntry.key}
                entry={selectedEntry}
                locale={locale}
                value={drafts[locale][selectedEntry.key] ?? selectedEntry[locale].value}
                location={locations[selectedEntry.key]}
                isSelected
                isHovered={false}
                problem={
                  localProblems[`${locale}:${selectedEntry.key}`] ??
                  serverProblems[`${locale}:${selectedEntry.key}`] ??
                  null
                }
                onChange={(value) => setDraft(locale, selectedEntry.key, value)}
                onFocus={() => handleFieldFocus(selectedEntry.key)}
                onHover={() => {}}
                onUndo={() => setDraft(locale, selectedEntry.key, selectedEntry[locale].value)}
                onResetToDefault={() => setDraft(locale, selectedEntry.key, selectedEntry[locale].default)}
              />
            ) : (
              <>
                <p className="flex items-start gap-2 rounded-admin-sm bg-accent-bg px-3 py-2.5 text-[12.5px] leading-relaxed text-ink/75">
                  <MousePointerClick size={15} className="mt-0.5 flex-none text-accent" />
                  {t("selectHint")}
                </p>

                {tab === "hidden" ? (
                  <p className="rounded-admin-sm bg-ink/[0.04] px-3 py-2.5 text-[12px] leading-relaxed text-ink/65">
                    {t("hiddenExplain")}
                  </p>
                ) : null}

                {scanning ? (
                  <p className="flex items-center gap-2 py-6 text-[13px] text-ink/55">
                    <Loader2 size={15} className="animate-spin" />
                    {t("scanning")}
                  </p>
                ) : visibleEntries.length === 0 ? (
                  <p className="py-6 text-center text-[13px] text-ink/50">{needle ? t("noResults") : t("emptyTab")}</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {visibleEntries.map((entry) => {
                      const location = locations[entry.key];
                      const current = drafts[locale][entry.key] ?? entry[locale].value;
                      return (
                        <li key={entry.key}>
                          <button
                            type="button"
                            onClick={() => handlePickText(entry.key)}
                            onMouseEnter={() => setHovered(entry.key)}
                            onMouseLeave={() => setHovered(null)}
                            className={`flex w-full cursor-pointer flex-col gap-1 rounded-admin border bg-surface px-3 py-2.5 text-left transition-colors hover:border-accent/55 ${
                              hovered === entry.key ? "border-accent/55" : "border-ink/10"
                            }`}
                          >
                            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                              {location ? t(`roles.${location.role}`) : t("roles.other")}
                              {entry.key in drafts[locale] ? (
                                <span className="rounded-pill bg-warning-bg px-1.5 py-0.5 text-[9.5px] text-warning">
                                  {t("field.unsaved")}
                                </span>
                              ) : null}
                            </span>
                            <span className="line-clamp-2 text-[13px] leading-snug">{current}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-ink/10 bg-surface px-3.5 py-3">
            <div className="flex min-w-0 flex-1 flex-col text-[12.5px]">
              {status === "saved" ? (
                <span className="flex items-center gap-1.5 font-bold text-success">
                  <Check size={15} />
                  {t("save.saved")}
                </span>
              ) : status === "error" ? (
                <span className="flex items-center gap-1.5 font-bold text-danger">
                  <TriangleAlert size={15} />
                  {t("save.failed")}
                </span>
              ) : dirtyCount > 0 ? (
                <>
                  <span className="font-bold">{t("save.unsaved", { count: dirtyCount })}</span>
                  {otherLocaleDraftCount > 0 ? (
                    <span className="text-[11.5px] text-ink/55">
                      {t("save.otherLanguage", {
                        count: otherLocaleDraftCount,
                        language: otherLocale.toUpperCase(),
                      })}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-ink/50">{t("save.noChanges")}</span>
              )}
              {problemCount > 0 ? (
                <span className="text-[11.5px] font-bold text-danger">{t("save.fixProblems", { count: problemCount })}</span>
              ) : null}
            </div>
            <AdminButton size="sm" onClick={discardAll} disabled={dirtyCount === 0 || saving}>
              {t("save.discard")}
            </AdminButton>
            <AdminButton
              size="sm"
              variant="dark"
              onClick={save}
              disabled={dirtyCount === 0 || saving || problemCount > 0}
              className="disabled:cursor-not-allowed disabled:opacity-45"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? t("save.saving") : t("save.save")}
            </AdminButton>
          </div>
        </aside>
      </div>
    </div>
  );
}
