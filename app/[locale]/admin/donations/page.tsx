import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DonationsTableClient } from "@/components/admin/DonationsTableClient";
import { AdminPage } from "@/components/admin/AdminPage";
import { getDonationKpis, type DonationRow } from "@/lib/donations";
import { formatCents } from "@/lib/format";

export default async function AdminDonationsPage() {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.donations");
  const supabase = await createClient();
  const { data: donations } = await supabase
    .from("donations")
    .select(
      "id, created_at, donor_name, donor_email, amount_cents, frequency, status, stripe_subscription_id",
    )
    .order("created_at", { ascending: false })
    .returns<DonationRow[]>();

  const rows = donations ?? [];
  const kpis = getDonationKpis(rows);

  const kpiCards = [
    {
      label: t("kpis.totalReceived"),
      value: formatCents(kpis.totalCents12mo, locale),
      detail:
        kpis.totalDeltaPercent === null
          ? t("kpis.totalReceivedNoData")
          : t("kpis.totalReceivedDelta", {
              sign: kpis.totalDeltaPercent >= 0 ? "+" : "",
              percent: kpis.totalDeltaPercent,
            }),
      tone: kpis.totalDeltaPercent !== null && kpis.totalDeltaPercent < 0 ? "text-danger" : "text-success",
    },
    {
      label: t("kpis.activeMonthly"),
      value: String(kpis.activeMonthlyCount),
      detail: t("kpis.activeMonthlyDetail", { amount: formatCents(kpis.activeMonthlyCents, locale) }),
      tone: "text-ink/55",
    },
    {
      label: t("kpis.average"),
      value: formatCents(kpis.averageCents12mo, locale),
      detail: t("kpis.averageDetail", { count: kpis.count12mo }),
      tone: "text-ink/55",
    },
    {
      label: t("kpis.toReview"),
      value: String(kpis.pendingCount + kpis.failedCount),
      detail: t("kpis.toReviewDetail", { failed: kpis.failedCount, pending: kpis.pendingCount }),
      tone: "text-danger",
    },
  ];

  return (
    <AdminPage title={t("title")} meta={t("meta", { total: formatCents(kpis.totalCents12mo, locale) })}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="flex flex-col gap-[9px] rounded-admin-sm border border-ink/10 bg-surface p-[14px_16px]"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
              {card.label}
            </span>
            <span className="font-display text-[27px] font-extrabold leading-none tracking-tight">
              {card.value}
            </span>
            <span className={`text-[11.5px] font-semibold ${card.tone}`}>{card.detail}</span>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink/60">{t("empty")}</p>
      ) : (
        <DonationsTableClient donations={rows} locale={locale} />
      )}
    </AdminPage>
  );
}
