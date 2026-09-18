"use client";

import { useState, useTransition } from "react";
import { RotateCw, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { AdminButton } from "./ui/AdminButton";

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
    <AdminButton size="xs" onClick={handleClick} disabled={loading || pending}>
      {loading || pending ? <Loader2 size={13} className="animate-spin" /> : <RotateCw size={13} />}
      {label}
    </AdminButton>
  );
}
