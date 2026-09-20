import { Camera, type LucideIcon } from "lucide-react";

/** Also used by `SiteImage`, so an uploaded photo fills exactly the box its placeholder did. */
export const IMAGE_ASPECTS = {
  "1/1": "aspect-square",
  "5/4": "aspect-[5/4]",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "16/9": "aspect-video",
  "3/4": "aspect-[3/4]",
  "2/3": "aspect-[2/3]",
} as const;

export type ImageAspect = keyof typeof IMAGE_ASPECTS;

const aspects = IMAGE_ASPECTS;

const tones = {
  grey: "bg-[repeating-linear-gradient(135deg,#dedcdd_0_12px,#d5d3d4_12px_24px)]",
  pink: "bg-[radial-gradient(circle_at_50%_38%,#fdeefa,#f3eef2_55%,#e9e6e8)]",
} as const;

interface ImagePlaceholderProps {
  /** Short description of the photo that belongs here; doubles as the future `alt` text. */
  label: string;
  aspect?: ImageAspect;
  icon?: LucideIcon;
  tone?: keyof typeof tones;
  /** Pin the icon and label to the top instead of centering them (for backdrops with overlaid content). */
  align?: "center" | "top";
  /** Drop the rounded corners, for use inside a card that clips its own edges. */
  flat?: boolean;
  className?: string;
}

/** Stand-in for a photo that has not been supplied yet. Pages use `SiteImage`, which renders this until an admin uploads one. */
export function ImagePlaceholder({
  label,
  aspect,
  icon: Icon = Camera,
  tone = "grey",
  align = "center",
  flat = false,
  className = "",
}: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`flex justify-center overflow-hidden ${
        align === "top" ? "items-start pt-8" : "items-center"
      } ${flat ? "" : "rounded-2xl"} ${aspect ? aspects[aspect] : ""} ${tones[tone]} ${className}`}
    >
      <div className="flex flex-col items-center gap-2.5 px-4 text-center text-ink/70">
        <span className="grid place-items-center size-11 rounded-full bg-white/75">
          <Icon aria-hidden size={20} strokeWidth={1.75} />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] leading-snug max-w-[26ch]">
          {label}
        </span>
      </div>
    </div>
  );
}
