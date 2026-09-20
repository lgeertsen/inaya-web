"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  fosterPlacementFormSchema,
  type FosterPlacementFormInput,
  type FosterPlacementFormValues,
} from "@/lib/validation";
import { AdminInput, AdminSelect, AdminTextarea, AdminLabel } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import type { AnimalSpecies } from "@/lib/animals";

export interface FosterAnimalOption {
  id: string;
  name: string;
  species: AnimalSpecies;
}

export interface FosterFamilyOption {
  id: string;
  name: string;
  acceptedSpecies: AnimalSpecies[];
  freeSpots: number;
}

/**
 * Places an animal with a family. Used from the animal's "Famille d'accueil"
 * tab (`animalId` fixed, pick a family) and from a family's page (`familyId`
 * fixed, pick an animal).
 */
export function FosterPlacementForm({
  animalId,
  familyId,
  animals,
  families,
}: {
  animalId?: string;
  familyId?: string;
  animals: FosterAnimalOption[];
  families: FosterFamilyOption[];
}) {
  const t = useTranslations("admin.foster.placement");
  const router = useRouter();
  const [serverError, setServerError] = useState<"generic" | "alreadyPlaced" | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FosterPlacementFormInput, unknown, FosterPlacementFormValues>({
    resolver: zodResolver(fosterPlacementFormSchema),
    defaultValues: {
      animalId: animalId ?? "",
      familyId: familyId ?? "",
      startedOn: new Date().toISOString().slice(0, 10),
      checkinIntervalDays: 14,
      notes: "",
    },
  });

  const selectedAnimalId = useWatch({ control, name: "animalId" }) || animalId || "";
  const selectedSpecies = animals.find((a) => a.id === selectedAnimalId)?.species;

  function familyLabel(family: FosterFamilyOption): string {
    const parts = [
      family.name,
      family.freeSpots > 0 ? t("freeSpots", { count: family.freeSpots }) : t("full"),
    ];
    if (selectedSpecies && !family.acceptedSpecies.includes(selectedSpecies)) {
      parts.push(t("speciesNotAccepted"));
    }
    return parts.join(" · ");
  }

  async function onSubmit(values: FosterPlacementFormValues) {
    setServerError(null);

    const res = await fetch("/api/admin/foster-placements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      setServerError(res.status === 409 ? "alreadyPlaced" : "generic");
      return;
    }

    reset({
      animalId: animalId ?? "",
      familyId: familyId ?? "",
      startedOn: new Date().toISOString().slice(0, 10),
      checkinIntervalDays: 14,
      notes: "",
    });
    router.refresh();
  }

  const noChoice = animalId ? families.length === 0 : animals.length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {animalId ? (
          <input type="hidden" {...register("animalId")} />
        ) : (
          <div className="flex flex-col gap-[5px] sm:col-span-2">
            <AdminLabel>{t("animal")}</AdminLabel>
            <AdminSelect {...register("animalId")}>
              <option value="">{t("chooseAnimal")}</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.name} ({animal.species})
                </option>
              ))}
            </AdminSelect>
            {errors.animalId ? <span className="text-xs text-danger">{t("animalRequired")}</span> : null}
          </div>
        )}

        {familyId ? (
          <input type="hidden" {...register("familyId")} />
        ) : (
          <div className="flex flex-col gap-[5px] sm:col-span-2">
            <AdminLabel>{t("family")}</AdminLabel>
            <AdminSelect {...register("familyId")}>
              <option value="">{t("chooseFamily")}</option>
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {familyLabel(family)}
                </option>
              ))}
            </AdminSelect>
            {errors.familyId ? <span className="text-xs text-danger">{t("familyRequired")}</span> : null}
          </div>
        )}

        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("startedOn")}</AdminLabel>
          <AdminInput type="date" {...register("startedOn")} />
        </div>
        <div className="flex flex-col gap-[5px]">
          <AdminLabel>{t("checkinInterval")}</AdminLabel>
          <AdminInput type="number" min={1} max={365} {...register("checkinIntervalDays")} />
        </div>
        <div className="flex flex-col gap-[5px] sm:col-span-2">
          <AdminLabel>{t("notes")}</AdminLabel>
          <AdminTextarea rows={2} {...register("notes")} />
        </div>
      </div>

      {noChoice ? <p className="text-sm text-ink/60">{animalId ? t("noFamilies") : t("noAnimals")}</p> : null}
      {serverError ? (
        <p className="text-sm text-danger">
          {serverError === "alreadyPlaced" ? t("errorAlreadyPlaced") : t("error")}
        </p>
      ) : null}
      <div>
        <AdminButton type="submit" size="sm" variant="dark" disabled={isSubmitting || noChoice}>
          {isSubmitting ? "…" : t("submit")}
        </AdminButton>
      </div>
    </form>
  );
}
