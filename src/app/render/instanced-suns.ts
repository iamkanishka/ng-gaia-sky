import * as THREE from 'three';

/**
 * Creates an instanced mesh of suns at star positions
 * Uses GPU instancing for maximum performance
 */
export function createInstancedSuns(
  positions: Float32Array,
  count: number,
  sunRadius = 15
): {
  suns: THREE.InstancedMesh;
  coronas: THREE.InstancedMesh;
  update: (time: number) => void;
} {
  // Base geometry (shared by all instances)
  const geometry = new THREE.SphereGeometry(sunRadius, 32, 32);

  // Animated sun material
  const sunMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCoreColor: { value: new THREE.Color(0xfff4e0) },
      uCoronaColor: { value: new THREE.Color(0xff8800) },
    },

    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vInstancePosition;
      uniform float uTime;

      // Simplex noise (compact version)
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        
        // Get instance matrix (position + rotation + scale)
        mat4 instanceMatrix = instanceMatrix;
        vec3 instancePos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        vInstancePosition = instancePos;

        // Animated surface turbulence (unique per instance using position)
        vec3 turbulence = position + instancePos * 0.1;
        float noise1 = snoise(turbulence * 2.0 + uTime * 0.3);
        float noise2 = snoise(turbulence * 4.0 - uTime * 0.5);
        float noise3 = snoise(turbulence * 8.0 + uTime * 0.7);
        
        float displacement = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2) * 5.0;
        
        vec3 newPosition = position + normal * displacement;
        
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(newPosition, 1.0);
      }
    `,

    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vInstancePosition;
      uniform float uTime;
      uniform vec3 uCoreColor;
      uniform vec3 uCoronaColor;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
        );
      }

      void main() {
        vec3 viewDirection = normalize(cameraPosition - vInstancePosition);
        float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);

        // Unique turbulence per instance
        float turbulence = noise(vPosition + vInstancePosition * 0.1 + uTime * 0.2);
        turbulence += noise(vPosition * 1.5 + vInstancePosition * 0.05 - uTime * 0.3) * 0.5;
        turbulence /= 1.5;

        vec3 core = mix(uCoreColor * 0.6, uCoreColor * 1.3, turbulence);
        vec3 corona = uCoronaColor * fresnel * 1.5;

        vec3 finalColor = core + corona;
        finalColor *= 1.8; // Extra brightness

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });

  // Corona material (glow)
  const coronaMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uCoronaColor: { value: new THREE.Color(0xff8800) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vPosition = mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 uCoronaColor;

      void main() {
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

  // Create instanced meshes
  const suns = new THREE.InstancedMesh(geometry, sunMaterial, count);
  suns.frustumCulled = false;

  const coronaGeometry = new THREE.SphereGeometry(sunRadius * 1.5, 32, 32);
  const coronas = new THREE.InstancedMesh(coronaGeometry, coronaMaterial, count);
  coronas.frustumCulled = false;

  // Set instance positions
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];

    matrix.setPosition(x, y, z);
    suns.setMatrixAt(i, matrix);
    coronas.setMatrixAt(i, matrix);
  }

  suns.instanceMatrix.needsUpdate = true;
  coronas.instanceMatrix.needsUpdate = true;

  // Update function for animation
  const update = (time: number) => {
    sunMaterial.uniforms['uTime'].value = time;
  };

  return { suns, coronas, update };
}

/**
 * Creates instanced point lights at star positions
 * (Use sparingly - lights are expensive!)
 */
export function createInstancedLights(
  positions: Float32Array,
  count: number,
  scene: THREE.Scene,
  maxLights = 100 // Limit for performance
): THREE.PointLight[] {
  const lights: THREE.PointLight[] = [];
  const step = Math.max(1, Math.floor(count / maxLights));

  for (let i = 0; i < count; i += step) {
    const light = new THREE.PointLight(0xfff4e0, 0.5, 200);
    light.position.set(
      positions[i * 3],
      positions[i * 3 + 1],
      positions[i * 3 + 2]
    );
    scene.add(light);
    lights.push(light);
  }

  console.info(`💡 Created ${lights.length} point lights`);
  return lights;
}