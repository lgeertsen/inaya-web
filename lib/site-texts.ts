import { unstable_cache } from "next/cache";
import { createAnonClient } from "./supabase/anon";

export type Messages = { [key: string]: unknown };
export type SiteTextLocale = "fr" | "en";

/** Cache tag invalidated whenever an admin saves or resets a text. */
export const SITE_TEXTS_TAG = "site-texts";

/**
 * The `admin` namespace is the French-only staff UI — never editable from
 * /admin/texts, so an edit can't break the panel used to make edits.
 */
export function isEditableKey(key: string): boolean {
  return key !== "admin" && !key.startsWith("admin.");
}

/**
 * Flattens a messages tree into `{ "home.title": "...", "adopt.steps.2": "..." }`.
 * Only leaf strings are kept; array items are addressed by index.
 */
export function flatten(messages: unknown, prefix = "", out: Record<string, string> = {}) {
  if (typeof messages === "string") {
    out[prefix] = messages;
  } else if (Array.isArray(messages)) {
    messages.forEach((item, index) => flatten(item, prefix ? `${prefix}.${index}` : String(index), out));
  } else if (messages && typeof messages === "object") {
    for (const [key, value] of Object.entries(messages)) {
      flatten(value, prefix ? `${prefix}.${key}` : key, out);
    }
  }
  return out;
}

/**
 * Returns a copy of `defaults` with each override applied at its dotted path.
 * An override is only applied where the default already has a string, so the
 * message structure (and every `t.raw(...) as string[]` cast) stays exactly as
 * shipped, and rows left behind by a renamed/removed key are silently ignored.
 */
export function applyOverrides(defaults: Messages, overrides: Record<string, string>): Messages {
  const keys = Object.keys(overrides);
  if (keys.length === 0) return defaults;

  const merged = structuredClone(defaults);
  for (const key of keys) {
    if (!isEditableKey(key)) continue;
    const path = key.split(".");
    const last = path.pop()!;
    let node: unknown = merged;
    for (const segment of path) {
      node = (node as Record<string, unknown> | undefined)?.[segment];
      if (node === undefined || node === null || typeof node !== "object") break;
    }
    if (node && typeof node === "object" && typeof (node as Record<string, unknown>)[last] === "string") {
      (node as Record<string, unknown>)[last] = overrides[key];
    }
  }
  return merged;
}

async function fetchOverrides(locale: SiteTextLocale): Promise<Record<string, string>> {
  const { data, error } = await createAnonClient()
    .from("site_texts")
    .select("key, value")
    .eq("locale", locale);
  // Throw (rather than return {}) so a failed read is never stored in the cache.
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row) => [row.key as string, row.value as string]));
}

const getCachedOverrides = unstable_cache(fetchOverrides, ["site-texts-overrides"], {
  tags: [SITE_TEXTS_TAG],
  // Safety net only — saves invalidate the tag immediately.
  revalidate: 300,
});

/** Overrides for one locale. Never throws: on any failure the site serves the shipped JSON. */
export async function getOverrides(locale: SiteTextLocale): Promise<Record<string, string>> {
  try {
    return await getCachedOverrides(locale);
  } catch (error) {
    console.error("[site-texts] Could not load overrides, using shipped texts:", error);
    return {};
  }
}
