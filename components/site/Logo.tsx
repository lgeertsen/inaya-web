import { getTranslations } from "next-intl/server";
import Image from "next/image";

// Intrinsic size of public/logo.png (not square).
const LOGO_WIDTH = 2152;
const LOGO_HEIGHT = 1993;

type LogoProps = {
  size?: number;
  showTagline?: boolean;
  variant?: "dark" | "light";
};

export async function Logo({ size = 46, showTagline = true, variant = "dark" }: LogoProps) {
  const common = await getTranslations("common");

  return (
    <span className="flex items-center gap-3">
      <Image
        src="/logo.png"
        alt=""
        width={Math.round((size * LOGO_WIDTH) / LOGO_HEIGHT)}
        height={size}
        style={{ width: "auto", height: size }}
        className={variant === "light" ? "invert" : undefined}
        priority
      />
      <span className="flex flex-col leading-tight">
        <span
          className={`font-display font-extrabold text-[19px] ${
            variant === "light" ? "text-white" : "text-ink"
          }`}
        >
          {common("appName")}
        </span>
        {showTagline && (
          <span className="text-[11.5px] uppercase tracking-[0.14em] opacity-55">
            {common("tagline")}
          </span>
        )}
      </span>
    </span>
  );
}
