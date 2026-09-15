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
import { Input, Select, Textarea, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Animal } from "@/lib/animals";
import type { AnimalInternalDetails } from "@/lib/animal-care";
import { PhotoUploader } from "./PhotoUploader";

const SPECIES = ["cat", "dog", "horse", "goat", "other"] as const;
const STATUSES = ["available", "pending", "adopted"] as const;
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
          status: animal.status,
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
          status: "available",
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 col-span-2">
          <Label>{t("name")}</Label>
          <Input {...register("name")} />
          {errors.name ? <span className="text-xs text-accent">{errors.name.message}</span> : null}
        </div>

        <div className="flex flex-col gap-1.5 col-span-2">
          <Label>{t("microchip")}</Label>
          <Input {...register("microchipNumber")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("species")}</Label>
          <Select {...register("species")}>
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <input type="hidden" {...register("track")} />

        <div className="flex flex-col gap-1.5">
          <Label>{t("status")}</Label>
          <Select {...register("status")}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("sex")}</Label>
          <Select {...register("sex")}>
            {SEXES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("breed")}</Label>
          <Input {...register("breed")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("size")}</Label>
          <Input {...register("size")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("birthYear")}</Label>
          <Input type="number" {...register("birthYear")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("birthMonth")}</Label>
          <Input type="number" min={1} max={12} {...register("birthMonth")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("arrivalDate")}</Label>
          <Input type="date" {...register("arrivalDate")} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("bioFr")}</Label>
        <Textarea rows={4} {...register("bioFr")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("bioEn")}</Label>
        <Textarea rows={4} {...register("bioEn")} />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("specialNeeds")} />
          {t("specialNeeds")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("isPublished")} />
          {t("isPublished")}
        </label>
      </div>

      {serverError ? (
        <p className="text-sm text-accent">Something went wrong saving this animal.</p>
      ) : null}

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "…" : t("save")}
        </Button>
      </div>

      {animal ? (
        <div className="pt-6 border-t border-ink/10 flex flex-col gap-3">
          <Label>{t("photos")}</Label>
          <PhotoUploader
            animalId={animal.id}
            photos={animal.photos}
            uploadLabel={t("uploadPhoto")}
            removeLabel={t("removePhoto")}
            setCoverLabel={t("setCover")}
            coverBadgeLabel={t("coverBadge")}
            canManage
          />
        </div>
      ) : null}
    </form>
  );
}
