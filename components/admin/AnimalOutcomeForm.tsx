"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { animalOutcomeFormSchema, type AnimalOutcomeFormValues } from "@/lib/validation";
import { AdminInput, AdminSelect, AdminTextarea, AdminLabel } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";

const OUTCOME_REASONS = [
  "reunited_with_owner",
  "deceased",
  "euthanized",
  "released",
  "transferred_to_association",
  "adopted",
] as const;

export function AnimalOutcomeForm({ animalId }: { animalId: string }) {
  const t = useTranslations("admin.animals.intakeOutcome");
  const router = useRouter();
  const [serverError, setServerError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AnimalOutcomeFormValues>({
    resolver: zodResolver(animalOutcomeFormSchema),
    defaultValues: { occurredOn: "", reason: "adopted", description: "" },
  });

  async function onSubmit(values: AnimalOutcomeFormValues) {
    setServerError(false);

    const res = await fetch(`/api/admin/animals/${animalId}/outcomes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      setServerError(true);
      return;
    }

    reset({ occurredOn: "", reason: "adopted", description: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("occurredOn")}</AdminLabel>
          <AdminInput type="date" {...register("occurredOn")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("reason")}</AdminLabel>
          <AdminSelect {...register("reason")}>
            {OUTCOME_REASONS.map((r) => (
              <option key={r} value={r}>
                {t(`outcomeReasons.${r}`)}
              </option>
            ))}
          </AdminSelect>
        </div>
      </div>
      <div className="flex flex-col gap-[5px]">
        <AdminLabel>{t("description")}</AdminLabel>
        <AdminTextarea rows={2} {...register("description")} />
      </div>
      {serverError ? <p className="text-sm text-danger">Something went wrong.</p> : null}
      <div>
        <AdminButton type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "…" : t("addOutcome")}
        </AdminButton>
      </div>
    </form>
  );
}
