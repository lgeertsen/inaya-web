"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";

export function RetrySyncButton({ visitId, label }: { visitId: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/admin/vet-visits/${visitId}/retry-sync`, { method: "POST" });
    setLoading(false);
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || pending}
      className="px-3 py-1.5 rounded-pill border border-ink/15 text-sm font-bold hover:bg-ink/5"
    >
      {label}
    </button>
  );
}
