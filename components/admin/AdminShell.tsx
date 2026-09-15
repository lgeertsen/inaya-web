"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { AdminSidebar } from "./AdminSidebar";
import type { Role } from "@/lib/auth";

export function AdminShell({ children, role }: { children: ReactNode; role: Role | null }) {
  const pathname = usePathname();
  const isLogin = pathname.endsWith("/admin/login");

  if (isLogin) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <AdminSidebar role={role} />
      <main className="min-w-0 flex-1">
        <Container className="py-8 lg:py-10">{children}</Container>
      </main>
    </div>
  );
}
