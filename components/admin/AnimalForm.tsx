"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  animalFormWithMicrochipSchema,
  type AnimalFormWithMicrochipInput,
  type AnimalFormWithMicrochipValues,
} from "@/lib/validation";
import { AdminInput, AdminSelect, AdminTextarea, AdminLabel } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import type { Animal } from "@/lib/animals";
import type { AnimalInternalDetails } from "@/lib/animal-care";

const SPECIES = ["cat", "dog", "horse", "goat", "other"] as const;
const SEXES = ["male", "female", "unknown"] as const;

export function AnimalForm({
  animal,
  internalDetails,
}: {
  animal?: Animal;
  internalDetails?: AnimalInternalDetails | null;
}) {
  const t = useTranslations("admin.animals.form");
  const router = useRouter();
  const [serverError, setServerError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnimalFormWithMicrochipInput, unknown, AnimalFormWithMicrochipValues>({
    resolver: zodResolver(animalFormWithMicrochipSchema),
    defaultValues: animal
      ? {
          name: animal.name,
          species: animal.species,
          track: animal.track ?? "adoption",
          breed: animal.breed ?? "",
          sex: animal.sex,
          birthYear: animal.birthYear ?? undefined,
          birthMonth: animal.birthMonth ?? undefined,
          size: animal.size ?? "",
          arrivalDate: animal.arrivalDate ?? "",
          bioFr: animal.bioFr ?? "",
          bioEn: animal.bioEn ?? "",
          specialNeeds: animal.specialNeeds,
          isPublished: animal.isPublished,
          microchipNumber: internalDetails?.microchipNumber ?? "",
        }
      : {
          name: "",
          species: "cat",
          track: "adoption",
          sex: "unknown",
          specialNeeds: false,
          isPublished: true,
          microchipNumber: "",
        },
  });

  async function onSubmit(values: AnimalFormWithMicrochipValues) {
    setServerError(false);

    const { microchipNumber, ...animalValues } = values;

    const res = await fetch(
      animal ? `/api/admin/animals/${animal.id}` : "/api/admin/animals",
      {
        method: animal ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(animalValues),
      },
    );

    if (!res.ok) {
      setServerError(true);
      return;
    }

    const animalId = animal ? animal.id : (await res.json()).id;

    const detailsRes = await fetch(`/api/admin/animals/${animalId}/internal-details`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ microchipNumber }),
    });

    if (!detailsRes.ok) {
      setServerError(true);
      return;
    }

    if (!animal) {
      router.push(`/admin/animals/${animalId}/edit`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-5">
      <div className="grid grid-cols-2 gap-3.5">
        <div className="col-span-2 flex flex-col gap-[5px]">
          <AdminLabel>{t("name")}</AdminLabel>
          <AdminInput {...register("name")} />
          {errors.name ? <span className="text-xs text-danger">{errors.name.message}</span> : null}
        </div>

        <div className="col-span-2 flex flex-col gap-[5px]">
          <AdminLabel>{t("microchip")}</AdminLabel>
          <AdminInput className="font-mono" {...register("microchipNumber")} />
        </div>

        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("species")}</AdminLabel>
          <AdminSelect {...register("species")}>
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </AdminSelect>
        </div>

        <input type="hidden" {...register("track")} />

        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("sex")}</AdminLabel>
          <AdminSelect {...register("sex")}>
            {SEXES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </AdminSelect>
        </div>

        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("breed")}</AdminLabel>
          <AdminInput {...register("breed")} />
        </div>

        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("size")}</AdminLabel>
          <AdminInput {...register("size")} />
        </div>

        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("birthYear")}</AdminLabel>
          <AdminInput type="number" {...register("birthYear")} />
        </div>

        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("birthMonth")}</AdminLabel>
          <AdminInput type="number" min={1} max={12} {...register("birthMonth")} />
        </div>

        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("arrivalDate")}</AdminLabel>
          <AdminInput type="date" {...register("arrivalDate")} />
        </div>
      </div>

      <div className="flex flex-col gap-[5px]">
        <AdminLabel>{t("bioFr")}</AdminLabel>
        <AdminTextarea rows={4} {...register("bioFr")} />
      </div>
      <div className="flex flex-col gap-[5px]">
        <AdminLabel>{t("bioEn")}</AdminLabel>
        <AdminTextarea rows={4} {...register("bioEn")} />
      </div>

      <div className="flex gap-5">
        <label className="flex items-center gap-2 text-[12.5px] font-semibold">
          <input type="checkbox" {...register("specialNeeds")} />
          {t("specialNeeds")}
        </label>
        <label className="flex items-center gap-2 text-[12.5px] font-semibold">
          <input type="checkbox" {...register("isPublished")} />
          {t("isPublished")}
        </label>
      </div>

      {serverError ? (
        <p className="text-sm text-danger">Something went wrong saving this animal.</p>
      ) : null}

      <div>
        <AdminButton type="submit" variant="dark" disabled={isSubmitting}>
          {isSubmitting ? "…" : t("save")}
        </AdminButton>
      </div>
    </form>
  );
}
