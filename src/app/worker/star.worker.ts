/// <reference lib="webworker" />

import { radecToGalactic, galacticToCartesian } from '../astro/coordinates';
import { toObserverFrame } from '../astro/observer';
import { yearsSinceEpoch } from '../astro/time';

addEventListener('message', ({ data }) => {
  const { stars, year, magLimit } = data;

  const positions: number[] = [];
  const sizes: number[] = [];

  const years = yearsSinceEpoch(year);

  for (const s of stars) {
    // Validate parallax
    if (!s.parallax || s.parallax <= 0) continue;

    // Distance
    const distancePc = Math.min(10000, 1000 / s.parallax);

    // Proper motion
    const ra = s.ra + ((s.pmra ?? 0) * years) / (1000 * 3600);
    const dec = s.dec + ((s.pmdec ?? 0) * years) / (1000 * 3600);

    // Coordinates
    const { l, b } = radecToGalactic(ra, dec);
    const [gx, gy, gz] = galacticToCartesian(l, b, distancePc);
    const [x, y, z] = toObserverFrame(gx, gy, gz);

    // Validate position
    if (![x, y, z].every(Number.isFinite)) continue;

    // Simple magnitude check (no complex selection)
    if (s.phot_g_mean_mag > magLimit) continue;

    // Size based on magnitude (brighter = larger)
    // Charlie Hoey style: magnitude determines apparent size
    const magnitude = s.phot_g_mean_mag;
    const baseSize = Math.pow(10, -0.4 * (magnitude - 5)) * 100;
    const size = Math.max(1, Math.min(10, baseSize));

    positions.push(x, y, z);
    sizes.push(size);
  }

  console.info('Worker processed:', {
    input: stars.length,
    output: positions.length / 3,
  });

  postMessage(
    {
      positions: new Float32Array(positions),
      sizes: new Float32Array(sizes),
    },
    []
  );
});