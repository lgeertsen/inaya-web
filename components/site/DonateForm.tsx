"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const PRESET_AMOUNTS = [10, 20, 50];

export function DonateForm({
  animalId,
  animalName,
}: {
  animalId?: string;
  animalName?: string | null;
}) {
  const t = useTranslations("donate");
  const locale = useLocale();
  const [amount, setAmount] = useState<number>(20);
  const [customAmount, setCustomAmount] = useState("");
  const [frequency, setFrequency] = useState<"one_time" | "monthly">("one_time");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const finalAmount = customAmount ? Number(customAmount) : amount;

    try {
      const res = await fetch("/api/donate/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, frequency, animalId, locale }),
      });

      if (!res.ok) {
        throw new Error("checkout_failed");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError("error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {animalName ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-accent/10 px-4 py-3">
          <span className="text-sm font-bold text-accent">
            {t("sponsorBanner", { name: animalName })}
          </span>
          <Link href="/donate" className="text-xs font-bold underline shrink-0">
            {t("switchToGeneral")}
          </Link>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-[11.5px] uppercase tracking-[0.12em] opacity-50 font-bold">
          {t("frequencyLabel")}
        </span>
        <div className="flex gap-2">
          {(["one_time", "monthly"] as const).map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => setFrequency(freq)}
              className={`px-5 py-2.5 rounded-pill font-bold text-sm border-[1.5px] transition-colors ${
                frequency === freq
                  ? "bg-ink text-white border-ink"
                  : "border-ink/20 text-ink hover:border-ink"
              }`}
            >
              {t(freq === "one_time" ? "oneTime" : "monthly")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11.5px] uppercase tracking-[0.12em] opacity-50 font-bold">
          {t("amountLabel")}
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAmount(preset);
                setCustomAmount("");
              }}
              className={`px-6 py-3 rounded-pill font-bold border-[1.5px] transition-colors ${
                !customAmount && amount === preset
                  ? "bg-accent text-white border-accent"
                  : "border-ink/20 text-ink hover:border-accent"
              }`}
            >
              {preset} €
            </button>
          ))}
        </div>
        <Input
          type="number"
          min={1}
          placeholder={t("customAmountLabel")}
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-accent">Une erreur est survenue. Réessayez.</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? "…" : t("submit")}
      </Button>
      <p className="text-[12.5px] opacity-50">{t("taxNote")}</p>
      <p className="text-[12px] opacity-40">{t("poweredBy")}</p>
    </form>
  );
}
