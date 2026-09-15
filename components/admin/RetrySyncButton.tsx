"use client";

import { useState, useTransition } from "react";
import { RotateCw, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

export function RetrySyncButton({ endpoint, label }: { endpoint: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(endpoint, { method: "POST" });
    setLoading(false);
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || pending}
      className="inline-flex items-center gap-1.5 rounded-pill border border-ink/15 px-3 py-1.5 text-sm font-bold hover:bg-ink/5 disabled:opacity-60"
    >
      {loading || pending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <RotateCw size={14} />
      )}
      {label}
    </button>
  );
}
