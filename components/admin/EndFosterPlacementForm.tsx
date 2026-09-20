"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { fosterPlacementEndSchema, type FosterPlacementEndValues } from "@/lib/validation";
import { AdminInput, AdminSelect, AdminLabel } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";

const END_REASONS = ["returned_to_shelter", "adopted", "deceased", "other"] as const;

export function EndFosterPlacementForm({ placementId }: { placementId: string }) {
  const t = useTranslations("admin.foster.end");
  const tReasons = useTranslations("admin.foster.endReasons");
  const router = useRouter();
  const [serverError, setServerError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FosterPlacementEndValues>({
    resolver: zodResolver(fosterPlacementEndSchema),
    defaultValues: { endedOn: new Date().toISOString().slice(0, 10), endReason: "returned_to_shelter" },
  });

  async function onSubmit(values: FosterPlacementEndValues) {
    setServerError(false);

    const res = await fetch(`/api/admin/foster-placements/${placementId}`, {
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("endedOn")}</AdminLabel>
          <AdminInput type="date" {...register("endedOn")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("reason")}</AdminLabel>
          <AdminSelect {...register("endReason")}>
            {END_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {tReasons(reason)}
              </option>
            ))}
          </AdminSelect>
        </div>
      </div>
      <p className="text-xs text-ink/55">{t("hint")}</p>
      {serverError ? <p className="text-sm text-danger">{t("error")}</p> : null}
      <div>
        <AdminButton type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "…" : t("submit")}
        </AdminButton>
      </div>
    </form>
  );
}
