"use client";

import { useLocale } from "next-intl";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({
  label,
  iconOnly = false,
}: {
  label: string;
  iconOnly?: boolean;
}) {
  const locale = useLocale();

  async function handleClick() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}/admin/login`;
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={label}
        aria-label={label}
        className="flex flex-none rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/8 hover:text-white"
      >
        <LogOut size={16} strokeWidth={2} />
      </button>
    );
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
