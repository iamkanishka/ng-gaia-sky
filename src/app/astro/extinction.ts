/**
 * Interstellar dust density model
 * Dust scale height is much smaller than stars
 */
export function dustDensity(zPc: number): number {
  const H_DUST = 100; // pc
  return Math.exp(-Math.abs(zPc) / H_DUST);
}

/**
 * Extinction in magnitudes
 *
 * A_G ≈ k * distance * dustDensity
 * k tuned for Gaia G band
 */
export function extinctionMagnitude(
  distancePc: number,
  zPc: number
): number {
  const k = 0.001; // extinction coefficient (Gaia-like)
  return k * distancePc * dustDensity(zPc);
}

/**
 * Simple reddening model (BP-RP shift)
 */
export function reddenBpRp(
  bpRp: number,
  extinction: number
): number {
  return bpRp + 0.3 * extinction;
}
