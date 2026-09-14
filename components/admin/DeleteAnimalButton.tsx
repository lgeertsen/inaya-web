"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";

export function DeleteAnimalButton({
  animalId,
  label,
  confirmMessage,
}: {
  animalId: string;
  label: string;
  confirmMessage: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    await fetch(`/api/admin/animals/${animalId}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="font-bold text-ink/50 hover:text-accent"
    >
      {label}
    </button>
  );
}
