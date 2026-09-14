import { createClient } from "@/lib/supabase/server";
import { listVetVisits } from "@/lib/vet-visits";
import { VetCalendar } from "@/components/admin/VetCalendar";
import { getMonthGridDays, getWeekDays, addDays } from "@/lib/calendar-dates";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view: rawView, date: rawDate } = await searchParams;
  const view = rawView === "week" ? "week" : "month";
  const anchor = rawDate ? new Date(rawDate) : new Date();

  const days = view === "month" ? getMonthGridDays(anchor) : getWeekDays(anchor);
  const from = days[0];
  const to = addDays(days[days.length - 1], 1);

  const supabase = await createClient();
  const visits = await listVetVisits(supabase, { from: from.toISOString(), to: to.toISOString() });

  return <VetCalendar view={view} anchor={anchor.toISOString()} visits={visits} />;
}
