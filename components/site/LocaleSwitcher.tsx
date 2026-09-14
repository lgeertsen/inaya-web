"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const activeLocale = useLocale();

  return (
    <div className="flex items-center gap-1 text-[13px] font-bold">
      {routing.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => router.replace(pathname, { locale })}
          aria-current={locale === activeLocale}
          className={`px-2.5 py-1 rounded-pill uppercase transition-colors ${
            locale === activeLocale ? "bg-ink text-white" : "text-ink/50 hover:text-ink"
          }`}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
