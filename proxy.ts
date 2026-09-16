import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing, type AppLocale } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const handleI18nRouting = createIntlMiddleware(routing);

/**
 * next-intl's default Accept-Language negotiation matches against the whole
 * language list a browser sends, so a non-English, non-French OS that still
 * lists English as a fallback (common on Windows/macOS) can get English
 * instead of the French default. Only trust the visitor's *primary*
 * language: English if that's really English, French otherwise. A prior
 * manual locale choice (NEXT_LOCALE cookie, set when using the site's
 * locale switcher) always wins.
 */
function resolvePreferredLocale(request: NextRequest): AppLocale {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (routing.locales.includes(cookieLocale as AppLocale)) {
    return cookieLocale as AppLocale;
  }

  const acceptLanguage = request.headers.get("accept-language");
  const primaryTag = acceptLanguage
    ?.split(",")[0]
    ?.split(";")[0]
    ?.trim()
    .split("-")[0]
    ?.toLowerCase();

  return primaryTag === "en" ? "en" : routing.defaultLocale;
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const prefixLocale = routing.locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  const hasLocalePrefix = prefixLocale !== undefined;

  const pathWithoutLocale = prefixLocale
    ? pathname.slice(`/${prefixLocale}`.length) || "/"
    : pathname;
  const isAdminPath =
    pathWithoutLocale === "/admin" || pathWithoutLocale.startsWith("/admin/");

  // The admin back office is French-only: ignore the visitor's preferred
  // language and any /en prefix, and always land on the /fr version.
  if (isAdminPath && prefixLocale !== "fr") {
    const url = new URL(`/fr${pathWithoutLocale}`, request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  const intlResponse = hasLocalePrefix
    ? handleI18nRouting(request)
    : NextResponse.redirect(
        new URL(`/${resolvePreferredLocale(request)}${pathname}`, request.url),
      );

  const { response, user } = await updateSession(request, intlResponse);

  const locale = prefixLocale ?? routing.defaultLocale;

  const adminPathWithoutLocale = pathWithoutLocale;
  const isProtectedAdminPath =
    adminPathWithoutLocale.startsWith("/admin") &&
    adminPathWithoutLocale !== "/admin/login";

  if (isProtectedAdminPath && !user) {
    const loginUrl = new URL(`/${locale}/admin/login`, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
