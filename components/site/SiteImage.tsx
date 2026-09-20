import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { IMAGE_ASPECTS, ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { getSiteImageSlot, getSiteImages, type SiteImageSlotId } from "@/lib/site-images";

interface SiteImageProps {
  slot: SiteImageSlotId;
  /** Short description of the photo; used as its `alt` text, and as the caption while no photo is uploaded. */
  label: string;
  /** Placeholder-only: shown until an admin uploads a photo for this slot. */
  icon?: LucideIcon;
  tone?: "grey" | "pink";
  align?: "center" | "top";
  /** Drop the rounded corners, for use inside a card that clips its own edges. */
  flat?: boolean;
  className?: string;
}

// `next/image` with `fill` needs a positioned parent, but a caller that already
// positions the frame (e.g. `absolute inset-0` for a backdrop) must keep its own.
const POSITIONED = /(^|\s)(absolute|fixed|sticky|relative)(\s|$)/;

/**
 * A photo the admin can upload from /admin/images, in the exact box the page
 * reserved for it. Until one is uploaded it renders the `ImagePlaceholder`, so
 * pages look the same as before with no uploads.
 */
export async function SiteImage({
  slot,
  label,
  icon,
  tone,
  align,
  flat = false,
  className = "",
}: SiteImageProps) {
  const definition = getSiteImageSlot(slot);
  const aspect = definition && definition.aspect !== "fill" ? definition.aspect : undefined;
  const image = (await getSiteImages())[slot];

  if (!image) {
    return <ImagePlaceholder label={label} aspect={aspect} icon={icon} tone={tone} align={align} flat={flat} className={className} />;
  }

  return (
    <div
      className={`overflow-hidden ${POSITIONED.test(className) ? "" : "relative"} ${flat ? "" : "rounded-2xl"} ${
        aspect ? IMAGE_ASPECTS[aspect] : ""
      } ${className}`}
    >
      <Image
        src={image.url}
        alt={label}
        fill
        sizes={definition?.sizes}
        loading={definition?.eager ? "eager" : undefined}
        fetchPriority={definition?.eager ? "high" : undefined}
        className="object-cover"
        style={{ objectPosition: `${image.focalX * 100}% ${image.focalY * 100}%` }}
      />
    </div>
  );
}
