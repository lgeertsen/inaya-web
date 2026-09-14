"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Select } from "@/components/ui/Field";
import type { VetAppointmentStatus } from "@/lib/animal-care";

const STATUSES: VetAppointmentStatus[] = ["pending", "completed", "canceled"];

export function VetAppointmentStatusSelect({
  endpoint,
  status,
}: {
  endpoint: string;
  status: VetAppointmentStatus;
}) {
  const t = useTranslations("admin.animals.vetAppointments.statuses");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: event.target.value }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <Select defaultValue={status} disabled={pending} onChange={handleChange} className="!py-2 !px-3">
      {STATUSES.map((value) => (
        <option key={value} value={value}>
          {t(value)}
        </option>
      ))}
    </Select>
  );
}
