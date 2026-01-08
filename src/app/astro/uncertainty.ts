const MAS_TO_RAD = Math.PI / (180 * 3600 * 1000);

/**
 * Angular uncertainty (radians) propagated with time
 *
 * σ(t)^2 = σ_pos^2 + (Δt · σ_pm)^2
 */
export function angularUncertainty(
  posErrMas: number,
  pmErrMasYr: number,
  years: number
): number {
  const sigmaMas = Math.sqrt(
    posErrMas * posErrMas +
    (years * pmErrMasYr) * (years * pmErrMasYr)
  );

  return sigmaMas * MAS_TO_RAD;
}

/**
 * Convert angular uncertainty to spatial radius (pc)
 */
export function spatialUncertainty(
  angularSigma: number,
  distancePc: number
): number {
  return distancePc * Math.tan(angularSigma);
}
