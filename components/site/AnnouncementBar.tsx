import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function AnnouncementBar() {
  const t = await getTranslations("announcement");

  return (
    <div className="bg-ink text-[#f3f1f2] px-5 py-2.5 flex justify-center items-center gap-2.5 flex-wrap text-[13.5px] tracking-[0.01em]">
      <span className="opacity-80">{t("text")}</span>
      <Link
        href="/help"
        className="text-accent-light font-bold border-b border-accent-light/45 hover:opacity-80"
      >
        {t("cta")} →
      </Link>
    </div>
  );
}
