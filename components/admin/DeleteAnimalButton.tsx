"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
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
      className="inline-flex items-center gap-1.5 font-bold text-ink/50 hover:text-danger disabled:opacity-60"
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
      {label}
    </button>
  );
}
