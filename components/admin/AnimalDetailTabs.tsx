"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const TABS = [
  { segment: "edit", key: "profile" },
  { segment: "care", key: "internalDetails" },
  { segment: "intake-outcome", key: "intakeOutcome" },
  { segment: "vaccines", key: "vaccines" },
  { segment: "treatments", key: "treatments" },
  { segment: "vet-appointments", key: "vetAppointments" },
] as const;

export function AnimalDetailTabs({ animalId }: { animalId: string }) {
  const pathname = usePathname();
  const t = useTranslations("admin.animals.tabs");

  return (
    <nav className="flex gap-6 border-b border-ink/10 overflow-x-auto">
      {TABS.map((tab) => {
        const href = `/admin/animals/${animalId}/${tab.segment}`;
        const isActive = pathname === href;
        return (
          <Link
            key={tab.segment}
            href={href}
            className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 -mb-px ${
              isActive ? "border-accent text-accent" : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
