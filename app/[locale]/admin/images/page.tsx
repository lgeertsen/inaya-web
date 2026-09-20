import { getLocale, getTranslations } from "next-intl/server";
import { getPathname, redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { formatRelativeDate } from "@/lib/format";
import { SITE_IMAGE_SLOTS, getSiteImages } from "@/lib/site-images";
import { getTextPage } from "@/lib/site-text-pages";
import { AdminPage } from "@/components/admin/AdminPage";
import {
  SiteImageManager,
  type SiteImageGroupView,
} from "@/components/admin/SiteImageManager";

export default async function AdminImagesPage() {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const [t, tNav, tTexts, messages, images] = await Promise.all([
    getTranslations("admin.images"),
    getTranslations("admin.nav"),
    getTranslations("admin.texts"),
    // Root translator: slot captions are addressed by their full message key.
    getTranslations(),
    getSiteImages(),
  ]);

  const groups: SiteImageGroupView[] = [];
  for (const slot of SITE_IMAGE_SLOTS) {
    let group = groups.find((candidate) => candidate.pageId === slot.page);
    if (!group) {
      const page = getTextPage(slot.page);
      group = {
        pageId: slot.page,
        pageName: tTexts(`pages.${slot.page}.name`),
        pagePath: page ? getPathname({ href: page.route, locale }) : "/",
        slots: [],
      };
      groups.push(group);
    }
    const image = images[slot.id];
    group.slots.push({
      id: slot.id,
      label: messages(slot.labelKey),
      shape: t(`shape.${slot.aspect}`),
      image: image
        ? {
            url: image.url,
            focalX: image.focalX,
            focalY: image.focalY,
            updatedLabel: t("updated", { when: formatRelativeDate(image.updatedAt, locale) }),
          }
        : null,
    });
  }

  return (
    <AdminPage
      title={tNav("images")}
      meta={t("meta", { filled: Object.keys(images).length, total: SITE_IMAGE_SLOTS.length })}
    >
      <p className="max-w-[760px] text-[13.5px] leading-relaxed text-ink/65">{t("intro")}</p>
      <SiteImageManager
        groups={groups}
        labels={{
          empty: t("empty"),
          upload: t("upload"),
          replace: t("replace"),
          uploading: t("uploading"),
          focalPoint: t("focalPoint"),
          focalPointInstructions: t("focalPointInstructions"),
          saveFocalPoint: t("saveFocalPoint"),
          cancelFocalPoint: t("cancelFocalPoint"),
          remove: t("remove"),
          confirmRemove: t("confirmRemove"),
          viewPage: t("viewPage"),
          errors: {
            file_too_large: t("errors.file_too_large"),
            invalid_image: t("errors.invalid_image"),
            generic: t("errors.generic"),
          },
        }}
      />
    </AdminPage>
  );
}
