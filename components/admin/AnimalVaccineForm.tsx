"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  animalVaccineFormSchema,
  type AnimalVaccineFormInput,
  type AnimalVaccineFormValues,
} from "@/lib/validation";
import { AdminInput, AdminLabel } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";

export function AnimalVaccineForm({ animalId }: { animalId: string }) {
  const t = useTranslations("admin.animals.vaccines");
  const router = useRouter();
  const [serverError, setServerError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AnimalVaccineFormInput, unknown, AnimalVaccineFormValues>({
    resolver: zodResolver(animalVaccineFormSchema),
    defaultValues: { name: "", administeredOn: "", followUpDate: "", followUpCompleted: false },
  });

  async function onSubmit(values: AnimalVaccineFormValues) {
    setServerError(false);

    const res = await fetch(`/api/admin/animals/${animalId}/vaccines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      setServerError(true);
      return;
    }

    reset({ name: "", administeredOn: "", followUpDate: "", followUpCompleted: false });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-3 gap-3.5">
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("name")}</AdminLabel>
          <AdminInput {...register("name")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("administeredOn")}</AdminLabel>
          <AdminInput type="date" {...register("administeredOn")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("followUpDate")}</AdminLabel>
          <AdminInput type="date" {...register("followUpDate")} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-[12.5px] font-semibold">
        <input type="checkbox" {...register("followUpCompleted")} />
        {t("followUpCompleted")}
      </label>
      {serverError ? <p className="text-sm text-danger">Something went wrong.</p> : null}
      <div>
        <AdminButton type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "…" : t("add")}
        </AdminButton>
      </div>
    </form>
  );
}
