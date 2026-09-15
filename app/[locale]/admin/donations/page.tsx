import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DonationsTableClient, type DonationRow } from "@/components/admin/DonationsTableClient";

export default async function AdminDonationsPage() {
  const locale = await getLocale();
  const role = await getPageRole();
  if (role !== "admin") redirect({ href: "/admin/animals", locale });

  const t = await getTranslations("admin.donations");
  const supabase = await createClient();
  const { data: donations } = await supabase
    .from("donations")
    .select("id, created_at, donor_name, donor_email, amount_cents, frequency, status")
    .order("created_at", { ascending: false })
    .returns<DonationRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">{t("title")}</h1>

      {!donations || donations.length === 0 ? (
        <p className="opacity-60 text-sm">{t("empty")}</p>
      ) : (
        <DonationsTableClient donations={donations} />
      )}
    </div>
  );
}
