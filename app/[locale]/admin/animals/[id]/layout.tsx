import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnimalById } from "@/lib/animals";
import { getAnimalInternalDetails, listAnimalIntakes } from "@/lib/animal-care";
import { AdminPage } from "@/components/admin/AdminPage";
import { AnimalDetailTabs } from "@/components/admin/AnimalDetailTabs";
import { DeleteAnimalDialog } from "@/components/admin/DeleteAnimalDialog";
import { AnimalThumb } from "@/components/admin/ui/AnimalThumb";
import { StatusPill } from "@/components/admin/ui/StatusPill";
import { AdminButtonLink } from "@/components/admin/ui/AdminButton";
import { computeAge } from "@/lib/format";

export default async function AnimalDetailLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const supabase = await createClient();
  const animal = await getAnimalById(supabase, id);
  if (!animal) notFound();

  const role = await getPageRole();
  if (role !== "admin") {
    // Volunteers only ever reach the (cut-down) edit route under this
    // segment — no internal-ops data to fetch, no tabs into admin-only pages.
    // They may only reach animals currently at the shelter: the list page
    // already filters to those, but this closes the direct-URL bypass for
    // anyone who navigates straight to an id that isn't (anymore).
    const details = await getAnimalInternalDetails(supabase, id);
    if (!details?.inShelter) notFound();

    return (
      <AdminPage title={animal.name} meta={animal.species}>
        {children}
      </AdminPage>
    );
  }

  const [details, intakes] = await Promise.all([
    getAnimalInternalDetails(supabase, id),
    listAnimalIntakes(supabase, id),
  ]);
  const t = await getTranslations("admin.animals");
  const latestIntake = intakes[0];
  const age = computeAge(animal.birthYear, animal.birthMonth);
  const meta = [
    animal.species,
    t(`sexes.${animal.sex}`),
    details?.inShelter && animal.arrivalDate
      ? t("detail.sinceDate", {
          date: new Date(animal.arrivalDate).toLocaleDateString(locale, { month: "long", year: "numeric" }),
        })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AdminPage title={animal.name} meta={meta}>
      <div className="flex flex-wrap items-center gap-[18px] rounded-admin border border-ink/10 bg-surface p-[18px_20px]">
        <AnimalThumb animal={animal} size={84} rounded={12} />
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl">{animal.name}</h2>
            <StatusPill tone={details?.inShelter ? "success" : "neutral"}>
              {details?.inShelter ? t("internalDetails.inShelterYes") : t("internalDetails.inShelterNo")}
            </StatusPill>
            <StatusPill tone={animal.isPublished ? "accent" : "neutral"}>
              {animal.isPublished ? t("publishedYes") : t("publishedNo")}
            </StatusPill>
          </div>
          <div className="flex flex-wrap gap-[18px]">
            <span className="flex flex-col gap-0.5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-ink/50">
                {t("columns.species")}
              </span>
              <span className="text-[13px] font-semibold">
                {animal.species} · {t(`sexes.${animal.sex}`)}
              </span>
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-ink/50">
                {t("detail.birthLabel")}
              </span>
              <span className="text-[13px] font-semibold">
                {animal.birthYear ? `${animal.birthYear}` : "—"}
                {age !== null ? ` · ${t("detail.ageYears", { age })}` : ""}
              </span>
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-ink/50">
                {t("columns.microchip")}
              </span>
              <span className="font-mono text-[12.5px]">{details?.microchipNumber ?? "—"}</span>
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-ink/50">
                {t("detail.arrivalLabel")}
              </span>
              <span className="text-[13px] font-semibold">
                {animal.arrivalDate
                  ? `${new Date(animal.arrivalDate).toLocaleDateString(locale)}${
                      latestIntake ? ` · ${t(`intakeOutcome.intakeReasons.${latestIntake.reason}`)}` : ""
                    }`
                  : t("detail.unknownArrival")}
              </span>
            </span>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <AdminButtonLink href={`/animals/${id}`} target="_blank">
            {t("detail.viewOnSite")}
          </AdminButtonLink>
          <AdminButtonLink href={`/admin/animals/${id}/edit`} variant="dark">
            {t("detail.editRecord")}
          </AdminButtonLink>
          <DeleteAnimalDialog animalId={id} animalName={animal.name} />
        </div>
      </div>

      <AnimalDetailTabs animalId={id} />

      {children}
    </AdminPage>
  );
}
