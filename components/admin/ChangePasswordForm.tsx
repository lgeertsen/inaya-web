"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/validation";
import { AdminInput, AdminLabel } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";

export function ChangePasswordForm() {
  const t = useTranslations("admin.profile");
  const [serverError, setServerError] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangePasswordValues) {
    setServerError(false);
    setSuccess(false);

    const res = await fetch("/api/admin/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: values.password }),
    });

    if (!res.ok) {
      setServerError(true);
      return;
    }

    setSuccess(true);
    reset({ password: "", confirmPassword: "" });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[11px]">
      <div className="flex flex-col gap-[5px]">
        <AdminLabel>{t("newPassword")}</AdminLabel>
        <AdminInput type="password" autoComplete="new-password" {...register("password")} />
        {errors.password ? <span className="text-xs text-danger">{errors.password.message}</span> : null}
      </div>
      <div className="flex flex-col gap-[5px]">
        <AdminLabel>{t("confirmPassword")}</AdminLabel>
        <AdminInput type="password" autoComplete="new-password" {...register("confirmPassword")} />
        {errors.confirmPassword ? (
          <span className="text-xs text-danger">{errors.confirmPassword.message}</span>
        ) : null}
      </div>

      {serverError ? <p className="text-sm text-danger">{t("error")}</p> : null}
      {success ? (
        <p className="rounded-lg bg-success-bg p-3 text-sm text-success">{t("success")}</p>
      ) : null}

      <div>
        <AdminButton type="submit" variant="dark" disabled={isSubmitting}>
          {isSubmitting ? "…" : t("save")}
        </AdminButton>
      </div>
    </form>
  );
}
