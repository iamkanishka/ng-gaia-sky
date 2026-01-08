/**
 * Absolute magnitude from apparent magnitude and distance
 *
 * M = m - 5 log10(d) + 5
 */
export function absoluteMagnitude(
  apparentMag: number,
  distancePc: number
): number {
  return apparentMag - 5 * Math.log10(distancePc) + 5;
}

/**
 * Apparent magnitude from absolute magnitude and distance
 *
 * m = M + 5 log10(d) - 5 + A
 * (A = extinction, added later)
 */
export function apparentMagnitude(
  absoluteMag: number,
  distancePc: number,
  extinction = 0
): number {
  return absoluteMag + 5 * Math.log10(distancePc) - 5 + extinction;
}

/**
 * Convert magnitude to relative flux
 *
 * F ∝ 10^(-0.4 m)
 */
export function fluxFromMagnitude(
  apparentMag: number
): number {
  return Math.pow(10, -0.4 * apparentMag);
}
