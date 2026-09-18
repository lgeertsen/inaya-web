"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const TABS = [
  { segment: "edit", key: "profile" },
  { segment: "photos", key: "photos" },
  { segment: "care", key: "internalDetails" },
  { segment: "intake-outcome", key: "intakeOutcome" },
  { segment: "vet-appointments", key: "vetAppointments" },
] as const;

export function AnimalDetailTabs({ animalId }: { animalId: string }) {
  const pathname = usePathname();
  const t = useTranslations("admin.animals.tabs");

  return (
    <nav className="flex flex-wrap gap-1 rounded-[11px] border border-ink/10 bg-surface p-[5px]">
      {TABS.map((tab) => {
        const href = `/admin/animals/${animalId}/${tab.segment}`;
        const isActive = pathname === href;
        return (
          <Link
            key={tab.segment}
            href={href}
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
