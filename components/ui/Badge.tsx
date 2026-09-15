import { HTMLAttributes } from "react";

const tones = {
  accent: "bg-accent text-white",
  ink: "bg-ink text-white",
  outline: "border border-ink/20 text-ink",
  neutral: "bg-ink/10 text-ink/60",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof tones;
}

export function Badge({ tone = "accent", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-pill px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
