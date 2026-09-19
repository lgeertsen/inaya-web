import type { SupabaseClient } from "@supabase/supabase-js";
import { getPathname } from "@/i18n/navigation";
import { getAnimals } from "./animals";
import type { SiteTextPage } from "./site-text-pages";
import type { SiteTextLocale } from "./site-texts";

/**
 * Public URL shown in the editor's preview iframe, per locale. Pages that
 * need a real record (an animal's profile) preview a sample one — a cat when
 * possible, since cat profiles show the most texts (temperament, ...).
 */
export async function getPreviewPaths(
  page: SiteTextPage,
  supabase: SupabaseClient,
): Promise<Record<SiteTextLocale, string>> {
  let animalId: string | null = null;

  if (page.sample === "animal") {
    const [cat] = await getAnimals(supabase, { inShelterOnly: true, species: "cat", limit: 1 });
    const [sample] = cat ? [cat] : await getAnimals(supabase, { inShelterOnly: true, limit: 1 });
    animalId = sample?.id ?? null;
  }

  const pathFor = (locale: SiteTextLocale) =>
    animalId
      ? getPathname({ href: { pathname: "/animals/[id]", params: { id: animalId } }, locale })
      : getPathname({ href: page.route, locale });

  return { fr: pathFor("fr"), en: pathFor("en") };
}
