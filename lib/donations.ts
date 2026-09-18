export type DonationFrequency = "one_time" | "monthly";
export type DonationStatus = "pending" | "completed" | "failed" | "refunded";

export interface DonationRow {
  id: string;
  created_at: string;
  donor_name: string | null;
  donor_email: string | null;
  amount_cents: number;
  frequency: DonationFrequency;
  status: DonationStatus;
  stripe_subscription_id: string | null;
}

export interface DonationKpis {
  /** Sum of completed donations in the trailing 12 months. */
  totalCents12mo: number;
  /** % change vs. the 12 months before that; null if there's nothing to compare to. */
  totalDeltaPercent: number | null;
  /** Distinct monthly subscriptions with a completed charge in the last 35 days. */
  activeMonthlyCount: number;
  activeMonthlyCents: number;
  averageCents12mo: number;
  count12mo: number;
  pendingCount: number;
  failedCount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * All KPIs are derived from the donation rows the caller already fetched
 * (a shelter's donation volume is small enough that fetching every row once
 * and deriving everything in memory is simpler than several aggregate
 * queries). total/average/count are scoped to the trailing 12 months to
 * match the redesign's "12 derniers mois" framing; "à vérifier" counts
 * pending/failed regardless of age since those need attention either way.
 */
export function getDonationKpis(donations: DonationRow[], now = new Date()): DonationKpis {
  const cutoff12mo = new Date(now.getTime() - 365 * DAY_MS);
  const cutoff24mo = new Date(now.getTime() - 2 * 365 * DAY_MS);
  const cutoffActive = new Date(now.getTime() - 35 * DAY_MS);

  const completed = donations.filter((d) => d.status === "completed");
  const last12mo = completed.filter((d) => new Date(d.created_at) >= cutoff12mo);
  const prior12mo = completed.filter((d) => {
    const created = new Date(d.created_at);
    return created >= cutoff24mo && created < cutoff12mo;
  });

  const totalCents12mo = last12mo.reduce((sum, d) => sum + d.amount_cents, 0);
  const totalPriorCents = prior12mo.reduce((sum, d) => sum + d.amount_cents, 0);
  const totalDeltaPercent =
    totalPriorCents > 0 ? Math.round(((totalCents12mo - totalPriorCents) / totalPriorCents) * 100) : null;

  const monthlyCompleted = completed.filter((d) => d.frequency === "monthly" && d.stripe_subscription_id);
  const latestPerSubscription = new Map<string, DonationRow>();
  for (const donation of monthlyCompleted) {
    const key = donation.stripe_subscription_id!;
    const existing = latestPerSubscription.get(key);
    if (!existing || new Date(donation.created_at) > new Date(existing.created_at)) {
      latestPerSubscription.set(key, donation);
    }
  }
  const activeSubscriptions = [...latestPerSubscription.values()].filter(
    (d) => new Date(d.created_at) >= cutoffActive,
  );

  return {
    totalCents12mo,
    totalDeltaPercent,
    activeMonthlyCount: activeSubscriptions.length,
    activeMonthlyCents: activeSubscriptions.reduce((sum, d) => sum + d.amount_cents, 0),
    averageCents12mo: last12mo.length > 0 ? Math.round(totalCents12mo / last12mo.length) : 0,
    count12mo: last12mo.length,
    pendingCount: donations.filter((d) => d.status === "pending").length,
    failedCount: donations.filter((d) => d.status === "failed").length,
  };
}

export interface MonthlyDonationTotal {
  monthKey: string;
  monthIndex: number;
  totalCents: number;
}

/** Trailing `months` calendar months of completed-donation totals, oldest first. */
export function getMonthlyDonationTotals(
  donations: DonationRow[],
  months = 12,
  now = new Date(),
): MonthlyDonationTotal[] {
  const completed = donations.filter((d) => d.status === "completed");
  const buckets: MonthlyDonationTotal[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const bucketDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, "0")}`;
    const totalCents = completed
      .filter((d) => {
        const created = new Date(d.created_at);
        return created.getFullYear() === bucketDate.getFullYear() && created.getMonth() === bucketDate.getMonth();
      })
      .reduce((sum, d) => sum + d.amount_cents, 0);
    buckets.push({ monthKey, monthIndex: bucketDate.getMonth(), totalCents });
  }

  return buckets;
}
