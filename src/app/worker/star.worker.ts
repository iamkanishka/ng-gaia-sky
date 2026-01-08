/// <reference lib="webworker" />

import { radecToGalactic, galacticToCartesian } from '../astro/coordinates';
import { toObserverFrame } from '../astro/observer';
import { absoluteMagnitude, apparentMagnitude, fluxFromMagnitude } from '../astro/photometry';
import { extinctionMagnitude } from '../astro/extinction';
import { galacticDensity } from '../astro/galaxy-model';
import { passesGaiaSelection } from '../astro/selection';
import { noisyMagnitude } from '../astro/noise';
import { yearsSinceEpoch } from '../astro/time';

addEventListener('message', ({ data }) => {
  const { stars, year, magLimit, exoHosts } = data;
  const exoSet = new Set<string>(exoHosts ?? []);

  const positions: number[] = [];
  const colors: number[] = [];

  const hostFlags: number[] = [];

  const years = yearsSinceEpoch(year);

  for (const s of stars) {
    // Proper motion
    const ra = s.ra + ((s.pmra ?? 0) * years) / (1000 * 3600);
    const dec = s.dec + ((s.pmdec ?? 0) * years) / (1000 * 3600);

    // Distance
    const distancePc = 1000 / s.parallax;

    // Coordinates
    const { l, b } = radecToGalactic(ra, dec);
    const [gx, gy, gz] = galacticToCartesian(l, b, distancePc);
    const [x, y, z] = toObserverFrame(gx, gy, gz);

    // Photometry
    const M = absoluteMagnitude(s.phot_g_mean_mag, distancePc);
    const A = extinctionMagnitude(distancePc, z);
    const m0 = apparentMagnitude(M, distancePc, A);
    const m = noisyMagnitude(m0);

    // Gaia selection
    if (!passesGaiaSelection(m)) continue;

    const isHost = exoSet.has(String(s.source_id));

    // Limiting magnitude (observer perception)
    const delta = magLimit - m;
    if (delta <= 0) continue;

    // Smooth perceptual fade (0.5 mag width)
    const perceptualWeight = Math.min(1, delta / 0.5);

    // Flux & density
    const baseFlux = fluxFromMagnitude(m);
    const density = galacticDensity(x, y, z);
    const flux = baseFlux * density * perceptualWeight;

    const brightness = Math.min(1, flux * 3e5);

    hostFlags.push(isHost ? 1 : 0);
    positions.push(x, y, z);
    colors.push(brightness, brightness, brightness);
  }

  postMessage(
    {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      hostFlags: new Float32Array(hostFlags),
    },
    []
  );
});
