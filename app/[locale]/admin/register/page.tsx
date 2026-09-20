import { getLocale, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminPage } from "@/components/admin/AdminPage";
import {
  INTAKE_CAUSES,
  OUTCOME_CAUSES,
  getRegisterData,
  getRegisterYears,
  type SummaryRow,
} from "@/lib/register";
import { formatRegisterDate } from "@/lib/register-pdf";

const CELL = "border-b border-ink/7 p-[8px_14px] text-right font-mono text-[12.5px] tabular-nums";
const HEAD =
  "whitespace-nowrap border-b border-ink/10 bg-ink/[0.025] p-[9px_14px] text-right font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-ink/55";

export default async function AdminRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.register");
  const supabase = await createClient();

  const years = await getRegisterYears(supabase);
  const requested = Number((await searchParams).year);
  const year = years.includes(requested) ? requested : years[0];
  const { entries, exits, summary } = await getRegisterData(supabase, year);

  function renderTable<C extends string>(
    title: string,
    causes: readonly C[],
    causeLabel: (cause: C) => string,
    rows: SummaryRow<C>[],
  ) {
    const totals = causes.map((c) => rows.reduce((sum, row) => sum + row.counts[c], 0));
    return (
      <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th className={`${HEAD} text-left`}>{title}</th>
                {causes.map((c) => (
                  <th key={c} className={HEAD}>
                    {causeLabel(c)}
                  </th>
                ))}
                <th className={HEAD}>{t("total")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.species}>
                  <td className="border-b border-ink/7 p-[8px_14px] font-bold">{t(`speciesNames.${row.species}`)}</td>
                  {causes.map((c) => (
                    <td key={c} className={CELL}>
                      {row.counts[c]}
                    </td>
                  ))}
                  <td className={`${CELL} font-bold`}>{row.total}</td>
                </tr>
              ))}
              <tr className="bg-ink/[0.025] font-bold">
                <td className="p-[8px_14px]">{t("total")}</td>
                {totals.map((n, i) => (
                  <td key={causes[i]} className={CELL}>
                    {n}
                  </td>
                ))}
                <td className={CELL}>{totals.reduce((a, b) => a + b, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <AdminPage title={t("title")} meta={t("meta", { year })}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">{t("yearLabel")}</span>
        {years.map((y) => (
          <Link
            key={y}
            href={{ pathname: "/admin/register", query: { year: y } }}
            className={`rounded-[7px] px-3 py-[6px] text-[12.5px] font-bold ${
              y === year ? "bg-ink text-white" : "border border-ink/14 text-ink/60 hover:border-ink"
            }`}
          >
            {y}
          </Link>
        ))}
        <a
          href={`/api/admin/register/pdf?year=${year}`}
          className="ml-auto inline-flex items-center justify-center gap-[7px] rounded-[9px] bg-ink px-3.5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-accent"
        >
          <Download size={15} />
          {t("download")}
        </a>
      </div>

      {entries.length === 0 && exits.length === 0 ? <p className="text-sm text-ink/60">{t("noEntries")}</p> : null}

      {renderTable(t("entriesTitle"), INTAKE_CAUSES, (c) => t(`intakeCauses.${c}`), summary.entries)}
      {renderTable(t("exitsTitle"), OUTCOME_CAUSES, (c) => t(`outcomeCauses.${c}`), summary.exits)}

      <div className="max-w-[420px] overflow-hidden rounded-admin border border-ink/10 bg-surface">
        <table className="w-full text-[13px]">
          <thead>
            <tr>
              <th className={`${HEAD} text-left`}>{t("species")}</th>
              <th className={HEAD}>{t("presentAt", { date: formatRegisterDate(summary.startDate) })}</th>
              <th className={HEAD}>
                {summary.endIsToday ? t("today") : t("presentAt", { date: formatRegisterDate(summary.endDate) })}
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.present.map((row) => (
              <tr key={row.species}>
                <td className="border-b border-ink/7 p-[8px_14px] font-bold">{t(`speciesNames.${row.species}`)}</td>
                <td className={CELL}>{row.start}</td>
                <td className={CELL}>{row.end}</td>
              </tr>
            ))}
            <tr className="bg-ink/[0.025] font-bold">
              <td className="p-[8px_14px]">{t("total")}</td>
              <td className={CELL}>{summary.present.reduce((a, r) => a + r.start, 0)}</td>
              <td className={CELL}>{summary.present.reduce((a, r) => a + r.end, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
