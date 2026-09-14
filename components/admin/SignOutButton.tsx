"use client";

import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ label }: { label: string }) {
  const locale = useLocale();

  async function handleClick() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}/admin/login`;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-sm font-bold text-ink/60 hover:text-accent"
    >
      {label}
    </button>
  );
}
