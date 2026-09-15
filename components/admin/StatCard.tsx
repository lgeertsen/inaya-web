import type { ComponentType } from "react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  href?: string;
  sublabel?: string;
}

export function StatCard({ label, value, icon: Icon, href, sublabel }: StatCardProps) {
  const content = (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink/50">
          {label}
        </span>
        <span className="font-display text-3xl">{value}</span>
        {sublabel ? <span className="text-sm text-ink/50">{sublabel}</span> : null}
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
