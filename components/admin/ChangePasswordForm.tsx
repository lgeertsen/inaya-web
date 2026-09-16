"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/validation";
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-1.5">
        <Label>{t("newPassword")}</Label>
        <Input type="password" autoComplete="new-password" {...register("password")} />
        {errors.password ? (
          <span className="text-xs text-accent">{errors.password.message}</span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("confirmPassword")}</Label>
        <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
        {errors.confirmPassword ? (
          <span className="text-xs text-accent">{errors.confirmPassword.message}</span>
        ) : null}
      </div>

      {serverError ? <p className="text-sm text-accent">{t("error")}</p> : null}
      {success ? (
        <p className="text-sm bg-accent/10 text-accent rounded-lg p-3">{t("success")}</p>
      ) : null}

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "…" : t("save")}
        </Button>
      </div>
    </form>
  );
}
