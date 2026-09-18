import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listInShelterStatuses } from "@/lib/animal-care";
import { countUpcomingVetVisits } from "@/lib/vet-visits";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const role = await getPageRole();
  const supabase = await createClient();

  // The animals nav badge tracks the /admin/animals page, which only lists
  // animals currently at the shelter (same as what volunteers see).
  const [{ data: userData }, animalCount, upcomingVisitCount] = await Promise.all([
    supabase.auth.getUser(),
    listInShelterStatuses(supabase).then((statuses) => Object.values(statuses).filter(Boolean).length),
    role === "admin" ? countUpcomingVetVisits(supabase, new Date().toISOString()) : Promise.resolve(0),
  ]);

  return (
    <AdminShell
      role={role}
      email={userData.user?.email ?? null}
      animalCount={animalCount}
      upcomingVisitCount={upcomingVisitCount}
    >
      {children}
    </AdminShell>
  );
}
