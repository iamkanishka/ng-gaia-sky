import * as THREE from 'three';

export function createStarMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.NormalBlending,

    uniforms: {
      uExposure: { value: 1.2 },
      uFocusIndex: { value: -1.0 },
      uTime: { value: 0.0 }
    },

    vertexShader: `
      attribute float host;
      attribute float starIndex;

      varying vec3 vColor;
      varying float vHost;
      varying float vFocus;
      varying float vDist;

      uniform float uFocusIndex;

      void main() {
        vColor = color;
        vHost = host;
        vFocus = abs(starIndex - uFocusIndex) < 0.5 ? 1.0 : 0.0;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vDist = length(mvPosition.xyz);

        gl_Position = projectionMatrix * mvPosition;

        // Gaia-style depth-scaled point size
        gl_PointSize = clamp(140.0 / vDist, 1.5, 9.0);
      }
    `,

    fragmentShader: `
      precision highp float;

      varying vec3 vColor;
      varying float vHost;
      varying float vFocus;
      varying float vDist;

      uniform float uExposure;
      uniform float uTime;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float r = length(uv);

        // --- Core + halo PSF ---
        float core = exp(-r*r * 40.0);
        float halo = exp(-r*r * 6.0);
        float psf = core + 0.35 * halo;

        if (psf < 0.003) discard;

        // --- Subtle twinkle (distance-damped) ---
        float twinkle = 1.0 + 0.02 * sin(uTime * 2.0 + vDist * 0.05);

        // --- Eye-response brightness curve ---
        vec3 color = vColor * psf * uExposure * twinkle;
        color = pow(color, vec3(0.85)); // perceptual gamma

        // --- Focus glow ---
        if (vFocus > 0.5) {
          color += vec3(0.2, 0.2, 0.35) * halo;
        }

        // --- Exoplanet host warm halo ---
        if (vHost > 0.5) {
          color += vec3(0.15, 0.10, 0.05) * halo;
        }

        gl_FragColor = vec4(color, psf);
      }
    `,
  });
}
