import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { applyOverrides, getOverrides, type Messages } from "@/lib/site-texts";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // The JSON files are the shipped defaults; texts an admin edited from
  // /admin/texts (stored in the site_texts table) are layered on top.
  const defaults = (await import(`./messages/${locale}.json`)).default as Messages;
  const overrides = await getOverrides(locale);

  return {
    locale,
    messages: applyOverrides(defaults, overrides),
  };
});
