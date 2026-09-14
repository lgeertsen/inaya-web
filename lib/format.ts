export function computeAge(birthYear: number | null, birthMonth: number | null): number | null {
  if (!birthYear) return null;
  const now = new Date();
  let age = now.getFullYear() - birthYear;
  if (birthMonth && now.getMonth() + 1 < birthMonth) age -= 1;
  return age;
}
