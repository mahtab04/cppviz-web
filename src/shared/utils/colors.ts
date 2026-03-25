/**
 * Generate a stable HSL color for field index `i` (out of `total` fields).
 * Padding and vtable have dedicated colors.
 */
export function fieldColor(
  fieldName: string,
  isPadding: boolean,
  index: number,
  total: number
): string {
  if (isPadding) return "rgba(239 ,68, 68, 0.35)"; // red
  if (fieldName === "__vtable_ptr") return "rgba(107, 114, 128, 0.5)"; // gray

  const hue = (index * 360) / Math.max(total, 1);
  return `hsla(${hue}, 70%, 55%, 0.5)`;
}

export function fieldColorSolid(
  fieldName: string,
  isPadding: boolean,
  index: number,
  total: number
): string {
  if (isPadding) return "#ef4444";
  if (fieldName === "__vtable_ptr") return "#6b7280";

  const hue = (index * 360) / Math.max(total, 1);
  return `hsl(${hue}, 70%, 55%)`;
}
