"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  createVolunteerAccountSchema,
  type CreateVolunteerAccountValues,
} from "@/lib/validation";
import { AdminInput, AdminLabel } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";

function generatePassword() {
  return crypto
    .getRandomValues(new Uint32Array(3))
    .reduce((acc, n) => acc + n.toString(36), "")
    .slice(0, 12);
}

export function CreateVolunteerAccountForm() {
  const t = useTranslations("admin.accounts");
  const router = useRouter();
  const [serverError, setServerError] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateVolunteerAccountValues>({
    resolver: zodResolver(createVolunteerAccountSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: CreateVolunteerAccountValues) {
    setServerError(false);
    setCreated(null);

    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      setServerError(true);
      return;
    }

    setCreated(values);
    reset({ email: "", password: "" });
    router.refresh();
  }

  return (
    <div className="flex min-w-0 flex-col gap-3.5 rounded-admin border border-ink/10 bg-surface p-[18px]">
      <div className="flex flex-col gap-[5px]">
        <h2 className="text-[14.5px]">{t("add")}</h2>
        <p className="text-[12.5px] leading-[1.45] text-ink/60">{t("addDescription")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("email")}</AdminLabel>
          <AdminInput type="email" placeholder="prenom@inaya.farm" {...register("email")} />
          {errors.email ? <span className="text-xs text-danger">{errors.email.message}</span> : null}
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("password")}</AdminLabel>
          <div className="flex gap-[7px]">
            <AdminInput className="min-w-0 flex-1 font-mono" {...register("password")} />
            <AdminButton
              type="button"
              onClick={() => setValue("password", generatePassword(), { shouldValidate: true })}
              className="whitespace-nowrap"
            >
              {t("generatePassword")}
            </AdminButton>
          </div>
          {errors.password ? (
            <span className="text-xs text-danger">{errors.password.message}</span>
          ) : null}
        </div>

        {serverError ? <p className="text-sm text-danger">{t("error")}</p> : null}
        {created ? (
          <p className="rounded-lg bg-success-bg p-3 text-sm text-success">
            {t("created", { email: created.email, password: created.password })}
          </p>
        ) : null}

        <AdminButton type="submit" variant="dark" disabled={isSubmitting}>
          {isSubmitting ? "…" : t("add")}
        </AdminButton>
      </form>
    </div>
  );
}
