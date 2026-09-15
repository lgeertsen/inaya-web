import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listInShelterStatuses } from "@/lib/animal-care";
import { countUpcomingVetVisits } from "@/lib/vet-visits";
import { StatCard } from "@/components/admin/StatCard";
import { ButtonLink } from "@/components/ui/Button";
import { PawPrint, CheckCircle2, Home, HeartHandshake, CalendarClock } from "lucide-react";

export default async function AdminOverviewPage() {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.overview");
  const supabase = await createClient();

  const [{ data: animalRows }, inShelterStatuses, { data: completedDonations }, upcomingVisits] =
    await Promise.all([
      supabase.from("animals").select("species, is_published"),
      listInShelterStatuses(supabase),
      supabase.from("donations").select("amount_cents").eq("status", "completed"),
      countUpcomingVetVisits(supabase, new Date().toISOString()),
    ]);

  const totalAnimals = animalRows?.length ?? 0;
  const publishedAnimals = (animalRows ?? []).filter((row) => row.is_published).length;
  const speciesCounts = (animalRows ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.species] = (acc[row.species] ?? 0) + 1;
    return acc;
  }, {});
  const inShelterCount = Object.values(inShelterStatuses).filter(Boolean).length;
  const donationsTotalCents = (completedDonations ?? []).reduce(
    (sum, row) => sum + row.amount_cents,
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl">{t("title")}</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label={t("totalAnimals")}
          value={totalAnimals ?? 0}
          icon={PawPrint}
          href="/admin/animals"
        />
        <StatCard
          label={t("published")}
          value={publishedAnimals ?? 0}
          icon={CheckCircle2}
          href="/admin/animals"
        />
        <StatCard label={t("inShelter")} value={inShelterCount} icon={Home} href="/admin/animals" />
        <StatCard
          label={t("donationsTotal")}
          value={`${(donationsTotalCents / 100).toFixed(2)} €`}
          icon={HeartHandshake}
          href="/admin/donations"
        />
        <StatCard
          label={t("upcomingVisits")}
          value={upcomingVisits}
          icon={CalendarClock}
          href="/admin/calendar"
        />
      </div>

      {Object.keys(speciesCounts).length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{t("bySpecies.title")}</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(speciesCounts)
              .sort(([a], [b]) => (a < b ? -1 : 1))
              .map(([species, count]) => (
                <div
                  key={species}
                  className="flex items-center gap-2 rounded-pill bg-surface px-4 py-2 text-sm shadow-card"
                >
                  <span className="font-bold capitalize">{species}</span>
                  <span className="text-ink/50">{count}</span>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("quickLinks.title")}</h2>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/admin/animals/new" variant="outline">
            {t("quickLinks.addAnimal")}
          </ButtonLink>
          <ButtonLink href="/admin/calendar/new" variant="outline">
            {t("quickLinks.newVisit")}
          </ButtonLink>
          <ButtonLink href="/admin/donations" variant="outline">
            {t("quickLinks.viewDonations")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
