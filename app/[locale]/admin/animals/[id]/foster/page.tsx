import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnimalById } from "@/lib/animals";
import { getAnimalInternalDetails } from "@/lib/animal-care";
import { listFosterFamilies, listPlacementsForAnimal, type FosterPlacement } from "@/lib/foster";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { FosterPlacementCard } from "@/components/admin/FosterPlacementCard";
import { FosterPlacementForm } from "@/components/admin/FosterPlacementForm";

export default async function AnimalFosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const { id } = await params;
  const supabase = await createClient();
  const animal = await getAnimalById(supabase, id);
  if (!animal) notFound();

  const t = await getTranslations("admin.foster");
  const tEnd = await getTranslations("admin.foster.endReasons");

  const [placements, families, details] = await Promise.all([
    listPlacementsForAnimal(supabase, id),
    listFosterFamilies(supabase),
    getAnimalInternalDetails(supabase, id),
  ]);

  const current = placements.find((placement) => placement.endedOn === null);
  const past = placements.filter((placement) => placement.endedOn !== null);

  // Only households currently taking animals are offered; the form flags full
  // families and species mismatches rather than hiding them.
  const familyOptions = families
    .filter((family) => family.status === "active")
    .map((family) => ({
      id: family.id,
      name: family.name,
      acceptedSpecies: family.acceptedSpecies,
      freeSpots: Math.max(0, family.capacity - family.currentCount),
    }));

  const formatDate = (date: string) => new Date(date).toLocaleDateString(locale);

  const historyColumns: AdminTableColumn<FosterPlacement>[] = [
    {
      header: t("history.family"),
      render: (row) => (
        <Link
          href={{ pathname: "/admin/foster/[familyId]", params: { familyId: row.familyId } }}
          className="font-bold hover:underline"
        >
          {row.familyName}
        </Link>
      ),
    },
    {
      header: t("history.period"),
      className: "font-mono text-[11.5px] text-ink/66",
      render: (row) => `${formatDate(row.startedOn)} → ${row.endedOn ? formatDate(row.endedOn) : "…"}`,
    },
    {
      header: t("history.reason"),
      className: "text-ink/66",
      render: (row) => (row.endReason ? tEnd(row.endReason) : "—"),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {current ? (
        <FosterPlacementCard placement={current} subject="family" />
      ) : (
        <div className="flex flex-col gap-3 rounded-admin border border-ink/10 bg-surface p-[16px_18px]">
          <h2 className="text-[14.5px]">{t("animalTab.notPlaced")}</h2>
          {details && !details.inShelter ? (
            <p className="text-sm text-ink/60">{t("animalTab.notInCare")}</p>
          ) : (
            <FosterPlacementForm
              animalId={id}
              animals={[{ id, name: animal.name, species: animal.species }]}
              families={familyOptions}
            />
          )}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px]">{t("detail.historyTitle")}</h2>
        <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
          <AdminTable columns={historyColumns} rows={past} emptyMessage={t("animalTab.noHistory")} minWidth={520} />
        </div>
      </section>
    </div>
  );
}
