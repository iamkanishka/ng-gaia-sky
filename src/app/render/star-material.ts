import * as THREE from 'three';

export function createStarMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
uniforms: {
  uExposure: { value: 0.6 },
  uFocusIndex: { value: -1 }
},


    vertexShader: `
     attribute float host;
varying float vHost;
varying vec3 vColor;
uniform float uFocusIndex;
varying float vFocus;

void main() {
  vColor = color;

  // Compare index (cast to float)
  vFocus = abs(float(gl_VertexID) - uFocusIndex) < 0.5 ? 1.0 : 0.0;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = 2.0;
}
    `,

    fragmentShader: `
     varying vec3 vColor;
varying float vHost;
varying float vFocus;
uniform float uExposure;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r2 = dot(c, c);
  float psf = exp(-r2 * 16.0);

  vec3 color = vColor * psf * uExposure;

if (vFocus > 0.5) {
  color += vec3(0.15, 0.15, 0.25) * psf;
}

  // Subtle warm halo for exoplanet hosts
  if (vHost > 0.5) {
    color += vec3(0.12, 0.10, 0.04) * psf;
  }

  gl_FragColor = vec4(color, psf);
}

    `,
  });
}
