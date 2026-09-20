import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listVolunteerAccounts } from "@/lib/accounts";
import { getAnimals } from "@/lib/animals";
import { listInShelterStatuses } from "@/lib/animal-care";
import {
  getFosterFamily,
  listPlacedAnimalIds,
  listPlacementsForFamily,
  type FosterPlacement,
} from "@/lib/foster";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { FosterFamilyForm } from "@/components/admin/FosterFamilyForm";
import { FosterPlacementCard } from "@/components/admin/FosterPlacementCard";
import { FosterPlacementForm } from "@/components/admin/FosterPlacementForm";
import { StatusPill } from "@/components/admin/ui/StatusPill";

const STATUS_TONE = { active: "success", paused: "warning", inactive: "neutral" } as const;

export default async function FosterFamilyPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const { familyId } = await params;
  const supabase = await createClient();
  const family = await getFosterFamily(supabase, familyId);
  if (!family) notFound();

  const t = await getTranslations("admin.foster");
  const tEnd = await getTranslations("admin.foster.endReasons");

  const [placements, animals, inShelter, placedIds, accounts, { data: linked }] = await Promise.all([
    listPlacementsForFamily(supabase, familyId),
    getAnimals(supabase, { publishedOnly: false }),
    listInShelterStatuses(supabase),
    listPlacedAnimalIds(supabase),
    listVolunteerAccounts(createAdminClient()),
    supabase.from("foster_families").select("user_id").not("user_id", "is", null),
  ]);

  const current = placements.filter((placement) => placement.endedOn === null);
  const past = placements.filter((placement) => placement.endedOn !== null);
  const isFull = current.length >= family.capacity;

  // Animals still in our care that aren't already with a family.
  const placeableAnimals = animals
    .filter((animal) => inShelter[animal.id] && !placedIds.has(animal.id))
    .map((animal) => ({ id: animal.id, name: animal.name, species: animal.species }));

  // Volunteer accounts that can be linked: not used by another family (this family's own account stays selectable).
  const linkedIds = new Set(
    (linked ?? []).map((row) => row.user_id as string).filter((id) => id !== family.userId),
  );
  const accountOptions = accounts
    .filter((account) => !linkedIds.has(account.id))
    .map((account) => ({ id: account.id, email: account.email }));

  const formatDate = (date: string) => new Date(date).toLocaleDateString(locale);

  const historyColumns: AdminTableColumn<FosterPlacement>[] = [
    {
      header: t("history.animal"),
      render: (row) => (
        <Link
          href={{ pathname: "/admin/animals/[id]/foster", params: { id: row.animalId } }}
          className="font-bold hover:underline"
        >
          {row.animalName}
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

  const meta = [family.city, t("capacityMeta", { used: current.length, capacity: family.capacity })]
    .filter(Boolean)
    .join(" · ");

  return (
    <AdminPage title={family.name} meta={meta}>
      <div className="flex flex-wrap items-center gap-2.5">
        <StatusPill tone={STATUS_TONE[family.status]}>{t(`statuses.${family.status}`)}</StatusPill>
        {family.userId ? <StatusPill tone="accent">{t("detail.hasAccount")}</StatusPill> : null}
        <Link href="/admin/foster" className="ml-auto text-xs font-bold">
          {t("detail.backToList")}
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px]">{t("detail.currentTitle")}</h2>
        {current.length === 0 ? (
          <p className="text-sm text-ink/60">{t("detail.noCurrent")}</p>
        ) : (
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
            {current.map((placement) => (
              <FosterPlacementCard key={placement.id} placement={placement} subject="animal" />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-admin border border-ink/10 bg-surface p-[16px_18px]">
        <h2 className="text-[14.5px]">{t("placement.title")}</h2>
        {family.status !== "active" ? (
          <p className="text-sm text-warning">{t("placement.notActive")}</p>
        ) : isFull ? (
          <p className="text-sm text-warning">{t("placement.familyFull")}</p>
        ) : null}
        <FosterPlacementForm familyId={family.id} animals={placeableAnimals} families={[]} />
      </section>

      <section className="flex flex-col gap-3 rounded-admin border border-ink/10 bg-surface p-[16px_18px]">
        <h2 className="text-[14.5px]">{t("detail.editTitle")}</h2>
        <FosterFamilyForm family={family} accountOptions={accountOptions} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px]">{t("detail.historyTitle")}</h2>
        <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
          <AdminTable columns={historyColumns} rows={past} emptyMessage={t("detail.noHistory")} minWidth={520} />
        </div>
      </section>
    </AdminPage>
  );
}
