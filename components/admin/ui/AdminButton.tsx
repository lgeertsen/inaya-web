import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Admin-only button styling — the redesign uses small rounded-rect buttons
 * (9px radius, compact padding) rather than the public site's pill-shaped
 * `components/ui/Button`. Keeping this separate avoids changing the public
 * site's buttons.
 */
const sizes = {
  md: "gap-[7px] rounded-[9px] px-3.5 py-2.5 text-[13px]",
  sm: "gap-[6px] rounded-[8px] px-[11px] py-[7px] text-[12.5px]",
  xs: "gap-[5px] rounded-[7px] px-2.5 py-[5px] text-[12px]",
} as const;

const variants = {
  dark: "border-none bg-ink text-white hover:bg-accent",
  outline: "border border-ink/14 bg-surface text-ink hover:border-ink",
  "outline-danger": "border border-ink/14 bg-surface text-ink/70 hover:border-danger hover:text-danger",
} as const;

const base = "inline-flex items-center justify-center font-bold cursor-pointer transition-colors";

type Size = keyof typeof sizes;
type Variant = keyof typeof variants;

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size;
  variant?: Variant;
}

export function AdminButton({
  size = "md",
  variant = "outline",
  className = "",
  type = "button",
  ...props
}: AdminButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

interface AdminButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  size?: Size;
  variant?: Variant;
}

export function AdminButtonLink({
  href,
  size = "md",
  variant = "outline",
  className = "",
  ...props
}: AdminButtonLinkProps) {
  return (
    <Link href={href} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
  );
}
