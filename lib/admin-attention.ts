import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Raw counts behind the overview page's "À traiter" panel. Kept as plain
 * numbers/names here — the page builds the translated, tone-colored display
 * list, since labels are locale-dependent.
 */
export interface AttentionSignals {
  overdueVaccineCount: number;
  overdueVaccineAnimalNames: string[];
  syncFailureCount: number;
  unpublishedDraftCount: number;
  missingMicrochipCount: number;
  failedDonationCount: number;
}

const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

export async function getAttentionSignals(supabase: SupabaseClient): Promise<AttentionSignals> {
  const today = new Date().toISOString().slice(0, 10);
  const fifteenDaysAgo = new Date(Date.now() - FIFTEEN_DAYS_MS).toISOString();

  const [
    { data: overdueVaccines },
    { count: visitSyncFailures },
    { count: vaccineSyncFailures },
    { count: unpublishedDraftCount },
    { data: missingChipRows },
    { count: failedDonationCount },
  ] = await Promise.all([
    supabase
      .from("animal_vaccines")
      .select("animal_id, animals(name)")
      .lt("follow_up_date", today)
      .eq("follow_up_completed", false),
    supabase
      .from("vet_visits")
      .select("id", { count: "exact", head: true })
      .not("google_sync_error", "is", null),
    supabase
      .from("animal_vaccines")
      .select("id", { count: "exact", head: true })
      .not("google_sync_error", "is", null),
    supabase
      .from("animals")
      .select("id", { count: "exact", head: true })
      .eq("is_published", false)
      .lt("created_at", fifteenDaysAgo),
    supabase
      .from("animal_internal_details")
      .select("animal_id")
      .is("microchip_number", null)
      .eq("in_shelter", true),
    supabase.from("donations").select("id", { count: "exact", head: true }).eq("status", "failed"),
  ]);

  return {
    overdueVaccineCount: overdueVaccines?.length ?? 0,
    overdueVaccineAnimalNames: (overdueVaccines ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: any) => row.animals?.name as string | undefined)
      .filter((name): name is string => Boolean(name)),
    syncFailureCount: (visitSyncFailures ?? 0) + (vaccineSyncFailures ?? 0),
    unpublishedDraftCount: unpublishedDraftCount ?? 0,
    missingMicrochipCount: missingChipRows?.length ?? 0,
    failedDonationCount: failedDonationCount ?? 0,
  };
}
