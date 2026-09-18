import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listVetVisits } from "@/lib/vet-visits";
import { VetCalendar } from "@/components/admin/VetCalendar";
import { AdminPage } from "@/components/admin/AdminPage";
import { getMonthGridDays, getWeekDays, addDays } from "@/lib/calendar-dates";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.calendar");
  const { view: rawView, date: rawDate } = await searchParams;
  const view = rawView === "week" ? "week" : "month";
  const anchor = rawDate ? new Date(rawDate) : new Date();

  const days = view === "month" ? getMonthGridDays(anchor) : getWeekDays(anchor);
  const from = days[0];
  const to = addDays(days[days.length - 1], 1);

  const supabase = await createClient();
  const visits = await listVetVisits(supabase, { from: from.toISOString(), to: to.toISOString() });

  const monthLabel = anchor.toLocaleDateString(locale, { month: "long", year: "numeric" });

  return (
    <AdminPage title={t("title")} meta={t("meta", { month: monthLabel, count: visits.length })}>
      <VetCalendar view={view} anchor={anchor.toISOString()} visits={visits} />
    </AdminPage>
  );
}
