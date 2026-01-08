/**
 * Thin disk vertical density
 * H ≈ 300 pc (thin disk)
 */
export function diskDensity(zPc: number): number {
  const H = 300;
  return Math.exp(-Math.abs(zPc) / H);
}

/**
 * Bulge density (spherical, central concentration)
 */
export function bulgeDensity(
  xPc: number,
  yPc: number,
  zPc: number
): number {
  const r = Math.sqrt(xPc * xPc + yPc * yPc + zPc * zPc);
  const Rb = 2000;
  return Math.exp(-r / Rb);
}

/**
 * Halo density (very sparse)
 */
export function haloDensity(zPc: number): number {
  return Math.exp(-Math.abs(zPc) / 5000);
}

/**
 * Combined galactic density factor
 */
export function galacticDensity(
  xPc: number,
  yPc: number,
  zPc: number
): number {
  const disk = diskDensity(zPc);
  const bulge = bulgeDensity(xPc, yPc, zPc);
  const halo = haloDensity(zPc) * 0.05;

  return disk + bulge + halo;
}
