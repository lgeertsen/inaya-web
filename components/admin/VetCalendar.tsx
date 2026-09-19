"use client";

import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { getMonthGridDays, getWeekDays, toDateKey, addDays, addMonths } from "@/lib/calendar-dates";
import { AdminButtonLink } from "@/components/admin/ui/AdminButton";
import type { VetVisitWithAnimals, VetAppointmentStatus } from "@/lib/vet-visits";

type View = "month" | "week";

const STATUS_COLOR: Record<VetAppointmentStatus, { bg: string; accent: string }> = {
  pending: { bg: "bg-accent-bg", accent: "text-accent" },
  completed: { bg: "bg-success-bg", accent: "text-success" },
  canceled: { bg: "bg-ink/6", accent: "text-ink/45" },
};

const LEGEND_DOT: Record<VetAppointmentStatus, string> = {
  pending: "bg-accent",
  completed: "bg-success",
  canceled: "bg-ink/30",
};

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
  const locale = useLocale();
  const router = useRouter();
  const anchorDate = new Date(anchor);

  const days = view === "month" ? getMonthGridDays(anchorDate) : getWeekDays(anchorDate);
  const weekdayLabels = days
    .slice(0, 7)
    .map((day) => day.toLocaleDateString(locale, { weekday: "short" }));

  const visitsByDay = new Map<string, VetVisitWithAnimals[]>();
  for (const visit of visits) {
    const key = toDateKey(new Date(visit.scheduledAt));
    const list = visitsByDay.get(key) ?? [];
    list.push(visit);
    visitsByDay.set(key, list);
  }

  function navigate(nextView: View, nextDate: Date) {
    router.push({
      pathname: "/admin/calendar",
      query: { view: nextView, date: toDateKey(nextDate) },
    });
  }

  const todayKey = toDateKey(new Date());

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(view, view === "month" ? addMonths(anchorDate, -1) : addDays(anchorDate, -7))}
            className="flex rounded-[8px] border border-ink/14 bg-surface p-[7px] hover:border-ink"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => navigate(view, new Date())}
            className="rounded-[8px] border border-ink/14 bg-surface px-3 py-[7px] text-[12.5px] font-bold hover:border-ink"
          >
            {t("today")}
          </button>
          <button
            type="button"
            onClick={() => navigate(view, view === "month" ? addMonths(anchorDate, 1) : addDays(anchorDate, 7))}
            className="flex rounded-[8px] border border-ink/14 bg-surface p-[7px] hover:border-ink"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="flex overflow-hidden rounded-[9px] border border-ink/14 bg-surface">
          <button
            type="button"
            onClick={() => navigate("month", anchorDate)}
            className={`px-3.5 py-2 text-[12.5px] font-bold ${
              view === "month" ? "bg-ink text-white" : "text-ink/62 hover:bg-ink/4"
            }`}
          >
            {t("monthView")}
          </button>
          <button
            type="button"
            onClick={() => navigate("week", anchorDate)}
            className={`border-l border-ink/12 px-3.5 py-2 text-[12.5px] font-bold ${
              view === "week" ? "bg-ink text-white" : "text-ink/62 hover:bg-ink/4"
            }`}
          >
            {t("weekView")}
          </button>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3.5">
          {(["pending", "completed", "canceled"] as const).map((status) => (
            <span key={status} className="flex items-center gap-1.5 text-xs text-ink/62">
              <span className={`h-2 w-2 rounded-[2px] ${LEGEND_DOT[status]}`} />
              {t(`statuses.${status}`)}
            </span>
          ))}
          <AdminButtonLink href="/admin/calendar/new" variant="dark">
            <Plus size={15} strokeWidth={2.2} />
            {t("addVisit")}
          </AdminButtonLink>
        </div>
      </div>

      <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
        <div className="grid grid-cols-7 border-b border-ink/10 bg-ink/[0.025]">
          {weekdayLabels.map((label, i) => (
            <span
              key={i}
              className="p-[8px_10px] font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink/55"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = toDateKey(day);
            const dayVisits = (visitsByDay.get(key) ?? []).sort((a, b) =>
              a.scheduledAt < b.scheduledAt ? -1 : 1,
            );
            const inCurrentMonth = view === "week" || day.getMonth() === anchorDate.getMonth();
            const isToday = key === todayKey;

            return (
              <div
                key={key}
                className={`flex flex-col gap-1 border-b border-r border-ink/7 p-[7px_8px] ${
                  view === "month" ? "min-h-[104px]" : "min-h-[340px]"
                } ${isToday ? "bg-accent-bg/40" : inCurrentMonth ? "bg-surface" : "bg-ink/[0.02]"}`}
              >
                <span className="flex items-center justify-between">
                  <span className={`font-mono text-[11px] ${inCurrentMonth ? "text-ink/75" : "text-ink/32"}`}>
                    {String(day.getDate()).padStart(2, "0")}
                  </span>
                  <Link
                    href={{ pathname: "/admin/calendar/new", query: { date: key } }}
                    className="font-mono text-[11px] text-ink/25 hover:text-accent"
                  >
                    +
                  </Link>
                </span>
                <div className="flex flex-col gap-1">
                  {dayVisits.map((visit) => {
                    const colors = STATUS_COLOR[visit.status];
                    return (
                      <Link
                        key={visit.id}
                        href={{ pathname: "/admin/calendar/[visitId]", params: { visitId: visit.id } }}
                        className={`flex flex-col gap-px rounded-[6px] p-[4px_6px] ${colors.bg}`}
                        title={visit.reason}
                      >
                        <span className={`font-mono text-[9.5px] ${colors.accent}`}>
                          {new Date(visit.scheduledAt).toLocaleTimeString(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="truncate text-[11px] font-bold leading-tight">{visit.reason}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
