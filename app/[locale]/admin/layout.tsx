import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPageRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const role = await getPageRole();
  return <AdminShell role={role}>{children}</AdminShell>;
}
