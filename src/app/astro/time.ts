/**
 * Gaia DR3 reference epoch
 */
export const GAIA_EPOCH = 2016.0;

/**
 * Years since Gaia epoch
 */
export function yearsSinceEpoch(year: number): number {
  return year - GAIA_EPOCH;
}
