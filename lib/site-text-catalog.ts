import type { SupabaseClient } from "@supabase/supabase-js";
import fr from "@/i18n/messages/fr.json";
import en from "@/i18n/messages/en.json";
import { flatten, isEditableKey, type SiteTextLocale } from "./site-texts";

export interface LocaleText {
  /** Shipped copy from the JSON file. */
  default: string;
  /** What the site currently shows (override if any, else default). */
  value: string;
  /** ISO timestamp of the admin edit, or null when showing the default. */
  editedAt: string | null;
}

export interface CatalogEntry {
  key: string;
  fr: LocaleText;
  en: LocaleText;
}

export const SITE_TEXT_LOCALES: SiteTextLocale[] = ["fr", "en"];

const DEFAULTS: Record<SiteTextLocale, Record<string, string>> = {
  fr: flatten(fr),
  en: flatten(en),
};

interface OverrideRow {
  locale: SiteTextLocale;
  key: string;
  value: string;
  updated_at: string;
}

/** Every editable string of the public site, with its default and current (possibly edited) value. */
export async function loadSiteTextCatalog(supabase: SupabaseClient): Promise<CatalogEntry[]> {
  const { data, error } = await supabase.from("site_texts").select("locale, key, value, updated_at");
  if (error) throw error;

  const overrides: Record<SiteTextLocale, Map<string, OverrideRow>> = { fr: new Map(), en: new Map() };
  for (const row of (data ?? []) as OverrideRow[]) {
    overrides[row.locale]?.set(row.key, row);
  }

  const pick = (locale: SiteTextLocale, key: string): LocaleText => {
    const shipped = DEFAULTS[locale][key] ?? "";
    const override = overrides[locale].get(key);
    return {
      default: shipped,
      value: override?.value ?? shipped,
      editedAt: override?.updated_at ?? null,
    };
  };

  return Object.keys(DEFAULTS.fr)
    .filter(isEditableKey)
    .map((key) => ({ key, fr: pick("fr", key), en: pick("en", key) }));
}

/** Shipped default for a key in one locale, or undefined when the key doesn't exist / isn't editable. */
export function getDefaultText(locale: SiteTextLocale, key: string): string | undefined {
  if (!isEditableKey(key)) return undefined;
  return DEFAULTS[locale][key];
}
