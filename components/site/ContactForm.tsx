"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ContactForm({ recipientEmail }: { recipientEmail: string }) {
  const t = useTranslations("contact");
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const firstName = String(form.get("firstName") ?? "");
    const lastName = String(form.get("lastName") ?? "");
    const email = String(form.get("email") ?? "");
    const subject = String(form.get("subject") ?? "");
    const message = String(form.get("message") ?? "");

    const body = `${message}\n\n—\n${firstName} ${lastName}\n${email}`;
    const mailto = `mailto:${recipientEmail}?subject=${encodeURIComponent(
      `[Inaya.farm] ${subject}`,
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    setSent(true);
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
      <Button type="submit">{t("submit")}</Button>
      {sent ? (
        <p className="text-[13px] text-accent-light">✓ {t("appointmentNote")}</p>
      ) : (
        <span className="text-[12.5px] opacity-50 leading-relaxed">{t("appointmentNote")}</span>
      )}
    </form>
  );
}
