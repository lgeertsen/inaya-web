"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  fosterCheckinFormSchema,
  type FosterCheckinFormInput,
  type FosterCheckinFormValues,
} from "@/lib/validation";
import { AdminInput, AdminSelect, AdminLabel } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";

const CHECKIN_TYPES = ["call", "visit", "message"] as const;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FosterCheckinForm({ placementId }: { placementId: string }) {
  const t = useTranslations("admin.foster.checkins");
  const tTypes = useTranslations("admin.foster.checkinTypes");
  const router = useRouter();
  const [serverError, setServerError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FosterCheckinFormInput, unknown, FosterCheckinFormValues>({
    resolver: zodResolver(fosterCheckinFormSchema),
    defaultValues: { occurredOn: today(), type: "call", notes: "" },
  });

  async function onSubmit(values: FosterCheckinFormValues) {
    setServerError(false);

    const res = await fetch(`/api/admin/foster-placements/${placementId}/checkins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      setServerError(true);
      return;
    }

    reset({ occurredOn: today(), type: "call", notes: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_150px_1fr]">
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("occurredOn")}</AdminLabel>
          <AdminInput type="date" {...register("occurredOn")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("type")}</AdminLabel>
          <AdminSelect {...register("type")}>
            {CHECKIN_TYPES.map((type) => (
              <option key={type} value={type}>
                {tTypes(type)}
              </option>
            ))}
          </AdminSelect>
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("notes")}</AdminLabel>
          <AdminInput {...register("notes")} />
        </div>
      </div>
      {serverError ? <p className="text-sm text-danger">{t("error")}</p> : null}
      <div>
        <AdminButton type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "…" : t("add")}
        </AdminButton>
      </div>
    </form>
  );
}
