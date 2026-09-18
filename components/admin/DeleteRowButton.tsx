"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

export function DeleteRowButton({
  endpoint,
  label,
  confirmMessage,
  iconOnly = false,
}: {
  endpoint: string;
  label: string;
  confirmMessage: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    await fetch(endpoint, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  const icon = pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />;

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        title={label}
        aria-label={label}
        className="inline-flex items-center rounded-[7px] border border-ink/14 bg-surface p-[7px] text-ink/50 transition-colors hover:border-danger hover:text-danger disabled:opacity-60"
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-[7px] border border-ink/14 bg-surface px-2.5 py-[5px] text-[12px] font-bold text-ink/70 transition-colors hover:border-danger hover:text-danger disabled:opacity-60"
    >
      {icon}
      {label}
    </button>
  );
}
