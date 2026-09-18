/** Shared formatting helpers used across the app. */

export function computeAge(birthYear: number | null, birthMonth: number | null): number | null {
  if (!birthYear) return null;
  const now = new Date();
  let age = now.getFullYear() - birthYear;
  if (birthMonth && now.getMonth() + 1 < birthMonth) age -= 1;
  return age;
}

/** Formats a cent amount as a locale-aware EUR string, e.g. 4250 -> "42,50 €". */
export function formatCents(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(cents / 100);
}

/**
 * Formats a past ISO timestamp as a short relative string ("il y a 2 jours" /
 * "2 days ago"), locale-aware. Used for volunteer "last activity" display.
 */
export function formatRelativeDate(iso: string, locale: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) return rtf.format(0, "hour");
    return rtf.format(diffHours, "hour");
  }
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  return rtf.format(diffMonths, "month");
}

/**
 * Derives display initials from an email address, e.g. "lea.m@inaya.farm" ->
 * "LM", "sophie@inaya.farm" -> "SO". Volunteer/admin accounts have no
 * separate display-name field, so email is the only identity we can show.
 */
export function getInitialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const segments = local.split(/[.\-_]/).filter(Boolean);
  if (segments.length >= 2) {
    return (segments[0][0] + segments[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}
