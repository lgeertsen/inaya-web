"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const TABS = [
  { segment: "edit", pathname: "/admin/animals/[id]/edit", key: "profile" },
  { segment: "photos", pathname: "/admin/animals/[id]/photos", key: "photos" },
  { segment: "care", pathname: "/admin/animals/[id]/care", key: "internalDetails" },
  {
    segment: "intake-outcome",
    pathname: "/admin/animals/[id]/intake-outcome",
    key: "intakeOutcome",
  },
  {
    segment: "vet-appointments",
    pathname: "/admin/animals/[id]/vet-appointments",
    key: "vetAppointments",
  },
  { segment: "foster", pathname: "/admin/animals/[id]/foster", key: "foster" },
] as const;

export function AnimalDetailTabs({ animalId }: { animalId: string }) {
  const pathname = usePathname();
  const t = useTranslations("admin.animals.tabs");

  return (
    <nav className="flex flex-wrap gap-1 rounded-[11px] border border-ink/10 bg-surface p-[5px]">
      {TABS.map((tab) => {
        const isActive = pathname === `/admin/animals/${animalId}/${tab.segment}`;
        return (
          <Link
            key={tab.segment}
            href={{ pathname: tab.pathname, params: { id: animalId } }}
            className={`whitespace-nowrap rounded-[7px] px-3 py-[7px] text-[12.5px] font-bold ${
              isActive ? "bg-ink text-white" : "text-ink/60 hover:bg-ink/5"
            }`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
