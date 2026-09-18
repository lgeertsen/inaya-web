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
  accentBg: "#fdeafb",

  // Semantic status colors — additive, admin-dashboard use only (badges,
  // sync/donation/animal status). Do not repurpose the brand colors above.
  success: "#1e8a5f",
  successBg: "#e4f5ec",
  warning: "#b8770e",
  warningBg: "#fbeed6",
  danger: "#c22b3f",
  dangerBg: "#fbe4e7",

  // Admin sidebar tones — namespaced so they never shadow `ink` elsewhere.
  sidebar: "#1b1a1c",
  sidebarHover: "#2c282e",
  sidebarActive: "rgba(223, 23, 203, 0.18)",
  sidebarBorder: "rgba(255, 255, 255, 0.08)",
} as const;

/**
 * Admin-only overrides, sourced from the later "Inaya Admin Redesign"
 * mockup. Applied via the `.admin-scope` class in app/globals.css (scoped to
 * AdminShell), not the shared `@theme` block above — the public site keeps
 * `colors.background`/`colors.ink` as-is. Every other token (accent,
 * success/warning/danger, sidebarHover/Active) is unchanged between the two
 * mockups and stays defined once, above.
 */
export const adminColors = {
  background: "#f4f3f1",
  ink: "#17161a",
  sidebar: "#17161a",
  sidebarBorder: "rgba(255, 255, 255, 0.08)",
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
