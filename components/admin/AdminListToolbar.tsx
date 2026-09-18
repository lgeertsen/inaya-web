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
    <div className="relative w-full max-w-[220px]">
      <Search
        size={14}
        className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-ink/40"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[9px] border border-ink/14 bg-surface py-2 pl-[30px] pr-3 text-[12.5px] text-ink outline-none placeholder:text-ink/40 focus:border-accent"
      />
    </div>
  );
}
