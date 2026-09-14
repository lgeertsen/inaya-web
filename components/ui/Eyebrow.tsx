import { HTMLAttributes } from "react";

export function Eyebrow({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`font-mono text-[12.5px] uppercase tracking-[0.18em] text-accent ${className}`}
      {...props}
    />
  );
}
