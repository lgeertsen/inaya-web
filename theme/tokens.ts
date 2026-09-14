/**
 * Design tokens sourced from the Claude Design mockup ("Inaya Redesign.dc.html").
 * These are mirrored into Tailwind utility classes via the `@theme` block in
 * app/globals.css. Import from here only when raw values are needed outside
 * Tailwind (e.g. inline SVG, email templates) — everywhere else, prefer the
 * generated utility classes (bg-accent, text-ink, font-display, ...).
 */
export const colors = {
  background: "#e8e7e8",
  surface: "#ffffff",
  ink: "#1b1a1c",
  accent: "#df17cb",
  accentHover: "#b00f9f",
  accentLight: "#ff7bee",
} as const;

export const fonts = {
  display: '"Bricolage Grotesque", Helvetica, sans-serif',
  sans: "Karla, Helvetica, Arial, sans-serif",
  mono: '"IBM Plex Mono", monospace',
} as const;

export const radii = {
  card: "22px",
  panel: "28px",
  pill: "999px",
} as const;

export const shadows = {
  card: "0 2px 10px rgba(27, 26, 28, 0.06)",
  cardHover: "0 14px 30px rgba(27, 26, 28, 0.14)",
} as const;
