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
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-1.5">
        <Label>{t("email")}</Label>
        <Input type="email" {...register("email")} />
        {errors.email ? <span className="text-xs text-accent">{errors.email.message}</span> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("password")}</Label>
        <div className="flex gap-2">
          <Input {...register("password")} />
          <Button
            type="button"
            variant="outline"
            onClick={() => setValue("password", generatePassword(), { shouldValidate: true })}
          >
            {t("generatePassword")}
          </Button>
        </div>
        {errors.password ? (
          <span className="text-xs text-accent">{errors.password.message}</span>
        ) : null}
      </div>

      {serverError ? <p className="text-sm text-accent">{t("error")}</p> : null}
      {created ? (
        <p className="text-sm bg-accent/10 text-accent rounded-lg p-3">
          {t("created", { email: created.email, password: created.password })}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "…" : t("add")}
        </Button>
      </div>
    </form>
  );
}
