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
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{t("microchip")}</Label>
          <Input {...register("microchipNumber")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("coat")}</Label>
          <Input {...register("coat")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("birthDate")}</Label>
          <Input type="date" {...register("birthDate")} />
        </div>
      </div>

      {serverError ? (
        <p className="text-sm text-accent">Something went wrong saving this animal.</p>
      ) : null}

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "…" : t("save")}
        </Button>
      </div>
    </form>
  );
}
