/**
 * Approximate Gaia DR3 G-band photometric uncertainty (mag)
 */
export function gaiaPhotometricSigma(gMag: number): number {
  if (gMag < 12) return 0.001;
  if (gMag < 15) return 0.003;
  if (gMag < 17) return 0.01;
  if (gMag < 19) return 0.03;
  return 0.1;
}

/**
 * Gaussian random number (mean 0, std 1)
 */
function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Apply photometric noise ONCE per star
 */
export function noisyMagnitude(gMag: number): number {
  const sigma = gaiaPhotometricSigma(gMag);
  return gMag + gaussianRandom() * sigma;
}
