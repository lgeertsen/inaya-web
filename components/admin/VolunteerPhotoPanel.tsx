import { getTranslations } from "next-intl/server";
import type { Animal } from "@/lib/animals";
import { AdminLabel } from "@/components/admin/ui/AdminField";
import { PhotoUploader } from "./PhotoUploader";

export async function VolunteerPhotoPanel({ animal }: { animal: Animal }) {
  const t = await getTranslations("admin.animals.form");

  return (
    <div className="flex max-w-4xl flex-col gap-5 rounded-admin border border-ink/10 bg-surface p-[18px]">
      <dl className="grid grid-cols-2 gap-3.5 text-[13px]">
        <div>
          <dt className="text-ink/55">{t("species")}</dt>
          <dd className="font-bold">{animal.species}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3">
        <AdminLabel>{t("photos")}</AdminLabel>
        <PhotoUploader
          animalId={animal.id}
          photos={animal.photos}
          uploadLabel={t("uploadPhoto")}
          removeLabel={t("removePhoto")}
          setCoverLabel={t("setCover")}
          coverBadgeLabel={t("coverBadge")}
          setFocalPointLabel={t("setFocalPoint")}
          focalPointInstructions={t("focalPointInstructions")}
          saveFocalPointLabel={t("saveFocalPoint")}
          cancelFocalPointLabel={t("cancelFocalPoint")}
          canManage={false}
        />
      </div>
    </div>
  );
}
