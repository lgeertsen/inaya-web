import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnimalById } from "@/lib/animals";
import { getUserEmailsByIds } from "@/lib/accounts";
import { PhotoUploader } from "@/components/admin/PhotoUploader";

export default async function AnimalPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const { id } = await params;
  const supabase = await createClient();
  const animal = await getAnimalById(supabase, id);
  if (!animal) notFound();

  const uploaderIds = [...new Set(animal.photos.map((p) => p.uploadedBy).filter((v): v is string => !!v))];
  const uploaderEmails = await getUserEmailsByIds(createAdminClient(), uploaderIds);
  const photos = animal.photos.map((photo) => ({
    ...photo,
    uploadedByName: photo.uploadedBy ? uploaderEmails.get(photo.uploadedBy) ?? null : null,
  }));

  const t = await getTranslations("admin.animals.form");

  return (
    <div className="rounded-admin border border-ink/10 bg-surface p-[18px]">
      <PhotoUploader
        animalId={animal.id}
        photos={photos}
        uploadLabel={t("uploadPhoto")}
        removeLabel={t("removePhoto")}
        setCoverLabel={t("setCover")}
        coverBadgeLabel={t("coverBadge")}
        setFocalPointLabel={t("setFocalPoint")}
        focalPointInstructions={t("focalPointInstructions")}
        saveFocalPointLabel={t("saveFocalPoint")}
        cancelFocalPointLabel={t("cancelFocalPoint")}
        uploadedByLabel={t("uploadedBy")}
        canManage
      />
    </div>
  );
}
