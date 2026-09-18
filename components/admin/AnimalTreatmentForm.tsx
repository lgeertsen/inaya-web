"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  animalTreatmentFormSchema,
  type AnimalTreatmentFormInput,
  type AnimalTreatmentFormValues,
} from "@/lib/validation";
import { AdminInput, AdminSelect, AdminLabel } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";

const MEASUREMENT_UNITS = ["pill", "spoon", "ml", "cl"] as const;

export function AnimalTreatmentForm({ animalId }: { animalId: string }) {
  const t = useTranslations("admin.animals.treatments");
  const router = useRouter();
  const [serverError, setServerError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AnimalTreatmentFormInput, unknown, AnimalTreatmentFormValues>({
    resolver: zodResolver(animalTreatmentFormSchema),
    defaultValues: {
      name: "",
      medicine: "",
      startDate: "",
      endDate: "",
      step: 1,
      amount: 1,
      measurement: "pill",
      dayStep: undefined,
      dayTimes: undefined,
    },
  });

  async function onSubmit(values: AnimalTreatmentFormValues) {
    setServerError(false);

    const res = await fetch(`/api/admin/animals/${animalId}/treatments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      setServerError(true);
      return;
    }

    reset({
      name: "",
      medicine: "",
      startDate: "",
      endDate: "",
      step: 1,
      amount: 1,
      measurement: "pill",
      dayStep: undefined,
      dayTimes: undefined,
    });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("name")}</AdminLabel>
          <AdminInput {...register("name")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("medicine")}</AdminLabel>
          <AdminInput {...register("medicine")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("startDate")}</AdminLabel>
          <AdminInput type="date" {...register("startDate")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("endDate")}</AdminLabel>
          <AdminInput type="date" {...register("endDate")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("step")}</AdminLabel>
          <AdminInput type="number" min={1} {...register("step")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("amount")}</AdminLabel>
          <AdminInput type="number" step="0.1" min={0} {...register("amount")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("measurement")}</AdminLabel>
          <AdminSelect {...register("measurement")}>
            {MEASUREMENT_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {t(`measurementUnits.${unit}`)}
              </option>
            ))}
          </AdminSelect>
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("dayStep")}</AdminLabel>
          <AdminInput type="number" min={1} {...register("dayStep")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("dayTimes")}</AdminLabel>
          <AdminInput type="number" min={1} {...register("dayTimes")} />
        </div>
      </div>
      {serverError ? <p className="text-sm text-danger">Something went wrong.</p> : null}
      <div>
        <AdminButton type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "…" : t("add")}
        </AdminButton>
      </div>
    </form>
  );
}
