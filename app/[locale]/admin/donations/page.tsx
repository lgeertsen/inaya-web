import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

interface DonationRow {
  id: string;
  created_at: string;
  donor_name: string | null;
  donor_email: string | null;
  amount_cents: number;
  frequency: string;
  status: string;
}

export default async function AdminDonationsPage() {
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
        <div className="bg-surface rounded-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-ink/10">
                <th className="p-4">{t("columns.date")}</th>
                <th className="p-4">{t("columns.donor")}</th>
                <th className="p-4">{t("columns.amount")}</th>
                <th className="p-4">{t("columns.frequency")}</th>
                <th className="p-4">{t("columns.status")}</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id} className="border-b border-ink/10 last:border-0">
                  <td className="p-4 whitespace-nowrap">
                    {new Date(donation.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">{donation.donor_name || donation.donor_email || "—"}</td>
                  <td className="p-4 whitespace-nowrap">
                    {(donation.amount_cents / 100).toFixed(2)} €
                  </td>
                  <td className="p-4">{donation.frequency}</td>
                  <td className="p-4">{donation.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
