"use client";

import { useLocale } from "next-intl";
import { LogOut } from "lucide-react";
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
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/70 transition-colors hover:bg-sidebar-hover hover:text-white"
    >
      <LogOut size={18} strokeWidth={2} />
      {label}
    </button>
  );
}
