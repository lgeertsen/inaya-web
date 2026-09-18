import { getTranslations } from "next-intl/server";
import { AdminPage } from "@/components/admin/AdminPage";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { StatusPill } from "@/components/admin/ui/StatusPill";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar";

export default async function AdminProfilePage() {
  const t = await getTranslations("admin.profile");
  const tNav = await getTranslations("admin.nav");
  const role = await getPageRole();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const calendarConnected = isGoogleCalendarConfigured();

  return (
    <AdminPage title={t("title")} meta={user?.email ?? ""}>
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3.5 rounded-admin border border-ink/10 bg-surface p-[18px]">
          <h2 className="text-[14.5px]">{t("title")}</h2>
          <ChangePasswordForm />
        </div>

        <div className="flex flex-col gap-3.5 rounded-admin border border-ink/10 bg-surface p-[18px]">
          <h2 className="text-[14.5px]">{t("session.title")}</h2>
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between gap-3 border-b border-ink/7 pb-2.5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink/55">
                {t("session.email")}
              </span>
              <span className="text-[12.5px] font-semibold">{user?.email}</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-ink/7 pb-2.5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink/55">
                {t("session.role")}
              </span>
              <span className="text-[12.5px] font-semibold">
                {role === "admin" ? tNav("roleAdmin") : tNav("roleVolunteer")}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-b border-ink/7 pb-2.5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink/55">
                {t("session.language")}
              </span>
              <span className="text-[12.5px] font-semibold">{t("session.languageValue")}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink/55">
                {t("session.calendar")}
              </span>
              <StatusPill tone={calendarConnected ? "success" : "neutral"}>
                {calendarConnected ? t("session.calendarConnected") : t("session.calendarNotConfigured")}
              </StatusPill>
            </div>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
