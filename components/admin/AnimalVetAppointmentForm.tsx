"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  animalVetAppointmentFormSchema,
  type AnimalVetAppointmentFormValues,
} from "@/lib/validation";
import { Input, Select, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const STATUSES = ["pending", "completed", "canceled"] as const;

export function AnimalVetAppointmentForm({ animalId }: { animalId: string }) {
  const t = useTranslations("admin.animals.vetAppointments");
  const router = useRouter();
  const [serverError, setServerError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AnimalVetAppointmentFormValues>({
    resolver: zodResolver(animalVetAppointmentFormSchema),
    defaultValues: {
      scheduledAt: "",
      reason: "",
      status: "pending",
      followUpDate: "",
      followUpCompleted: false,
    },
  });

  async function onSubmit(values: AnimalVetAppointmentFormValues) {
    setServerError(false);

    const res = await fetch(`/api/admin/animals/${animalId}/vet-appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      setServerError(true);
      return;
    }

    reset({
      scheduledAt: "",
      reason: "",
      status: "pending",
      followUpDate: "",
      followUpCompleted: false,
    });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{t("scheduledAt")}</Label>
          <Input type="datetime-local" {...register("scheduledAt")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("status")}</Label>
          <Select {...register("status")}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`statuses.${status}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 col-span-2">
          <Label>{t("reason")}</Label>
          <Input {...register("reason")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("followUpDate")}</Label>
          <Input type="date" {...register("followUpDate")} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("followUpCompleted")} />
        {t("followUpCompleted")}
      </label>
      {serverError ? <p className="text-sm text-accent">Something went wrong.</p> : null}
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "…" : t("add")}
        </Button>
      </div>
    </form>
  );
}
