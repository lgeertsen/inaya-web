"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { vetVisitFormSchema, type VetVisitFormValues } from "@/lib/validation";
import { AdminInput, AdminSelect, AdminLabel } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AnimalMultiSelect } from "@/components/admin/AnimalMultiSelect";
import type { AnimalOption } from "@/lib/animals";
import type { VetVisitWithAnimals } from "@/lib/vet-visits";

const STATUSES = ["pending", "completed", "canceled"] as const;

function toLocalInput(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function VetVisitForm({
  visit,
  animalOptions,
  initialScheduledAt,
}: {
  visit?: VetVisitWithAnimals;
  animalOptions: AnimalOption[];
  initialScheduledAt?: string;
}) {
  const t = useTranslations("admin.calendar");
  const router = useRouter();
  const [serverError, setServerError] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<VetVisitFormValues>({
    resolver: zodResolver(vetVisitFormSchema),
    defaultValues: visit
      ? {
          scheduledAt: toLocalInput(visit.scheduledAt),
          reason: visit.reason,
          status: visit.status,
          animalIds: visit.animals.map((a) => a.animalId),
        }
      : {
          scheduledAt: initialScheduledAt ?? "",
          reason: "",
          status: "pending",
          animalIds: [],
        },
  });

  async function onSubmit(values: VetVisitFormValues) {
    setServerError(false);

    const res = await fetch(visit ? `/api/admin/vet-visits/${visit.id}` : "/api/admin/vet-visits", {
      method: visit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      setServerError(true);
      return;
    }

    if (!visit) {
      const saved = await res.json();
      router.push(`/admin/calendar/${saved.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("scheduledAt")}</AdminLabel>
          <AdminInput type="datetime-local" {...register("scheduledAt")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("status")}</AdminLabel>
          <AdminSelect {...register("status")}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`statuses.${status}`)}
              </option>
            ))}
          </AdminSelect>
        </div>
        <div className="col-span-2 flex flex-col gap-[5px]">
          <AdminLabel>{t("reason")}</AdminLabel>
          <AdminInput {...register("reason")} />
        </div>
      </div>

      {!visit ? (
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("animals")}</AdminLabel>
          <Controller
            name="animalIds"
            control={control}
            render={({ field }) => (
              <AnimalMultiSelect
                options={animalOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={t("searchAnimals")}
              />
            )}
          />
        </div>
      ) : null}

      {serverError ? <p className="text-sm text-danger">Something went wrong.</p> : null}

      <div>
        <AdminButton type="submit" variant="dark" disabled={isSubmitting}>
          {isSubmitting ? "…" : visit ? t("save") : t("addVisit")}
        </AdminButton>
      </div>
    </form>
  );
}
