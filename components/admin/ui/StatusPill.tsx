import type { HTMLAttributes } from "react";

/**
 * Admin-only status/tag pill — mono uppercase, matching the redesign's
 * badges (vaccine due, publication state, donation status, ...). Distinct
 * from the public site's `components/ui/Badge` (sans-serif, different
 * padding) so that component's usage elsewhere is untouched.
 */
const tones = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  accent: "bg-accent-bg text-accent-hover",
  neutral: "bg-ink/6 text-ink/60",
} as const;

type Tone = keyof typeof tones;

interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function StatusPill({ tone = "neutral", className = "", ...props }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-[9px] py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
