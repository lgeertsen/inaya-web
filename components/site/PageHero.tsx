import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  /** Buttons shown under the intro. */
  actions?: ReactNode;
  /** Photo (or placeholder) shown beside the text on wide screens, below it on narrow ones. */
  image?: ReactNode;
  className?: string;
}

export function PageHero({ eyebrow, title, intro, actions, image, className = "" }: PageHeroProps) {
  return (
    <section className={`pt-16 ${className}`}>
      <Container>
        <div
          className={`grid grid-cols-1 gap-10 items-center ${image ? "md:grid-cols-[1.1fr_1fr] md:gap-14" : ""}`}
        >
          <div className={`flex flex-col gap-5 ${image ? "" : "max-w-[760px]"}`}>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h1 className="text-[clamp(34px,5vw,58px)] leading-[1.03]">{title}</h1>
            {intro && (
              <p className="text-[17px] leading-relaxed opacity-78 max-w-[62ch]">{intro}</p>
            )}
            {actions && <div className="flex flex-wrap gap-3 mt-1">{actions}</div>}
          </div>
          {image}
        </div>
      </Container>
    </section>
  );
}
