"use client";

import { Search } from "lucide-react";

export function AdminListToolbar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full max-w-xs">
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-ink/15 bg-white py-3 pl-10 pr-4 text-ink placeholder:text-ink/40 focus:outline-none focus:border-accent"
      />
    </div>
  );
}
