"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { AdminSelect } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import type { AnimalOption } from "@/lib/animals";

export function AddAnimalToVisitForm({
  visitId,
  animalOptions,
  label,
}: {
  visitId: string;
  animalOptions: AnimalOption[];
  label: string;
}) {
  const router = useRouter();
  const [animalId, setAnimalId] = useState(animalOptions[0]?.id ?? "");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!animalId) return;

    setPending(true);
    await fetch(`/api/admin/vet-visits/${visitId}/animals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animalId }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
      <AdminSelect value={animalId} onChange={(e) => setAnimalId(e.target.value)} className="max-w-xs">
        {animalOptions.map((animal) => (
          <option key={animal.id} value={animal.id}>
            {animal.name}
          </option>
        ))}
      </AdminSelect>
      <AdminButton type="submit" size="sm" disabled={pending}>
        {label}
      </AdminButton>
    </form>
  );
}
