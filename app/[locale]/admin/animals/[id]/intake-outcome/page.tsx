import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  listAnimalIntakes,
  listAnimalOutcomes,
  type AnimalIntake,
  type AnimalOutcome,
} from "@/lib/animal-care";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { DeleteRowButton } from "@/components/admin/DeleteRowButton";
import { AnimalIntakeForm } from "@/components/admin/AnimalIntakeForm";
import { AnimalOutcomeForm } from "@/components/admin/AnimalOutcomeForm";

type TimelineRow = (AnimalIntake & { kind: "intake" }) | (AnimalOutcome & { kind: "outcome" });

export default async function AnimalIntakeOutcomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const { id } = await params;
  const supabase = await createClient();
  const [intakes, outcomes] = await Promise.all([
    listAnimalIntakes(supabase, id),
    listAnimalOutcomes(supabase, id),
  ]);

  const t = await getTranslations("admin.animals.intakeOutcome");

  const rows: TimelineRow[] = [
    ...intakes.map((intake) => ({ ...intake, kind: "intake" as const })),
    ...outcomes.map((outcome) => ({ ...outcome, kind: "outcome" as const })),
  ].sort((a, b) => (a.occurredOn < b.occurredOn ? 1 : -1));

  const columns: AdminTableColumn<TimelineRow>[] = [
    {
      header: t("occurredOn"),
      className: "font-mono text-[11.5px] text-ink/66",
      render: (row) => new Date(row.occurredOn).toLocaleDateString(locale),
    },
    {
      header: t("type"),
      className: "font-bold",
      render: (row) => (row.kind === "intake" ? t("intakeLabel") : t("outcomeLabel")),
    },
    {
      header: t("reason"),
      render: (row) =>
        row.kind === "intake" ? t(`intakeReasons.${row.reason}`) : t(`outcomeReasons.${row.reason}`),
    },
    { header: t("description"), className: "text-ink/66", render: (row) => row.description ?? "—" },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <DeleteRowButton
          endpoint={`/api/admin/animals/${id}/${row.kind === "intake" ? "intakes" : "outcomes"}/${row.id}`}
          label={t("delete")}
          confirmMessage={t("deleteConfirm")}
          iconOnly
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-admin border border-ink/10 bg-surface">
        <AdminTable columns={columns} rows={rows} emptyMessage={t("empty")} minWidth={620} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-admin border border-ink/10 bg-surface p-[16px_18px]">
          <h2 className="text-[14.5px]">{t("addIntake")}</h2>
          <AnimalIntakeForm animalId={id} />
        </div>
        <div className="flex flex-col gap-3 rounded-admin border border-ink/10 bg-surface p-[16px_18px]">
          <h2 className="text-[14.5px]">{t("addOutcome")}</h2>
          <AnimalOutcomeForm animalId={id} />
        </div>
      </div>
    </div>
  );
}
