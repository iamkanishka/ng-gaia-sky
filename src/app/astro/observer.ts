/**
 * Sun position in Galactic Cartesian coordinates (pc)
 * IAU / Gaia standard approximation
 */
export const SUN_POSITION = {
  x: -8200, // distance from galactic center
  y: 0,
  z: 20     // height above galactic plane
};

/**
 * Convert galactocentric → observer-centric
 */
export function toObserverFrame(
  x: number,
  y: number,
  z: number
): [number, number, number] {
  return [
    x - SUN_POSITION.x,
    y - SUN_POSITION.y,
    z - SUN_POSITION.z
  ];
}
