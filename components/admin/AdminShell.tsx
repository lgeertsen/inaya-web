"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import type { Role } from "@/lib/auth";

interface AdminShellProps {
  children: ReactNode;
  role: Role | null;
  email: string | null;
  animalCount: number;
  upcomingVisitCount: number;
}

export function AdminShell({ children, role, email, animalCount, upcomingVisitCount }: AdminShellProps) {
  const pathname = usePathname();
  const isLogin = pathname.endsWith("/admin/login");

  if (isLogin) {
    return <div className="admin-scope min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="admin-scope min-h-screen bg-background lg:flex">
      <AdminSidebar
        role={role}
        email={email}
        animalCount={animalCount}
        upcomingVisitCount={upcomingVisitCount}
      />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
