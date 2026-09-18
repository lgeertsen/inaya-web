import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";

interface PriceRow {
  label: string;
  note: string;
  price: string;
}

function PriceTable({ rows }: { rows: PriceRow[] }) {
  return (
    <table className="w-full text-[15px]">
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-ink/10 last:border-0">
            <td className="py-2.5 font-bold">{row.label}</td>
            <td className="py-2.5 opacity-60 italic">{row.note}</td>
            <td className="py-2.5 text-right font-bold text-accent">{row.price}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function AdoptPage() {
  const t = await getTranslations("adopt");
  const steps = t.raw("steps") as string[];
  const dogRows = t.raw("dogRows") as PriceRow[];
  const catRows = t.raw("catRows") as PriceRow[];

  return (
    <Container className="py-16 flex flex-col gap-12 max-w-[860px]!">
      <div className="flex flex-col gap-3">
        <h1 className="text-[clamp(32px,4.5vw,52px)] leading-[1.05]">{t("title")}</h1>
        <p className="text-[17px] opacity-75">{t("intro")}</p>
      </div>

      <Card className="p-6 sm:p-9 hover:shadow-card hover:translate-y-0">
        <h2 className="text-2xl mb-5">{t("procedureTitle")}</h2>
        <ol className="flex flex-col gap-4 list-decimal pl-5 text-[15.5px] leading-relaxed opacity-85">
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </Card>

      <Card className="p-6 sm:p-9 hover:shadow-card hover:translate-y-0">
        <h2 className="text-2xl mb-5">{t("pricingTitle")}</h2>
        <div className="flex flex-col gap-8">
          <div>
            <PriceTable rows={dogRows} />
            <p className="text-[13.5px] opacity-60 italic mt-3">{t("dogPricingNote")}</p>
          </div>
          <div>
            <PriceTable rows={catRows} />
            <p className="text-[13.5px] opacity-60 italic mt-3">{t("catPricingNote")}</p>
          </div>
        </div>
        <p className="text-[15px] mt-6 opacity-85">{t("unsterilizedNote")}</p>
        <p className="text-[15px] mt-4 opacity-85">
          <Link href="/adopt/calicivirus" className="text-accent font-bold hover:underline">
            {t("calicivirus.title")}
          </Link>
        </p>
      </Card>
    </Container>
  );
}
