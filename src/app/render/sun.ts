import * as THREE from 'three';
import { createSunMaterial } from './sun-material';

/**
 * Creates the Sun mesh at the origin (0, 0, 0)
 * 
 * @param radius - Sun radius in parsecs (default: 30 for visibility)
 * @returns Sun mesh with animated material + point light
 */
export function createSun(radius = 30): {
  sun: THREE.Mesh;
  light: THREE.PointLight;
  update: (time: number) => void;
} {
  // Sun geometry (high detail sphere)
  const geometry = new THREE.SphereGeometry(radius, 64, 64);

  // Animated Sun material
  const material = createSunMaterial();

  const sun = new THREE.Mesh(geometry, material);
  sun.position.set(0, 0, 0);

  // Point light at Sun's center
  const light = new THREE.PointLight(0xfff4e0, 2.0, 10000);
  light.position.set(0, 0, 0);

  // Update function for animation
  const update = (time: number) => {
    material.uniforms['uTime'].value = time;
  };

  return { sun, light, update };
}

/**
 * Creates a subtle corona glow effect around the Sun
 * (Additive transparent sphere)
 */
export function createSunCorona(radius = 30): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius * 1.5, 32, 32);
  
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uCoronaColor: { value: new THREE.Color(0xff8800) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 uCoronaColor;

      void main() {
        // Fresnel glow
        vec3 viewDirection = normalize(-vPosition);
        float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 3.0);

        vec3 color = uCoronaColor * fresnel * 0.8;
        float alpha = fresnel * 0.4;

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  });

  const corona = new THREE.Mesh(geometry, material);
  corona.position.set(0, 0, 0);

  return corona;
}