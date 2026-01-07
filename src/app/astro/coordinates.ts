const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * IAU 1958 Galactic coordinate constants (J2000)
 * Matches Astropy & ESA Gaia Sky
 */
const RA_NGP = 192.85948 * DEG2RAD;
const DEC_NGP = 27.12825 * DEG2RAD;
const L_CP = 32.93192 * DEG2RAD;

/**
 * Convert RA/Dec (deg) → Galactic l,b (deg)
 */
export function radecToGalactic(
  raDeg: number,
  decDeg: number
): { l: number; b: number } {

  const ra = raDeg * DEG2RAD;
  const dec = decDeg * DEG2RAD;

  const sinb =
    Math.sin(dec) * Math.sin(DEC_NGP) +
    Math.cos(dec) * Math.cos(DEC_NGP) * Math.cos(ra - RA_NGP);

  const b = Math.asin(sinb);

  const y = Math.cos(dec) * Math.sin(ra - RA_NGP);
  const x =
    Math.sin(dec) * Math.cos(DEC_NGP) -
    Math.cos(dec) * Math.sin(DEC_NGP) * Math.cos(ra - RA_NGP);

  let l = Math.atan2(y, x) + L_CP;
  if (l < 0) l += 2 * Math.PI;

  return {
    l: l * RAD2DEG,
    b: b * RAD2DEG
  };
}

/**
 * Galactic spherical → Cartesian (pc)
 * Right-handed, Gaia Sky compatible
 */
export function galacticToCartesian(
  lDeg: number,
  bDeg: number,
  distancePc: number
): [number, number, number] {

  const l = lDeg * DEG2RAD;
  const b = bDeg * DEG2RAD;

  const x = distancePc * Math.cos(b) * Math.cos(l);
  const y = distancePc * Math.sin(b);
  const z = distancePc * Math.cos(b) * Math.sin(l);

  return [x, y, z];
}
