"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Field";
import type { AnimalOption } from "@/lib/animals";

export function AnimalMultiSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: AnimalOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => options.filter((o) => value.includes(o.id)), [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options
      .filter((o) => !value.includes(o.id))
      .filter((o) => (q ? o.name.toLowerCase().includes(q) : true));
  }, [options, value, query]);

  function addAnimal(id: string) {
    onChange([...value, id]);
    setQuery("");
  }

  function removeAnimal(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((animal) => (
            <span
              key={animal.id}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-pill bg-accent/10 text-accent"
            >
              {animal.name}
              <button
                type="button"
                onClick={() => removeAnimal(animal.id)}
                aria-label={`Remove ${animal.name}`}
                className="hover:text-ink"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <Input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && filtered.length > 0 ? (
          <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-ink/15 bg-white shadow-lg">
            {filtered.map((animal) => (
              <button
                key={animal.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addAnimal(animal.id)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-ink/5"
              >
                {animal.name}
                <span className="ml-2 text-xs opacity-50">{animal.species}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
