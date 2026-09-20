import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

const tones = {
  plain: "",
  surface: "bg-surface rounded-panel shadow-card p-6 sm:p-12",
  accent: "bg-accent-bg rounded-panel p-6 sm:p-12",
} as const;

interface SectionProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  /** `surface` and `accent` wrap the section in a rounded panel; `plain` sits on the page background. */
  tone?: keyof typeof tones;
  className?: string;
  children?: ReactNode;
}

/** Full-width page section with Home's vertical rhythm and an optional eyebrow/title/intro header. */
export function Section({ eyebrow, title, intro, tone = "plain", className = "", children }: SectionProps) {
  const hasHeader = eyebrow || title || intro;
  return (
    <section className={`pt-20 ${className}`}>
      <Container>
        <div className={`flex flex-col gap-8 ${tones[tone]}`}>
          {hasHeader && (
            <div className="max-w-[680px] flex flex-col gap-3">
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              {title && <h2 className="text-[clamp(28px,3.6vw,42px)] leading-[1.06]">{title}</h2>}
              {intro && <p className="text-[16.5px] leading-relaxed opacity-72">{intro}</p>}
            </div>
          )}
          {children}
        </div>
      </Container>
    </section>
  );
}
