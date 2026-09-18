import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnimalById } from "@/lib/animals";
import {
  getAnimalInternalDetails,
  listAnimalVaccines,
  listAnimalTreatments,
  listAnimalIntakes,
  listAnimalOutcomes,
  type AnimalVaccine,
  type AnimalTreatment,
} from "@/lib/animal-care";
import { getAnimalHistory } from "@/lib/animal-history";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { DeleteRowButton } from "@/components/admin/DeleteRowButton";
import { ToggleCheckbox } from "@/components/admin/ToggleCheckbox";
import { RetrySyncButton } from "@/components/admin/RetrySyncButton";
import { AnimalVaccineForm } from "@/components/admin/AnimalVaccineForm";
import { AnimalTreatmentForm } from "@/components/admin/AnimalTreatmentForm";
import { AnimalInternalDetailsForm } from "@/components/admin/AnimalInternalDetailsForm";
import { StatusPill } from "@/components/admin/ui/StatusPill";

export default async function AnimalCarePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const { id } = await params;
  const supabase = await createClient();
  const [animal, details, vaccines, treatments, intakes, outcomes] = await Promise.all([
    getAnimalById(supabase, id),
    getAnimalInternalDetails(supabase, id),
    listAnimalVaccines(supabase, id),
    listAnimalTreatments(supabase, id),
    listAnimalIntakes(supabase, id),
    listAnimalOutcomes(supabase, id),
  ]);

  const t = await getTranslations("admin.animals");
  const now = new Date();
  const dueCount = vaccines.filter(
    (v) => v.followUpDate && !v.followUpCompleted && new Date(v.followUpDate) < now,
  ).length;
  const history = animal ? getAnimalHistory(intakes, outcomes, animal) : [];

  const vaccineColumns: AdminTableColumn<AnimalVaccine>[] = [
    { header: t("vaccines.name"), className: "font-bold", render: (row) => row.name },
    {
      header: t("vaccines.administeredOn"),
      className: "font-mono text-[11.5px] text-ink/66",
      render: (row) => new Date(row.administeredOn).toLocaleDateString(locale),
    },
    {
      header: t("vaccines.followUpDate"),
      render: (row) => {
        if (!row.followUpDate) return t("vaccines.noReminder");
        const overdue = !row.followUpCompleted && new Date(row.followUpDate) < now;
        const date = new Date(row.followUpDate).toLocaleDateString(locale);
        return (
          <span className="flex items-center gap-2">
            <StatusPill tone={overdue ? "danger" : "success"}>
              {t(overdue ? "vaccines.reminderOverdue" : "vaccines.reminderScheduled", { date })}
            </StatusPill>
            {row.followUpDate ? (
              <label className="flex items-center gap-1 text-[11px] text-ink/55">
                <ToggleCheckbox
                  endpoint={`/api/admin/animals/${id}/vaccines/${row.id}`}
                  field="followUpCompleted"
                  checked={row.followUpCompleted}
                />
                {t("vaccines.followUpCompleted")}
              </label>
            ) : null}
          </span>
        );
      },
    },
    {
      header: t("vaccines.sync"),
      className: "text-[12px] text-ink/60",
      render: (row) =>
        row.followUpDate && !row.followUpCompleted ? (
          <span className="flex items-center gap-1.5">
            {row.googleSyncError ? t("vaccines.syncFailed") : row.googleEventId ? t("vaccines.syncSynced") : t("vaccines.syncPending")}
            {row.googleSyncError ? (
              <RetrySyncButton
                endpoint={`/api/admin/animals/${id}/vaccines/${row.id}/retry-sync`}
                label={t("vaccines.retrySync")}
              />
            ) : null}
          </span>
        ) : (
          "—"
        ),
    },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <DeleteRowButton
          endpoint={`/api/admin/animals/${id}/vaccines/${row.id}`}
          label={t("vaccines.delete")}
          confirmMessage={t("vaccines.deleteConfirm")}
          iconOnly
        />
      ),
    },
  ];

  const treatmentColumns: AdminTableColumn<AnimalTreatment>[] = [
    {
      header: t("treatments.name"),
      render: (row) => (
        <span className="flex flex-col gap-px">
          <span className="text-[13px] font-bold">{row.name}</span>
          <span className="font-mono text-[10.5px] text-ink/55">
            {row.medicine} · {row.amount} {t(`treatments.measurementUnits.${row.measurement}`)}
            {row.dayStep && row.dayTimes
              ? ` · ${t("treatments.schedule", { days: row.dayStep, times: row.dayTimes })}`
              : ""}
          </span>
        </span>
      ),
    },
    {
      header: t("treatments.endDate"),
      render: (row) => (
        <StatusPill tone="accent">
          {row.endDate ? new Date(row.endDate).toLocaleDateString(locale) : "—"}
        </StatusPill>
      ),
    },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <DeleteRowButton
          endpoint={`/api/admin/animals/${id}/treatments/${row.id}`}
          label={t("treatments.delete")}
          confirmMessage={t("treatments.deleteConfirm")}
          iconOnly
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
          <div className="flex flex-wrap items-center gap-2.5 border-b border-ink/10 p-[14px_18px]">
            <h2 className="text-[14.5px]">{t("vaccines.title")}</h2>
            <StatusPill tone={dueCount > 0 ? "danger" : "success"}>
              {t("vaccines.dueBadge", { count: dueCount })}
            </StatusPill>
          </div>
          <AdminTable columns={vaccineColumns} rows={vaccines} emptyMessage={t("vaccines.empty")} minWidth={600} />
          <div className="border-t border-ink/10 p-[14px_18px]">
            <AnimalVaccineForm animalId={id} />
          </div>
        </div>

        <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
          <div className="flex items-center gap-2.5 border-b border-ink/10 p-[14px_18px]">
            <h2 className="text-[14.5px]">{t("treatments.title")}</h2>
          </div>
          <AdminTable columns={treatmentColumns} rows={treatments} emptyMessage={t("treatments.empty")} minWidth={440} />
          <div className="border-t border-ink/10 p-[14px_18px]">
            <AnimalTreatmentForm animalId={id} />
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-3.5 rounded-admin border border-ink/10 bg-surface p-[16px_18px]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[14.5px]">{t("internalDetails.title")}</h2>
            <StatusPill tone={details?.inShelter ? "success" : "neutral"}>
              {details?.inShelter ? t("internalDetails.inShelterYes") : t("internalDetails.inShelterNo")}
            </StatusPill>
          </div>
          <AnimalInternalDetailsForm animalId={id} details={details} />
        </div>

        <div className="flex flex-col gap-3 rounded-admin border border-ink/10 bg-surface p-[16px_18px]">
          <h2 className="text-[14.5px]">{t("detail.historyTitle")}</h2>
          <div className="flex flex-col gap-2.5">
            {history.map((entry) => (
              <div key={entry.key} className="flex gap-[11px]">
                <span
                  className={`mt-[5px] h-[7px] w-[7px] flex-none rounded-pill ${
                    entry.kind === "intake" ? "bg-success" : "bg-ink/25"
                  }`}
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[12.5px] font-bold">
                    {entry.kind === "published"
                      ? t("detail.historyPublished")
                      : entry.kind === "intake"
                        ? `${t("intakeOutcome.intakeLabel")} · ${
                            entry.description || t(`intakeOutcome.intakeReasons.${entry.reason}`)
                          }`
                        : `${t("intakeOutcome.outcomeLabel")} · ${
                            entry.description || t(`intakeOutcome.outcomeReasons.${entry.reason}`)
                          }`}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/50">
                    {new Date(entry.date).toLocaleDateString(locale)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
