/**
 * Gaia DR3 global selection probability (simplified)
 * Based on G-band magnitude
 */
export function gaiaSelectionProbability(gMag: number): number {
  if (gMag < 12) return 1.0;
  if (gMag < 17) return 0.95;
  if (gMag < 19) return 0.7;
  if (gMag < 20.7) return 0.3;
  return 0.0;
}

/**
 * Random acceptance based on selection probability
 */
export function passesGaiaSelection(gMag: number): boolean {
  return Math.random() < gaiaSelectionProbability(gMag);
}
