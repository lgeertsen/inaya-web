import type { routing } from "@/i18n/routing";

type StaticPublicRoute =
  | "/"
  | "/about"
  | "/team"
  | "/animals"
  | "/adopt"
  | "/adopt/calicivirus"
  | "/surrender"
  | "/help"
  | "/volunteer"
  | "/foster-family"
  | "/teaming"
  | "/contact"
  | "/donate"
  | "/donate/success"
  | "/donate/cancel";

// Compile-time guard: every preview route must be a declared pathname.
type _RouteIsDeclared = StaticPublicRoute extends keyof typeof routing.pathnames ? true : never;
const _routeCheck: _RouteIsDeclared = true;
void _routeCheck;

export interface SiteTextPage {
  /** URL segment in /admin/texts/[page]. Names/descriptions live in admin.texts.pages.<id>. */
  id: string;
  /** Public page shown in the preview iframe. */
  route: StaticPublicRoute;
  /**
   * Message-key prefixes this page owns. The longest matching prefix wins, so
   * `adopt.calicivirus` belongs to the calicivirus page, not to `adopt`.
   */
  prefixes: string[];
  /**
   * The page needs a real record to render (e.g. an animal's profile), so the
   * editor previews a sample one; the static `route` is the fallback when none exists.
   */
  sample?: "animal";
}

export const SITE_TEXT_PAGES: SiteTextPage[] = [
  { id: "home", route: "/", prefixes: ["home", "helpCards"] },
  { id: "site", route: "/", prefixes: ["announcement", "nav", "footer", "common"] },
  { id: "about", route: "/about", prefixes: ["about"] },
  { id: "team", route: "/team", prefixes: ["team"] },
  { id: "animals", route: "/animals", prefixes: ["animals"] },
  {
    id: "animal-detail",
    route: "/animals",
    sample: "animal",
    // Longer prefixes than "animals", so these keys move off the list page.
    prefixes: [
      "animals.backToList",
      "animals.sex",
      "animals.yearsOld",
      "animals.keyFacts",
      "animals.breed",
      "animals.age",
      "animals.sexLabel",
      "animals.arrived",
      "animals.specialNeeds",
      "animals.temperament",
      "animals.temperaments",
      "animals.location",
      "animals.locations",
      "animals.adoptionCta",
      "animals.sponsorshipCta",
    ],
  },
  { id: "adopt", route: "/adopt", prefixes: ["adopt"] },
  { id: "calicivirus", route: "/adopt/calicivirus", prefixes: ["adopt.calicivirus"] },
  { id: "surrender", route: "/surrender", prefixes: ["surrender"] },
  { id: "help", route: "/help", prefixes: ["help"] },
  { id: "volunteer", route: "/volunteer", prefixes: ["volunteer"] },
  { id: "foster-family", route: "/foster-family", prefixes: ["fosterFamily"] },
  { id: "teaming", route: "/teaming", prefixes: ["teaming"] },
  { id: "contact", route: "/contact", prefixes: ["contact"] },
  { id: "donate", route: "/donate", prefixes: ["donate"] },
  { id: "donate-success", route: "/donate/success", prefixes: ["donate.success"] },
  { id: "donate-cancel", route: "/donate/cancel", prefixes: ["donate.cancel"] },
];

/** Catch-all for any string no page claims (e.g. a namespace added later), so nothing is unreachable. */
export const OTHER_PAGE: SiteTextPage = { id: "other", route: "/", prefixes: [] };

export const ALL_TEXT_PAGES: SiteTextPage[] = [...SITE_TEXT_PAGES, OTHER_PAGE];

export function getTextPage(id: string): SiteTextPage | undefined {
  return ALL_TEXT_PAGES.find((page) => page.id === id);
}

function prefixLength(key: string, prefix: string): number {
  return key === prefix || key.startsWith(`${prefix}.`) ? prefix.length : -1;
}

/** The page that owns a message key (longest matching prefix), or the catch-all. */
export function pageForKey(key: string): SiteTextPage {
  let best: SiteTextPage = OTHER_PAGE;
  let bestLength = -1;
  for (const page of SITE_TEXT_PAGES) {
    for (const prefix of page.prefixes) {
      const length = prefixLength(key, prefix);
      if (length > bestLength) {
        best = page;
        bestLength = length;
      }
    }
  }
  return best;
}
