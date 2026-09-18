/**
 * Diagonal-stripe placeholder swatch shown wherever an animal has no photo
 * yet (list rows, detail header, overview recent-arrivals) — matches the
 * redesign's mockup pattern.
 */
export function PhotoPlaceholder({ size = 30, rounded = 8 }: { size?: number; rounded?: number }) {
  return (
    <span
      className="block flex-none border border-ink/8"
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background:
          "repeating-linear-gradient(135deg, #eceae7 0 5px, #f6f5f3 5px 10px)",
      }}
    />
  );
}
