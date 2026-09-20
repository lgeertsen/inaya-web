import { Check } from "lucide-react";

interface IconListProps {
  items: string[];
  /** `check` shows a tick, `numbered` shows the item's position. */
  variant?: "check" | "numbered";
  /** Use a white badge when the list sits on a tinted (accent-bg) surface. */
  onTint?: boolean;
  className?: string;
}

export function IconList({ items, variant = "check", onTint = false, className = "" }: IconListProps) {
  return (
    <ul className={`flex flex-col gap-3.5 ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span
            aria-hidden
            className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-accent ${
              onTint ? "bg-white" : "bg-accent-bg"
            }`}
          >
            {variant === "check" ? (
              <Check size={14} strokeWidth={3} />
            ) : (
              <span className="text-[11px] font-bold">{i + 1}</span>
            )}
          </span>
          <span className="text-[15.5px] leading-relaxed opacity-85">{item}</span>
        </li>
      ))}
    </ul>
  );
}
