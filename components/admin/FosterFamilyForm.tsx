"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  fosterFamilyFormSchema,
  type FosterFamilyFormInput,
  type FosterFamilyFormValues,
} from "@/lib/validation";
import { AdminInput, AdminSelect, AdminTextarea, AdminLabel } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import type { FosterFamily } from "@/lib/foster";

const SPECIES = ["cat", "dog", "horse", "goat", "other"] as const;
const STATUSES = ["active", "paused", "inactive"] as const;

export interface FosterAccountOption {
  id: string;
  email: string;
}

export function FosterFamilyForm({
  family,
  accountOptions,
}: {
  family?: FosterFamily;
  /** Volunteer accounts that can be linked: those not already linked to another family. */
  accountOptions: FosterAccountOption[];
}) {
  const t = useTranslations("admin.foster.form");
  const tSpecies = useTranslations("admin.foster.speciesPlural");
  const tStatuses = useTranslations("admin.foster.statuses");
  const router = useRouter();
  const [serverError, setServerError] = useState<"generic" | "accountLinked" | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FosterFamilyFormInput, unknown, FosterFamilyFormValues>({
    resolver: zodResolver(fosterFamilyFormSchema),
    defaultValues: family
      ? {
          name: family.name,
          contactName: family.contactName ?? "",
          phone: family.phone ?? "",
          email: family.email ?? "",
          city: family.city ?? "",
          capacity: family.capacity,
          acceptedSpecies: family.acceptedSpecies,
          status: family.status,
          notes: family.notes ?? "",
          userId: family.userId ?? "",
        }
      : {
          name: "",
          contactName: "",
          phone: "",
          email: "",
          city: "",
          capacity: 1,
          acceptedSpecies: ["cat"],
          status: "active",
          notes: "",
          userId: "",
        },
  });

  async function onSubmit(values: FosterFamilyFormValues) {
    setServerError(null);
    setSaved(false);

    const res = await fetch(family ? `/api/admin/foster/${family.id}` : "/api/admin/foster", {
      method: family ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      setServerError(res.status === 409 ? "accountLinked" : "generic");
      return;
    }

    if (family) {
      setSaved(true);
      router.refresh();
    } else {
      const created = await res.json();
      router.push({ pathname: "/admin/foster/[familyId]", params: { familyId: created.id } });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-[5px] sm:col-span-2">
          <AdminLabel>{t("name")}</AdminLabel>
          <AdminInput {...register("name")} />
          {errors.name ? <span className="text-xs text-danger">{errors.name.message}</span> : null}
        </div>

        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("contactName")}</AdminLabel>
          <AdminInput {...register("contactName")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("city")}</AdminLabel>
          <AdminInput {...register("city")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("phone")}</AdminLabel>
          <AdminInput type="tel" {...register("phone")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("email")}</AdminLabel>
          <AdminInput type="email" {...register("email")} />
          {errors.email ? <span className="text-xs text-danger">{t("emailInvalid")}</span> : null}
        </div>

        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("capacity")}</AdminLabel>
          <AdminInput type="number" min={0} max={50} {...register("capacity")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("status")}</AdminLabel>
          <AdminSelect {...register("status")}>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {tStatuses(value)}
              </option>
            ))}
          </AdminSelect>
        </div>

        <div className="flex flex-col gap-[5px] sm:col-span-2">
          <AdminLabel>{t("acceptedSpecies")}</AdminLabel>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {SPECIES.map((species) => (
              <label key={species} className="flex items-center gap-2 text-[12.5px] font-semibold">
                <input type="checkbox" value={species} {...register("acceptedSpecies")} />
                {tSpecies(species)}
              </label>
            ))}
          </div>
          {errors.acceptedSpecies ? (
            <span className="text-xs text-danger">{t("acceptedSpeciesRequired")}</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-[5px] sm:col-span-2">
          <AdminLabel>{t("account")}</AdminLabel>
          <AdminSelect {...register("userId")}>
            <option value="">{t("accountNone")}</option>
            {accountOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.email}
              </option>
            ))}
          </AdminSelect>
          <span className="text-xs text-ink/55">{t("accountHint")}</span>
        </div>

        <div className="flex flex-col gap-[5px] sm:col-span-2">
          <AdminLabel>{t("notes")}</AdminLabel>
          <AdminTextarea rows={3} {...register("notes")} />
        </div>
      </div>

      {serverError ? (
        <p className="text-sm text-danger">
          {serverError === "accountLinked" ? t("errorAccountLinked") : t("error")}
        </p>
      ) : null}
      {saved ? <p className="text-sm text-success">{t("saved")}</p> : null}

      <div>
        <AdminButton type="submit" variant="dark" disabled={isSubmitting}>
          {isSubmitting ? "…" : family ? t("save") : t("create")}
        </AdminButton>
      </div>
    </form>
  );
}
