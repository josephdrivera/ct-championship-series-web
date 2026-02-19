/**
 * Rounds a points value to at most 2 decimal places,
 * stripping unnecessary trailing zeros (e.g. 250.00 → "250", 208.167 → "208.17").
 */
export function formatPoints(pts: number): string {
  return parseFloat(pts.toFixed(2)).toString();
}
