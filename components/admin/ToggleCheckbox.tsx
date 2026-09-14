"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";

export function ToggleCheckbox({
  endpoint,
  field,
  checked,
}: {
  endpoint: string;
  field: string;
  checked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: event.target.checked }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <input
      type="checkbox"
      defaultChecked={checked}
      disabled={pending}
      onChange={handleChange}
    />
  );
}
