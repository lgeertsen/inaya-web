import { ButtonHTMLAttributes, AnchorHTMLAttributes, ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-bold text-[14.5px] px-6 py-3.5 transition-colors";

const variants = {
  primary: "bg-accent text-white shadow-[0_6px_18px_rgba(223,23,203,0.28)] hover:bg-accent-hover",
  dark: "bg-ink text-white hover:bg-accent",
  outline: "border-[1.5px] border-ink/25 text-ink hover:bg-ink hover:text-white hover:border-ink",
  outlineLight: "border-[1.5px] border-white/60 text-white hover:bg-white/15",
  light: "bg-white text-accent hover:bg-ink hover:text-white",
  ghost: "text-ink hover:text-accent",
};

type Variant = keyof typeof variants;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

interface ButtonAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
}

/** Plain `<a>` styled as a button, for external and `tel:`/`mailto:` links that must not be locale-prefixed. */
export function ButtonAnchor({ variant = "primary", className = "", ...props }: ButtonAnchorProps) {
  return <a className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

interface ButtonLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: ComponentProps<typeof Link>["href"];
  variant?: Variant;
}

export function ButtonLink({ href, variant = "primary", className = "", ...props }: ButtonLinkProps) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}
