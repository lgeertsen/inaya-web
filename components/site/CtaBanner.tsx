import type { ReactNode } from "react";

const tones = {
  accent: { panel: "bg-accent text-white", title: "text-white", text: "text-white/90" },
  dark: { panel: "bg-ink text-white", title: "text-white", text: "text-white/80" },
} as const;

interface CtaBannerProps {
  title: string;
  /** Supporting copy, or richer content such as a bank-details block. */
  text?: ReactNode;
  tone?: keyof typeof tones;
  /** Buttons, shown on the right on wide screens. */
  children?: ReactNode;
}

export function CtaBanner({ title, text, tone = "accent", children }: CtaBannerProps) {
  const styles = tones[tone];
  return (
    <div
      className={`${styles.panel} rounded-panel p-6 sm:p-12 flex flex-wrap items-center gap-8`}
    >
      <div className="flex-1 min-w-[min(100%,280px)] basis-[420px] flex flex-col gap-3.5">
        <h2 className={`text-[clamp(26px,3.4vw,40px)] leading-[1.08] ${styles.title}`}>{title}</h2>
        {text && (
          <div className={`text-[16.5px] leading-relaxed max-w-[58ch] ${styles.text}`}>{text}</div>
        )}
      </div>
      {children && (
        <div className="flex-none max-w-full flex flex-wrap gap-3 w-full sm:w-auto">{children}</div>
      )}
    </div>
  );
}
