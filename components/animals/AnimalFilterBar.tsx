"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Field";

const SPECIES = ["cat", "dog", "horse", "goat", "other"] as const;

export function AnimalFilterBar() {
  const t = useTranslations("animals.filters");
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // The filter bar only renders on the static /animals route, so no dynamic params apply.
    router.replace({ pathname: "/animals", query: Object.fromEntries(params.entries()) });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        aria-label={t("species")}
        value={searchParams.get("species") ?? ""}
        onChange={(e) => setParam("species", e.target.value)}
        className="w-auto"
      >
        <option value="">{t("allSpecies")}</option>
        {SPECIES.map((species) => (
          <option key={species} value={species}>
            {t(species)}
          </option>
        ))}
      </Select>
    </div>
  );
}
