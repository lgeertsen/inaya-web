import { unstable_cache } from "next/cache";
import type { ImageAspect } from "@/components/ui/ImagePlaceholder";
import { createAnonClient } from "./supabase/anon";

/** Cache tag invalidated whenever an admin uploads, changes or removes a site image. */
export const SITE_IMAGES_TAG = "site-images";
export const SITE_IMAGE_BUCKET = "site-images";

export interface SiteImageSlot {
  /** Stable id stored in `site_images.slot_id` — never derived from a message key, so renaming copy can't orphan an upload. */
  id: string;
  /** Owning page; an id from `SITE_TEXT_PAGES`, so the admin reuses `admin.texts.pages.<id>.name`. */
  page: string;
  /** Shape of the box on the public page; "fill" for backdrops that stretch to whatever their container is. */
  aspect: ImageAspect | "fill";
  /** Message key holding the caption; doubles as the photo's `alt` text and stays editable from /admin/texts. */
  labelKey: string;
  /** `sizes` hint for `next/image`, matching how wide the slot renders. */
  sizes: string;
  /** Above the fold on load, so it should not be lazy-loaded. */
  eager?: boolean;
}

const HALF = "(min-width: 768px) 45vw, 100vw";
const THIRD = "(min-width: 768px) 33vw, 100vw";
const WIDE = "(min-width: 768px) 800px, 100vw";

// Order here is the order the admin sees within each page.
export const SITE_IMAGE_SLOTS = [
  { id: "home.hero", page: "home", aspect: "fill", labelKey: "home.images.hero", sizes: "100vw", eager: true },
  { id: "home.about", page: "home", aspect: "5/4", labelKey: "home.images.about", sizes: HALF },
  { id: "home.donation", page: "home", aspect: "3/2", labelKey: "helpCards.donation.image", sizes: "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 100vw" },
  { id: "home.sponsorship", page: "home", aspect: "3/2", labelKey: "helpCards.sponsorship.image", sizes: "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 100vw" },
  { id: "home.adoption", page: "home", aspect: "3/2", labelKey: "helpCards.adoption.image", sizes: "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 100vw" },
  { id: "home.volunteer", page: "home", aspect: "3/2", labelKey: "helpCards.volunteer.image", sizes: "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 100vw" },
  { id: "home.legacy", page: "home", aspect: "3/2", labelKey: "helpCards.legacy.image", sizes: "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 100vw" },
  { id: "home.teaming", page: "home", aspect: "3/2", labelKey: "helpCards.teaming.image", sizes: "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 100vw" },

  { id: "about.hero", page: "about", aspect: "4/3", labelKey: "about.images.hero", sizes: HALF, eager: true },
  { id: "about.story1", page: "about", aspect: "4/3", labelKey: "about.images.story1", sizes: HALF },
  { id: "about.story2", page: "about", aspect: "4/3", labelKey: "about.images.story2", sizes: HALF },

  { id: "adopt.hero", page: "adopt", aspect: "4/3", labelKey: "adopt.images.hero", sizes: HALF, eager: true },
  { id: "adopt.dogs", page: "adopt", aspect: "16/9", labelKey: "adopt.images.dogs", sizes: HALF },
  { id: "adopt.cats", page: "adopt", aspect: "16/9", labelKey: "adopt.images.cats", sizes: HALF },
  { id: "adopt.calicivirus", page: "adopt", aspect: "fill", labelKey: "adopt.images.calicivirus", sizes: HALF },

  { id: "calicivirus.hero", page: "calicivirus", aspect: "4/3", labelKey: "adopt.calicivirus.images.hero", sizes: HALF, eager: true },
  { id: "calicivirus.what", page: "calicivirus", aspect: "3/2", labelKey: "adopt.calicivirus.images.what", sizes: WIDE },
  { id: "calicivirus.symptoms", page: "calicivirus", aspect: "4/3", labelKey: "adopt.calicivirus.images.symptoms", sizes: WIDE },

  { id: "surrender.hero", page: "surrender", aspect: "4/3", labelKey: "surrender.images.hero", sizes: HALF, eager: true },

  { id: "help.hero", page: "help", aspect: "4/3", labelKey: "help.images.hero", sizes: HALF, eager: true },
  { id: "help.gift", page: "help", aspect: "3/2", labelKey: "help.images.gift", sizes: THIRD },
  { id: "help.sponsorship", page: "help", aspect: "3/2", labelKey: "help.images.sponsorship", sizes: THIRD },
  { id: "help.adoption", page: "help", aspect: "3/2", labelKey: "help.images.adoption", sizes: THIRD },

  { id: "volunteer.hero", page: "volunteer", aspect: "16/9", labelKey: "volunteer.images.hero", sizes: WIDE },
  { id: "volunteer.daily", page: "volunteer", aspect: "16/9", labelKey: "volunteer.images.daily", sizes: WIDE },

  { id: "foster-family.hero", page: "foster-family", aspect: "16/9", labelKey: "fosterFamily.images.hero", sizes: WIDE },

  { id: "teaming.impact", page: "teaming", aspect: "4/3", labelKey: "teaming.images.impact", sizes: HALF },
] as const satisfies readonly SiteImageSlot[];

export type SiteImageSlotId = (typeof SITE_IMAGE_SLOTS)[number]["id"];

export function getSiteImageSlot(id: string): SiteImageSlot | undefined {
  return SITE_IMAGE_SLOTS.find((slot) => slot.id === id);
}

export interface SiteImage {
  url: string;
  focalX: number;
  focalY: number;
  updatedAt: string;
}

async function fetchSiteImages(): Promise<Record<string, SiteImage>> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("site_images")
    .select("slot_id, storage_path, focal_x, focal_y, updated_at");
  // Throw (rather than return {}) so a failed read is never stored in the cache.
  if (error) throw error;

  return Object.fromEntries(
    (data ?? []).map((row) => [
      row.slot_id as string,
      {
        url: supabase.storage.from(SITE_IMAGE_BUCKET).getPublicUrl(row.storage_path as string).data.publicUrl,
        focalX: Number(row.focal_x),
        focalY: Number(row.focal_y),
        updatedAt: row.updated_at as string,
      },
    ]),
  );
}

const getCachedSiteImages = unstable_cache(fetchSiteImages, ["site-images"], {
  tags: [SITE_IMAGES_TAG],
  // Safety net only — every admin change invalidates the tag immediately.
  revalidate: 300,
});

/** Uploaded images keyed by slot id. Never throws: on any failure the site keeps showing its placeholders. */
export async function getSiteImages(): Promise<Record<string, SiteImage>> {
  try {
    return await getCachedSiteImages();
  } catch (error) {
    console.error("[site-images] Could not load images, showing placeholders:", error);
    return {};
  }
}
