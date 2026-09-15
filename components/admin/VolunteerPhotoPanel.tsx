import { getTranslations } from "next-intl/server";
import type { Animal } from "@/lib/animals";
import { Label } from "@/components/ui/Field";
import { PhotoUploader } from "./PhotoUploader";

export async function VolunteerPhotoPanel({ animal }: { animal: Animal }) {
  const t = await getTranslations("admin.animals.form");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="opacity-60">{t("species")}</dt>
          <dd className="font-bold">{animal.species}</dd>
        </div>
        <div>
          <dt className="opacity-60">{t("status")}</dt>
          <dd className="font-bold">{animal.status}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3">
        <Label>{t("photos")}</Label>
        <PhotoUploader
          animalId={animal.id}
          photos={animal.photos}
          uploadLabel={t("uploadPhoto")}
          removeLabel={t("removePhoto")}
          setCoverLabel={t("setCover")}
          coverBadgeLabel={t("coverBadge")}
          canManage={false}
        />
      </div>
    </div>
  );
}
