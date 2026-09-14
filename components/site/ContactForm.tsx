"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      email: String(data.get("email") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
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

  const subjectOptions = t.raw("subjectOptions") as string[];

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
      <Input dark type="email" name="email" placeholder={t("emailPlaceholder")} required />
      <Select dark name="subject" defaultValue="">
        <option value="" disabled>
          {t("subjectPlaceholder")}
        </option>
        {subjectOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
      <Textarea dark name="message" rows={6} placeholder={t("messagePlaceholder")} required />
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? t("sending") : t("submit")}
      </Button>
      {status === "sent" ? (
        <p className="text-[13px] text-accent-light">✓ {t("sentMessage")}</p>
      ) : status === "error" ? (
        <p className="text-[13px] text-red-400">{t("errorMessage")}</p>
      ) : (
        <span className="text-[12.5px] opacity-50 leading-relaxed">{t("appointmentNote")}</span>
      )}
    </form>
  );
}
