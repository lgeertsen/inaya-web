"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  animalInternalDetailsFormSchema,
  type AnimalInternalDetailsFormValues,
} from "@/lib/validation";
import { AdminInput, AdminLabel } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import type { AnimalInternalDetails } from "@/lib/animal-care";

export function AnimalInternalDetailsForm({
  animalId,
  details,
}: {
  animalId: string;
  details: AnimalInternalDetails | null;
}) {
  const t = useTranslations("admin.animals.internalDetails");
  const router = useRouter();
  const [serverError, setServerError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AnimalInternalDetailsFormValues>({
    resolver: zodResolver(animalInternalDetailsFormSchema),
    defaultValues: {
      microchipNumber: details?.microchipNumber ?? "",
      coat: details?.coat ?? "",
      birthDate: details?.birthDate ?? "",
    },
  });

  async function onSubmit(values: AnimalInternalDetailsFormValues) {
    setServerError(false);

    const res = await fetch(`/api/admin/animals/${animalId}/internal-details`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      setServerError(true);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[11px]">
      <div className="flex flex-col gap-[5px]">
        <AdminLabel>{t("microchip")}</AdminLabel>
        <AdminInput className="font-mono" {...register("microchipNumber")} />
      </div>
      <div className="flex flex-col gap-[5px]">
        <AdminLabel>{t("coat")}</AdminLabel>
        <AdminInput {...register("coat")} />
      </div>
      <div className="flex flex-col gap-[5px]">
        <AdminLabel>{t("birthDate")}</AdminLabel>
        <AdminInput type="date" className="font-mono" {...register("birthDate")} />
      </div>

      {serverError ? (
        <p className="text-sm text-danger">Something went wrong saving this animal.</p>
      ) : null}

      <AdminButton type="submit" variant="dark">
        {isSubmitting ? "…" : t("save")}
      </AdminButton>
    </form>
  );
}
