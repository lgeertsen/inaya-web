import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isCheckinOverdue, type FosterPlacement } from "@/lib/foster";
import { DeleteRowButton } from "@/components/admin/DeleteRowButton";
import { FosterCheckinForm } from "@/components/admin/FosterCheckinForm";
import { EndFosterPlacementForm } from "@/components/admin/EndFosterPlacementForm";
import { StatusPill } from "@/components/admin/ui/StatusPill";

/**
 * One open placement: who/where, check-in status, the check-in log with an
 * "add check-in" form, and the controls to end (or delete) the placement.
 * `subject` says which side the card is shown from: on a family's page the
 * heading is the animal, on an animal's tab it is the family.
 */
export async function FosterPlacementCard({
  placement,
  subject,
}: {
  placement: FosterPlacement;
  subject: "animal" | "family";
}) {
  const locale = await getLocale();
  const t = await getTranslations("admin.foster.card");
  const tTypes = await getTranslations("admin.foster.checkinTypes");
  const tCheckins = await getTranslations("admin.foster.checkins");
  const tEnd = await getTranslations("admin.foster.end");

  const formatDate = (date: string) => new Date(date).toLocaleDateString(locale);
  const overdue = isCheckinOverdue(placement);

  return (
    <div className="flex flex-col gap-4 rounded-admin border border-ink/10 bg-surface p-[16px_18px]">
      <div className="flex flex-wrap items-center gap-2.5">
        {subject === "animal" ? (
          <Link
            href={{ pathname: "/admin/animals/[id]/foster", params: { id: placement.animalId } }}
            className="text-[15px] font-bold hover:underline"
          >
            {placement.animalName}
          </Link>
        ) : (
          <Link
            href={{ pathname: "/admin/foster/[familyId]", params: { familyId: placement.familyId } }}
            className="text-[15px] font-bold hover:underline"
          >
            {placement.familyName}
          </Link>
        )}
        {subject === "animal" ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/50">
            {placement.animalSpecies}
          </span>
        ) : null}
        <span className="font-mono text-[11.5px] text-ink/60">
          {t("since", { date: formatDate(placement.startedOn) })}
        </span>
        <StatusPill tone={overdue ? "danger" : "success"} className="ml-auto">
          {overdue ? t("checkinOverdue") : t("checkinOk")}
        </StatusPill>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12.5px] text-ink/66">
        <span>
          {placement.lastCheckinOn
            ? t("lastCheckin", { date: formatDate(placement.lastCheckinOn) })
            : t("noCheckin")}
        </span>
        {placement.nextCheckinDue ? (
          <span className={overdue ? "font-bold text-danger" : undefined}>
            {t("nextCheckin", { date: formatDate(placement.nextCheckinDue) })}
          </span>
        ) : null}
      </div>
      {placement.notes ? <p className="text-[13px] text-ink/70">{placement.notes}</p> : null}

      <div className="flex flex-col gap-2">
        <h3 className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink/55">{tCheckins("title")}</h3>
        {placement.checkins.length === 0 ? (
          <p className="text-sm text-ink/60">{tCheckins("empty")}</p>
        ) : (
          <ul className="flex flex-col">
            {placement.checkins.map((checkin) => (
              <li
                key={checkin.id}
                className="flex items-center gap-3 border-b border-ink/7 py-2 last:border-0"
              >
                <span className="w-[84px] flex-none font-mono text-[11.5px] text-ink/60">
                  {formatDate(checkin.occurredOn)}
                </span>
                <StatusPill>{tTypes(checkin.type)}</StatusPill>
                <span className="min-w-0 flex-1 text-[13px] text-ink/75">{checkin.notes ?? ""}</span>
                <DeleteRowButton
                  endpoint={`/api/admin/foster-placements/${placement.id}/checkins/${checkin.id}`}
                  label={tCheckins("delete")}
                  confirmMessage={tCheckins("deleteConfirm")}
                  iconOnly
                />
              </li>
            ))}
          </ul>
        )}
        <FosterCheckinForm placementId={placement.id} />
      </div>

      <details className="rounded-[9px] border border-ink/10 bg-ink/[0.02] p-[10px_14px]">
        <summary className="cursor-pointer text-[13px] font-bold">{tEnd("title")}</summary>
        <div className="flex flex-col gap-4 pt-3.5">
          <EndFosterPlacementForm placementId={placement.id} />
          <div className="border-t border-ink/10 pt-3">
            <DeleteRowButton
              endpoint={`/api/admin/foster-placements/${placement.id}`}
              label={t("delete")}
              confirmMessage={t("deleteConfirm")}
            />
          </div>
        </div>
      </details>
    </div>
  );
}
