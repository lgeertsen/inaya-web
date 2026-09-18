"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type Status = "idle" | "sending" | "sent" | "error";

const housingTypeKeys = ["house_garden", "apartment", "farm", "other"] as const;

export function FosterFamilyForm() {
  const t = useTranslations("fosterFamily");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      city: String(data.get("city") ?? ""),
      housingType: String(data.get("housingType") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    setStatus("sending");

    try {
      const response = await fetch("/api/foster-family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-ink text-white rounded-panel p-6 sm:p-10 flex flex-col gap-4"
    >
      <h3 className="text-[clamp(22px,2.6vw,28px)] text-white">{t("formTitle")}</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        <Input dark name="firstName" placeholder={t("firstNamePlaceholder")} required />
        <Input dark name="lastName" placeholder={t("lastNamePlaceholder")} required />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        <Input dark type="email" name="email" placeholder={t("emailPlaceholder")} required />
        <Input dark type="tel" name="phone" placeholder={t("phonePlaceholder")} required />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        <Input dark name="city" placeholder={t("cityPlaceholder")} required />
        <Select dark name="housingType" defaultValue="" required>
          <option value="" disabled>
            {t("housingTypePlaceholder")}
          </option>
          {housingTypeKeys.map((key) => (
            <option key={key} value={key}>
              {t(`housingTypeOptions.${key}`)}
            </option>
          ))}
        </Select>
      </div>
      <Textarea dark name="message" rows={6} placeholder={t("messagePlaceholder")} required />
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? t("sending") : t("submit")}
      </Button>
      {status === "sent" ? (
        <p className="text-[13px] text-accent-light">✓ {t("sentMessage")}</p>
      ) : status === "error" ? (
        <p className="text-[13px] text-red-400">{t("errorMessage")}</p>
      ) : null}
    </form>
  );
}
