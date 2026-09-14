"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { getMonthGridDays, getWeekDays, toDateKey, addDays, addMonths } from "@/lib/calendar-dates";
import type { VetVisitWithAnimals } from "@/lib/vet-visits";

type View = "month" | "week";

export function VetCalendar({
  view,
  anchor,
  visits,
}: {
  view: View;
  anchor: string;
  visits: VetVisitWithAnimals[];
}) {
  const t = useTranslations("admin.calendar");
  const router = useRouter();
  const anchorDate = new Date(anchor);

  const days = view === "month" ? getMonthGridDays(anchorDate) : getWeekDays(anchorDate);
  const weekdayLabels = days
    .slice(0, 7)
    .map((day) => day.toLocaleDateString(undefined, { weekday: "short" }));

  const visitsByDay = new Map<string, VetVisitWithAnimals[]>();
  for (const visit of visits) {
    const key = toDateKey(new Date(visit.scheduledAt));
    const list = visitsByDay.get(key) ?? [];
    list.push(visit);
    visitsByDay.set(key, list);
  }

  function navigate(nextView: View, nextDate: Date) {
    router.push(`/admin/calendar?view=${nextView}&date=${toDateKey(nextDate)}`);
  }

  const monthLabel = anchorDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl capitalize">{monthLabel}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(view, view === "month" ? addMonths(anchorDate, -1) : addDays(anchorDate, -7))}
            className="px-3 py-1.5 rounded-pill border border-ink/15 text-sm font-bold hover:bg-ink/5"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => navigate(view, new Date())}
            className="px-3 py-1.5 rounded-pill border border-ink/15 text-sm font-bold hover:bg-ink/5"
          >
            {t("today")}
          </button>
          <button
            type="button"
            onClick={() => navigate(view, view === "month" ? addMonths(anchorDate, 1) : addDays(anchorDate, 7))}
            className="px-3 py-1.5 rounded-pill border border-ink/15 text-sm font-bold hover:bg-ink/5"
          >
            →
          </button>
          <div className="ml-2 flex rounded-pill border border-ink/15 overflow-hidden text-sm font-bold">
            <button
              type="button"
              onClick={() => navigate("month", anchorDate)}
              className={`px-3 py-1.5 ${view === "month" ? "bg-ink text-white" : "hover:bg-ink/5"}`}
            >
              {t("monthView")}
            </button>
            <button
              type="button"
              onClick={() => navigate("week", anchorDate)}
              className={`px-3 py-1.5 ${view === "week" ? "bg-ink text-white" : "hover:bg-ink/5"}`}
            >
              {t("weekView")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-ink/10 rounded-t-card overflow-hidden text-xs font-bold uppercase tracking-wide text-ink/50">
        {weekdayLabels.map((label, i) => (
          <div key={i} className="bg-surface px-2 py-1.5">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-ink/10 rounded-b-card overflow-hidden -mt-6">
        {days.map((day) => {
          const key = toDateKey(day);
          const dayVisits = (visitsByDay.get(key) ?? []).sort((a, b) =>
            a.scheduledAt < b.scheduledAt ? -1 : 1,
          );
          const inCurrentMonth = view === "week" || day.getMonth() === anchorDate.getMonth();

          return (
            <div
              key={key}
              className={`bg-surface p-2 flex flex-col gap-1 ${
                view === "month" ? "min-h-[110px]" : "min-h-[340px]"
              } ${inCurrentMonth ? "" : "opacity-40"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{day.getDate()}</span>
                <Link href={`/admin/calendar/new?date=${key}`} className="text-xs font-bold text-accent">
                  +
                </Link>
              </div>
              <div className="flex flex-col gap-1">
                {dayVisits.map((visit) => (
                  <Link
                    key={visit.id}
                    href={`/admin/calendar/${visit.id}`}
                    className="text-[11px] leading-tight px-1.5 py-1 rounded-md bg-accent/10 text-accent font-bold truncate"
                    title={visit.reason}
                  >
                    {new Date(visit.scheduledAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    {visit.reason}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
