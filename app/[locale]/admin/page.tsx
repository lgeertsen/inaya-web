import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listInShelterStatuses } from "@/lib/animal-care";
import { countUpcomingVetVisits, listUpcomingVetVisits } from "@/lib/vet-visits";
import { getAnimals, listRecentVolunteerPhotoUploads } from "@/lib/animals";
import { getDonationKpis, getMonthlyDonationTotals, type DonationRow } from "@/lib/donations";
import { getAttentionSignals } from "@/lib/admin-attention";
import { AdminPage } from "@/components/admin/AdminPage";
import { AnimalThumb } from "@/components/admin/ui/AnimalThumb";
import { StatusPill } from "@/components/admin/ui/StatusPill";
import { formatCents, formatRelativeDate } from "@/lib/format";
import { ChevronRight } from "lucide-react";

export default async function AdminOverviewPage() {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.overview");
  const tDonations = await getTranslations("admin.donations");
  const supabase = await createClient();

  const now = new Date();
  const startOfYear = `${now.getFullYear()}-01-01`;

  const [
    animals,
    inShelterStatuses,
    { data: donationRows },
    upcomingVisitsCount,
    upcomingVisits,
    attention,
    { count: outcomesThisYear },
    recentVolunteerPhotos,
  ] = await Promise.all([
    getAnimals(supabase, { publishedOnly: false }),
    listInShelterStatuses(supabase),
    supabase
      .from("donations")
      .select("id, created_at, donor_name, donor_email, amount_cents, frequency, status, stripe_subscription_id")
      .returns<DonationRow[]>(),
    countUpcomingVetVisits(supabase, now.toISOString()),
    listUpcomingVetVisits(supabase, now.toISOString(), 4),
    getAttentionSignals(supabase),
    supabase.from("animal_outcomes").select("id", { count: "exact", head: true }).gte("occurred_on", startOfYear),
    listRecentVolunteerPhotoUploads(supabase, 6),
  ]);

  const donations = donationRows ?? [];
  const donationKpis = getDonationKpis(donations);
  const monthlyTotals = getMonthlyDonationTotals(donations, 12);
  const maxMonthlyCents = Math.max(1, ...monthlyTotals.map((m) => m.totalCents));

  const inShelterCount = Object.values(inShelterStatuses).filter(Boolean).length;
  const dogsPresentCount = animals.filter((a) => a.species === "dog" && inShelterStatuses[a.id]).length;
  const catsPresentCount = animals.filter((a) => a.species === "cat" && inShelterStatuses[a.id]).length;

  const speciesCounts = animals.reduce<Record<string, number>>((acc, a) => {
    acc[a.species] = (acc[a.species] ?? 0) + 1;
    return acc;
  }, {});
  const maxSpeciesCount = Math.max(1, ...Object.values(speciesCounts));

  const kpis = [
    {
      label: t("inShelter"),
      value: String(inShelterCount),
      delta: t("kpis.outcomesThisYear", { count: outcomesThisYear ?? 0, year: now.getFullYear() }),
      tone: "text-ink/55",
    },
    {
      label: t("dogsPresent"),
      value: String(dogsPresentCount),
      delta: null,
      tone: "text-success",
    },
    {
      label: t("catsPresent"),
      value: String(catsPresentCount),
      delta: null,
      tone: "text-warning",
    },
    {
      label: t("donationsTotal"),
      value: formatCents(donationKpis.totalCents12mo, locale),
      delta:
        donationKpis.totalDeltaPercent === null
          ? tDonations("kpis.totalReceivedNoData")
          : tDonations("kpis.totalReceivedDelta", {
              sign: donationKpis.totalDeltaPercent >= 0 ? "+" : "",
              percent: donationKpis.totalDeltaPercent,
            }),
      tone: donationKpis.totalDeltaPercent !== null && donationKpis.totalDeltaPercent < 0 ? "text-danger" : "text-success",
    },
    {
      label: t("upcomingVisits"),
      value: String(upcomingVisitsCount),
      delta: upcomingVisits[0]
        ? t("kpis.nextVisitOn", { date: new Date(upcomingVisits[0].scheduledAt).toLocaleDateString(locale) })
        : t("kpis.noUpcomingVisit"),
      tone: "text-ink/55",
    },
  ];

  const attentionItems = [
    attention.overdueVaccineCount > 0 && {
      key: "overdueVaccines",
      count: attention.overdueVaccineCount,
      label: t("attention.overdueVaccines"),
      meta: t("attention.overdueVaccinesMeta", { names: attention.overdueVaccineAnimalNames.slice(0, 3).join(" · ") }),
      tone: "danger" as const,
      href: "/admin/animals",
    },
    attention.syncFailureCount > 0 && {
      key: "syncFailures",
      count: attention.syncFailureCount,
      label: t("attention.syncFailures"),
      meta: t("attention.syncFailuresMeta", { count: attention.syncFailureCount }),
      tone: "danger" as const,
      href: "/admin/calendar",
    },
    attention.unpublishedDraftCount > 0 && {
      key: "unpublishedDrafts",
      count: attention.unpublishedDraftCount,
      label: t("attention.unpublishedDrafts"),
      meta: t("attention.unpublishedDraftsMeta"),
      tone: "warning" as const,
      href: "/admin/animals",
    },
    attention.missingMicrochipCount > 0 && {
      key: "missingMicrochip",
      count: attention.missingMicrochipCount,
      label: t("attention.missingMicrochip"),
      meta: t("attention.missingMicrochipMeta", { count: attention.missingMicrochipCount }),
      tone: "warning" as const,
      href: "/admin/animals",
    },
    attention.failedDonationCount > 0 && {
      key: "failedDonations",
      count: attention.failedDonationCount,
      label: t("attention.failedDonations"),
      meta: t("attention.failedDonationsMeta", { count: attention.failedDonationCount }),
      tone: "danger" as const,
      href: "/admin/donations",
    },
  ].filter((item): item is Exclude<typeof item, false> => Boolean(item));

  const ATTENTION_TONE = {
    danger: "bg-danger-bg text-danger",
    warning: "bg-warning-bg text-warning",
  };

  const recentArrivals = animals.slice(0, 4);

  const dateLabel = now.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AdminPage title={t("title")} meta={dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-2.5 rounded-admin-sm border border-ink/10 bg-surface p-[14px_16px]">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink/50">
              {kpi.label}
            </span>
            <span className="font-display text-[27px] font-extrabold leading-none tracking-tight">
              {kpi.value}
            </span>
            {kpi.delta ? <span className={`text-[11.5px] font-semibold ${kpi.tone}`}>{kpi.delta}</span> : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-[18px] rounded-admin border border-ink/10 bg-surface p-[18px_20px_16px]">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-[15px]">{t("chart.title")}</h2>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.13em] text-ink/50">
                {t("chart.caption12")}
              </span>
            </div>
            <div className="ml-auto flex items-baseline gap-2">
              <span className="font-display text-[22px] font-extrabold tracking-tight">
                {formatCents(donationKpis.totalCents12mo, locale)}
              </span>
              {donationKpis.totalDeltaPercent !== null ? (
                <span
                  className={`text-[11.5px] font-semibold ${
                    donationKpis.totalDeltaPercent >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {tDonations("kpis.totalReceivedDelta", {
                    sign: donationKpis.totalDeltaPercent >= 0 ? "+" : "",
                    percent: donationKpis.totalDeltaPercent,
                  })}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex h-[168px] items-end gap-1.5 border-b border-ink/10">
            {monthlyTotals.map((bucket, i) => (
              <div key={bucket.monthKey} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-0">
                <span className="mb-[5px] font-mono text-[9.5px] text-ink/45">
                  {(bucket.totalCents / 100000).toFixed(1)}k
                </span>
                <div
                  className={`w-full max-w-[34px] rounded-t-[5px] ${
                    i === monthlyTotals.length - 1 ? "bg-accent" : "bg-accent/28"
                  }`}
                  style={{ height: `${Math.max(4, Math.round((bucket.totalCents / maxMonthlyCents) * 100))}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            {monthlyTotals.map((bucket) => (
              <span
                key={bucket.monthKey}
                className="flex-1 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink/50"
              >
                {new Date(2000, bucket.monthIndex, 1).toLocaleDateString(locale, { month: "short" }).replace(".", "")}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
          <div className="flex items-center gap-2.5 border-b border-ink/10 p-[16px_18px_14px]">
            <h2 className="text-[15px]">{t("attention.title")}</h2>
            {attentionItems.length > 0 ? <StatusPill tone="danger">{attentionItems.length}</StatusPill> : null}
          </div>
          <div className="flex flex-col">
            {attentionItems.length === 0 ? (
              <p className="p-[14px_18px] text-sm text-ink/60">{t("attention.empty")}</p>
            ) : (
              attentionItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-3 border-b border-ink/7 p-[12px_18px] last:border-0 hover:bg-ink/[0.025]"
                >
                  <span
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-[8px] font-mono text-xs font-medium ${ATTENTION_TONE[item.tone]}`}
                  >
                    {item.count}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[13px] font-bold leading-tight">{item.label}</span>
                    <span className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-ink/50">
                      {item.meta}
                    </span>
                  </span>
                  <ChevronRight size={15} className="ml-auto flex-none text-ink/30" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
          <div className="flex items-center gap-2.5 border-b border-ink/10 p-[16px_18px_14px]">
            <h2 className="text-[15px]">{t("vetVisits.title")}</h2>
            <Link href="/admin/calendar" className="ml-auto text-xs font-bold">
              {t("vetVisits.viewAll")}
            </Link>
          </div>
          {upcomingVisits.length === 0 ? (
            <p className="p-[14px_18px] text-sm text-ink/60">{t("vetVisits.empty")}</p>
          ) : (
            upcomingVisits.map((visit) => {
              const date = new Date(visit.scheduledAt);
              return (
                <Link
                  key={visit.id}
                  href={`/admin/calendar/${visit.id}`}
                  className="flex items-center gap-3.5 border-b border-ink/7 p-[12px_18px] last:border-0 hover:bg-ink/[0.02]"
                >
                  <span className="flex w-[46px] flex-none flex-col items-center justify-center rounded-[9px] bg-ink/4 p-[6px_0] leading-[1.1]">
                    <span className="font-display text-base font-extrabold">
                      {String(date.getDate()).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink/55">
                      {date.toLocaleDateString(locale, { month: "short" }).replace(".", "")}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[13.5px] font-bold">{visit.reason}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10.5px] text-ink/55">
                        {date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="h-[3px] w-[3px] rounded-pill bg-ink/25" />
                      <span className="text-xs text-ink/62">
                        {visit.animals.map((a) => a.animalName).join(", ")}
                      </span>
                    </span>
                  </span>
                  <StatusPill tone={visit.status === "completed" ? "success" : visit.status === "canceled" ? "neutral" : "accent"}>
                    {visit.status}
                  </StatusPill>
                </Link>
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
            <div className="flex items-center gap-2.5 border-b border-ink/10 p-[16px_18px_14px]">
              <h2 className="text-[15px]">{t("recentArrivals.title")}</h2>
              <Link href="/admin/animals" className="ml-auto text-xs font-bold">
                {t("recentArrivals.viewAll")}
              </Link>
            </div>
            {recentArrivals.length === 0 ? (
              <p className="p-[14px_18px] text-sm text-ink/60">{t("recentArrivals.empty")}</p>
            ) : (
              recentArrivals.map((animal) => (
                <Link
                  key={animal.id}
                  href={`/admin/animals/${animal.id}/edit`}
                  className="flex items-center gap-2.5 border-b border-ink/7 p-[10px_18px] last:border-0 hover:bg-ink/[0.02]"
                >
                  <AnimalThumb animal={animal} size={34} rounded={9} />
                  <span className="flex min-w-0 flex-col gap-px">
                    <span className="text-[13px] font-bold">{animal.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/50">
                      {animal.species}
                    </span>
                  </span>
                  <StatusPill tone={animal.isPublished ? "success" : "neutral"} className="ml-auto">
                    {animal.isPublished ? t("published") : "—"}
                  </StatusPill>
                </Link>
              ))
            )}
          </div>

          {Object.keys(speciesCounts).length > 0 ? (
            <div className="flex flex-col gap-3.5 rounded-admin border border-ink/10 bg-surface p-[16px_18px_18px]">
              <h2 className="text-[15px]">{t("bySpecies.title")}</h2>
              <div className="flex flex-col gap-2.5">
                {Object.entries(speciesCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([species, count]) => (
                    <div key={species} className="flex items-center gap-3">
                      <span className="w-[74px] flex-none text-[12.5px] font-semibold">{species}</span>
                      <span className="block h-[7px] flex-1 overflow-hidden rounded-pill bg-ink/7">
                        <span
                          className="block h-full rounded-pill bg-ink"
                          style={{ width: `${Math.round((count / maxSpeciesCount) * 100)}%` }}
                        />
                      </span>
                      <span className="w-[22px] flex-none text-right font-mono text-[11.5px] text-ink/60">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
        <div className="flex items-center gap-2.5 border-b border-ink/10 p-[16px_18px_14px]">
          <h2 className="text-[15px]">{t("recentVolunteerPhotos.title")}</h2>
          <Link href="/admin/animals" className="ml-auto text-xs font-bold">
            {t("recentVolunteerPhotos.viewAll")}
          </Link>
        </div>
        {recentVolunteerPhotos.length === 0 ? (
          <p className="p-[14px_18px] text-sm text-ink/60">{t("recentVolunteerPhotos.empty")}</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto p-[14px_18px]">
            {recentVolunteerPhotos.map((photo) => (
              <Link
                key={photo.id}
                href={`/admin/animals/${photo.animalId}/edit`}
                className="flex w-[104px] flex-none flex-col gap-1.5"
              >
                <Image
                  src={photo.url}
                  alt=""
                  width={104}
                  height={104}
                  className="aspect-square w-full rounded-[10px] border border-ink/8 object-cover"
                  style={{ objectPosition: `${photo.focalX * 100}% ${photo.focalY * 100}%` }}
                />
                <span className="truncate text-[12px] font-bold">{photo.animalName}</span>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink/50">
                  {formatRelativeDate(photo.createdAt, locale)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminPage>
  );
}
