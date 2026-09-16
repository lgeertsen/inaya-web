import { getTranslations } from "next-intl/server";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export default async function AdminProfilePage() {
  const t = await getTranslations("admin.profile");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl">{t("title")}</h1>
      <ChangePasswordForm />
    </div>
  );
}
