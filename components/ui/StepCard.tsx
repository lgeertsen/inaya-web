import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface StepCardProps {
  /** Large numeral shown in the display font. Use `icon` instead when the title already carries its own number. */
  number?: number;
  icon?: LucideIcon;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function StepCard({ number, icon: Icon, title, children, className = "" }: StepCardProps) {
  return (
    <Card className={`p-6 sm:p-7 flex flex-col gap-3 hover:shadow-card hover:translate-y-0 ${className}`}>
      {number !== undefined && (
        <span aria-hidden className="font-display font-extrabold text-[40px] leading-none text-accent">
          {String(number).padStart(2, "0")}
        </span>
      )}
      {Icon && (
        <span
          aria-hidden
          className="grid size-11 place-items-center rounded-full bg-accent-bg text-accent"
        >
          <Icon size={20} strokeWidth={1.75} />
        </span>
      )}
      {title && <h3 className="text-lg">{title}</h3>}
      <div className="text-[15px] leading-relaxed opacity-80">{children}</div>
    </Card>
  );
}
